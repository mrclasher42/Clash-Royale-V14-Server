import net from "net";
import path from "path";
import fs from "fs";
import express from "express";
import morgan from "morgan";
import figlet from "figlet";
import { Packetizer } from "../protocol/packetizer/Packetizer";
import type { AppConfig } from "../config/loadConfig";
import type { Database } from "../db/Database";
import type { MessageFactory } from "../protocol/MessageFactory";
import type { CommandManager } from "../protocol/CommandManager";
import type { ClientSession, ServerContext } from "./ClientSession";
const Hash = require("crypto");


function getAllFiles(dir: string, baseDir = dir) {
  let results: any[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      results = results.concat(getAllFiles(fullPath, baseDir));
    } else if (entry.isFile()) {
      const relativePath = path.relative(baseDir, fullPath);

      if (relativePath !== "fingerprint.json") {
        results.push(relativePath);
      }
    }
  }

  return results;
}

export class TcpGameServer {
  private server: net.Server;
  private readonly ctx: ServerContext;
  private readonly packets: string[];
  private readonly messages: MessageFactory;
  private readonly commands: CommandManager;
  private readonly bannedIPs = new Map<string, number>();
  private readonly ipConnections = new Map<string, number>();
  public contentPatchServer = express();

  // Source of truth for new-user system ids.
  private newUserId: number;

  constructor(opts: {
    port: number;
    config: AppConfig;
    database: Database;
    messages: MessageFactory;
    commands: CommandManager;
  }) {
    this.contentPatchServer.use(morgan("dev"));

    
    const projectRoot = path.resolve(__dirname, "../..");
    
    this.server = new net.Server();
    
    this.newUserId = 1;
    if (fs.existsSync(opts.config.persistence.newUserIdFile)) {
      const raw = fs.readFileSync(opts.config.persistence.newUserIdFile, "utf8");
      const parsed = parseInt(raw, 10);
      if (!Number.isNaN(parsed)) this.newUserId = parsed;
    }
    
    const sendDiscordMessage = (message: string) => {
      const fn = (global as any).sendDiscordMessage;
      if (typeof fn === "function") fn(message);
    };
    
    this.ctx = {
      config: opts.config,
      database: opts.database,
      rootPath: projectRoot,
      connectedPlayers: [],
      userInBattleSearch: new Map<number, ClientSession | null>(),
      newUserIdFile: opts.config.persistence.newUserIdFile,
      consumeNewUserId: () => {
        const idToUse = this.newUserId;
        this.newUserId += 1;
        fs.writeFileSync(this.ctx.newUserIdFile, this.newUserId.toString());
        return idToUse;
      },
      sendDiscordMessage
    };

    this.ctx.userInBattleSearch.set(-64, null);
    this.ctx.userInBattleSearch.set(480, null);
    
    // Snapshot loaded packet ids once at startup.
    this.packets = opts.messages.getPackets();
    this.messages = opts.messages;
    this.commands = opts.commands;
    
    this.server.on("connection", (socket) => this.handleConnection(socket));
    
    // Keep process error behavior from old-v13.
    process.on("uncaughtException", console.error);
    process.on("unhandledRejection", console.error);
    
    
    
    const gamefilesDir = path.join(projectRoot, "Gamefiles");
    const fingerprintPath = path.join(gamefilesDir, "fingerprint.json");
    console.log(gamefilesDir);
    console.log(fingerprintPath);
    
    let fingerprint: any = { files: [], version: "14.593.1", sha: "" };
    
    if (!fingerprint.files) {
      fingerprint.files = [];
    }
    
    const actualFiles = getAllFiles(gamefilesDir);
    
    // Add new files automatically
    for (const filePath of actualFiles) {
      const exists = fingerprint.files.find((f: any) => f.file === filePath);
      
      if (!exists) {
        fingerprint.files.push({
          file: filePath,
          sha: "",
        });
      }
    }
    
    let allshas = "";
    
    // Update hashes + remove deleted files
    fingerprint.files = fingerprint.files.filter((fileObj: any) => {
      const fullPath = path.join(gamefilesDir, fileObj.file);
      
      if (!fs.existsSync(fullPath)) {
        return false;
      }
      
      const fileBuffer = fs.readFileSync(fullPath);
      const hashhex = Hash.createHash("sha1").update(fileBuffer).digest("hex");
      
      fileObj.sha = hashhex;
      allshas += hashhex;
      
      return true;
    });
    
    // Generate global fingerprint hash
    fingerprint.sha = Hash.createHash("sha1").update(allshas).digest("hex");
    
    let fingerprintSha = fingerprint.sha;
    
    // Replace "/" like your original script
    let fingerprintString = JSON.stringify(fingerprint)
    .replace(/\\\\/g, '\\/');

    console.log(fingerprintString);
    
    // Save updated fingerprint
    fs.writeFileSync(fingerprintPath, fingerprintString);

    this.contentPatchServer.use(
      "/" + fingerprint.sha,
      express.static(path.join(projectRoot, "Gamefiles")),
    );
  }

