import * as fs from "fs";
import * as path from "path";

export class CommandManager {
  private commands: Record<number, any> = {};

  constructor() {
    this.init();
  }

  private init() {
    const commandsDir = path.resolve(__dirname, "Commands/Client");

    try {
      const files = fs.readdirSync(commandsDir);
      for (const file of files) {
        if (!file.endsWith(".js") && !file.endsWith(".ts")) continue;

        const fullPath = path.join(commandsDir, file);
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const mod = require(fullPath.replace(".js", "").replace(".ts", ""));
        const CommandClass = mod?.default ?? mod;

        const instance = new CommandClass();
        if (typeof instance?.commandID !== "number") continue;

        this.commands[instance.commandID] = CommandClass;
      }
    } catch(e) {
      console.error(e);
      console.error(`[CommandManager] Failed to load:`, e);
    }
  }

  handle(id: number): any {
    return this.commands[id];
  }

  getCommands(): string[] {
    return Object.keys(this.commands);
  }
}

