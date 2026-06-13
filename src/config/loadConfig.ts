import fs from "fs";
import path from "path";

export type AppConfig = {
  port: number;
  patchUrl: string
  discord?: {
    enabled: boolean;
    channelId?: string;
    tokenEnv?: string; // env var name to read the Discord bot token
  };
  antiDdos: {
    maxConnectionsPerIp: number;
    maxPacketsPerSecond: number;
    maxPacketSizeBytes: number;
    loginTimeoutMs: number;
    banTimeMs: number;
  };
  protocol: {
    loginPacketId: number;
    preAuthAllowedPacketIds: number[];
  };
  persistence: {
    databaseFile: string; // absolute path
    newUserIdFile: string; // absolute path
  };
};

const DEFAULTS: Omit<AppConfig, "persistence"> & {
  persistence: { databaseFile: string; newUserIdFile: string };
} = {
  port: 9330,
  patchUrl: "http://127.0.0.1:9331",
  discord: {
    enabled: false,
    channelId: "",
    tokenEnv: "DISCORD_BOT_TOKEN"
  },
  antiDdos: {
    maxConnectionsPerIp: 3,
    maxPacketsPerSecond: 15,
    maxPacketSizeBytes: 10240,
    loginTimeoutMs: 15000,
    banTimeMs: 1800000
  },
  protocol: {
    loginPacketId: 10101,
    preAuthAllowedPacketIds: [10101, 10100, 11111, 14173, 10108]
  },
  persistence: {
    databaseFile: "database.json",
    newUserIdFile: "newUserId.txt"
  }
};

export function loadConfig(): AppConfig {
  const projectRoot = path.resolve(__dirname, "../..");
  const configPath = path.join(projectRoot, "config.json");

  let raw: unknown = {};
  if (fs.existsSync(configPath)) {
    raw = JSON.parse(fs.readFileSync(configPath, "utf8"));
  }

  const merged = {
    ...DEFAULTS,
    ...(raw as any)
  } as AppConfig;

  // Resolve file paths after merge.
  merged.persistence = {
    databaseFile: path.resolve(projectRoot, merged.persistence.databaseFile),
    newUserIdFile: path.resolve(projectRoot, merged.persistence.newUserIdFile)
  };

  return merged;
}