  async start(): Promise<void> {
    this.server.once("listening", () => {
      try {
        // figlet exposes both promise + sync APIs depending on version.
        console.log(figlet.textSync("Eriks Royale v14"));
      } catch {
        console.log("Eriks Royale v14");
      }
      console.log(`[SERVER] >> Server started on ${this.ctx.config.port} port!`);
    });

    this.contentPatchServer.listen(9331, () => {
      console.log(
        "content patch server started at port " + 9331,
      );
    });

    await new Promise<void>((resolve) => {
      this.server.listen(this.ctx.config.port, resolve);
    });
  }

  private handleConnection(socket: net.Socket) {
    socket.setNoDelay(true);

    const ip = (socket.remoteAddress ?? "").replace(/^::ffff:/, "");
    const {
      maxConnectionsPerIp,
      maxPacketsPerSecond,
      loginTimeoutMs,
      banTimeMs,
      maxPacketSizeBytes
    } = this.ctx.config.antiDdos;

    const { preAuthAllowedPacketIds, loginPacketId } = this.ctx.config.protocol;

    const isBanned = (ipToCheck: string): boolean => {
      if (!this.bannedIPs.has(ipToCheck)) return false;

      if (Date.now() > (this.bannedIPs.get(ipToCheck) as number)) {
        this.bannedIPs.delete(ipToCheck);
        return false;
      }

      return true;
    };

    const banIP = (ipToBan: string, reason: string) => {
      console.log(`[${ipToBan}] >> BANNED (${reason})`);
      this.bannedIPs.set(ipToBan, Date.now() + banTimeMs);
    };

    // 🔥 Reject banned IP
    if (isBanned(ip)) {
      socket.destroy();
      return;
    }

    // 🔥 Max connections per IP
    const currentConnections = this.ipConnections.get(ip) || 0;
    if (currentConnections >= maxConnectionsPerIp) {
      banIP(ip, "Too many connections");
      socket.destroy();
      return;
    }

    this.ipConnections.set(ip, currentConnections + 1);

    const client = socket as unknown as ClientSession;

    // =============================
    // CLIENT STATE
    // =============================
    client.isAuthenticated = false;
    client.packetCount = 0;
    client.lastPacketReset = Date.now();
    client.ctx = this.ctx;
    client.battle = null;

    // Add to global list safely
    this.ctx.connectedPlayers.push(client);

    client.log = (text: string) => {
      console.log(`[${ip}] >> ${text}`);
    };

    client.log("Connection accepted");

    // 🔥 Login timeout protection
    const loginTimeout = setTimeout(() => {
      if (!client.isAuthenticated) {
        client.log("Login timeout");
        client.destroy();
      }
    }, loginTimeoutMs);

    const packetizer = new Packetizer(maxPacketSizeBytes);

    socket.on("data", (data: Buffer) => {
      // 🔥 Rate limit per second
      if (Date.now() - client.lastPacketReset > 1000) {
        client.packetCount = 0;
        client.lastPacketReset = Date.now();
      }

      client.packetCount++;

      if (client.packetCount > maxPacketsPerSecond) {
        banIP(ip, "Packet spam");
        client.destroy();
        return;
      }

      packetizer.packetize(data, async (packetizedData) => {
        const message = {
          id: packetizedData.readUInt16BE(0),
          len: packetizedData.readUIntBE(2, 3),
          version: packetizedData.readUInt16BE(5),
          payload: packetizedData.slice(7),
          client
        };

        // 🔐 Block packets before login
        if (
          !client.isAuthenticated &&
          !preAuthAllowedPacketIds.includes(message.id)
        ) {
          client.log(`Blocked packet ${message.id}`);
          client.destroy();
          return;
        }

        if (this.packets.includes(String(message.id))) {
          try {
            const HandlerClass = this.messages.handle(message.id);
            if (!HandlerClass) {
              client.log(`Unknown packet ${message.id}`);
              return;
            }

            const packet = new HandlerClass(message.payload, client);
            client.log(`packet ${message.id} is handled`);

            await packet.decode();
            await packet.process();

            if (message.id === loginPacketId) {
              client.isAuthenticated = true;
              clearTimeout(loginTimeout);
              client.log("Authenticated");
            }
          } catch (e) {
            console.error(e);
            client.destroy();
          }
        } else {
          client.log(`Unknown packet ${message.id}`);
        }
      });
    });

    const cleanup = (() => {
      let cleaned = false;
      return () => {
        if (cleaned) return;
        cleaned = true;

        const index = this.ctx.connectedPlayers.indexOf(client);
        if (index !== -1) this.ctx.connectedPlayers.splice(index, 1);

          for (let key of this.ctx.userInBattleSearch.keys()) {    
            if (this.ctx.userInBattleSearch.get(key) === client) {
              this.ctx.userInBattleSearch.set(key, null);
            }
          }

        const count = this.ipConnections.get(ip) || 1;
        if (count <= 1) this.ipConnections.delete(ip);
        else this.ipConnections.set(ip, count - 1);

        clearTimeout(loginTimeout);
      };
    })();

    client.on("close", cleanup);
    client.on("end", cleanup);
    client.on("error", (error) => {
      console.error(error);
      cleanup();
      client.destroy();
    });
  }
}

