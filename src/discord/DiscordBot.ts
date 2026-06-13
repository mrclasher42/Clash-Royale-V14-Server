import type { AppConfig } from "../config/loadConfig";

/**
 * Initializes the Discord bot and exposes `global.sendDiscordMessage(message)`.
 *
 * Battle logs are sent by TCP handlers via `client.ctx.sendDiscordMessage()`
 * which calls this global function when available.
 */
export function initDiscordBot(discordConfig: NonNullable<AppConfig["discord"]>) {
  const Dysnomia = require("@projectdysnomia/dysnomia");

  const token =
    discordConfig.tokenEnv != null
      ? discordConfig.tokenEnv
      : undefined;

  const channelId = discordConfig.channelId;

  if (!token) {
    console.warn(
      `[DiscordBot] Missing Discord token. Set env var ${discordConfig.tokenEnv}.`
    );
    return;
  }

  if (!channelId) {
    console.warn("[DiscordBot] Missing discord.channelId in config.json.");
    return;
  }

  let ready = false;
  const queued: string[] = [];

  const bot = new Dysnomia.Client(token, {
    gateway: {
      // Match old-v13 behavior (and Dysnomia defaults).
      intents: ["guilds", "guildMessages", "messageContent"]
    }
  });

  bot.on("ready", () => {
    ready = true;

    // Flush queued messages (in case matchmaking started very early).
    for (const msg of queued.splice(0, queued.length)) {
      bot.createMessage(channelId, msg);
    }
  });

  bot.on("error", (err: any) => console.error("[DiscordBot] error:", err));
  bot.on("disconnect", (err: any) =>
    console.error("[DiscordBot] disconnect:", err)
  );
  bot.on("shardDisconnect", (err: any) =>
    console.error("[DiscordBot] shardDisconnect:", err)
  );

  // Expose a stable sending function for the TCP server.
  (global as any).sendDiscordMessage = (message: string) => {
    if (!ready) {
      queued.push(message);
      return;
    }

    bot.createMessage(channelId, message);
  };

  bot.connect();
}

