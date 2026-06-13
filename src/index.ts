import { loadConfig } from "./config/loadConfig";
import { Database } from "./db/Database";
import { CommandManager } from "./protocol/CommandManager";
import { MessageFactory } from "./protocol/MessageFactory";
import { TcpGameServer } from "./server/TcpGameServer";
import { initDiscordBot } from "./discord/DiscordBot";

async function main() {
  const config = loadConfig();

  const database = new Database(config.persistence.databaseFile);

  const messages = new MessageFactory();
  const commands = new CommandManager();

  if (config.discord?.enabled) {
    try {
      initDiscordBot(config.discord);
    } catch (err) {
      console.error(err);
    }
  }

  const server = new TcpGameServer({
    port: config.port,
    config,
    database,
    messages,
    commands,
  });

  await server.start();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
