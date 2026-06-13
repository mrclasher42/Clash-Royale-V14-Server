/**
 * Initializes the Discord bot and exposes `global.sendDiscordMessage(message)`.
 *
 * Battle logs are sent by TCP handlers via `client.ctx.sendDiscordMessage()`
 * which calls this global function when available.
 */
function initDiscordBot(discordConfig) {
  const Dysnomia = require("@projectdysnomia/dysnomia");

  const token = discordConfig.tokenEnv != null ? discordConfig.tokenEnv : undefined;
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
  const queued = [];

  const bot = new Dysnomia.Client(token, {
    gateway: {
      intents: ["guilds", "guildMessages", "messageContent"]
    }
  });

  bot.on("ready", () => {
    ready = true;

    for (const msg of queued.splice(0, queued.length)) {
      bot.createMessage(channelId, msg);
    }
  });

  bot.on("error", (err) => console.error("[DiscordBot] error:", err));
  bot.on("disconnect", (err) => console.error("[DiscordBot] disconnect:", err));
  bot.on("shardDisconnect", (err) => console.error("[DiscordBot] shardDisconnect:", err));

  global.sendDiscordMessage = (message) => {
    if (!ready) {
      queued.push(message);
      return;
    }

    bot.createMessage(channelId, message);
  };

  bot.connect();
}

module.exports = { initDiscordBot };