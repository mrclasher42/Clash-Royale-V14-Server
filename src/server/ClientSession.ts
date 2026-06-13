import net from "net";
import type { AppConfig } from "../config/loadConfig";
import type { Database } from "../db/Database";

export type ClientSession = net.Socket & {
  // Authentication state
  isAuthenticated: boolean;

  // Anti-spam state
  packetCount: number;
  lastPacketReset: number;

  // Optional player/game state (set by handlers)
  user?: any;
  battle?: any;
  flagged?: boolean;

  // Logging helper
  log: (text: string) => void;

  // Shared server context for handlers (replaces `global.*`)
  ctx: ServerContext;
};

export type ServerContext = {
  config: AppConfig;
  database: Database;
  rootPath: string;

  connectedPlayers: ClientSession[];
  userInBattleSearch: Map<number, ClientSession | null>;

  // Persisted counter for new players.
  newUserIdFile: string;
  consumeNewUserId: () => number;

  sendDiscordMessage: (message: string) => void;
};

