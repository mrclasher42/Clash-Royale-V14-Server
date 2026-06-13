import * as fs from "fs";
import * as path from "path";

export class MessageFactory {
  private packets: Record<number, any> = {};

  constructor() {
    this.init();
  }

  private init() {
    const messagesDir = path.resolve(__dirname, "Messages/Client");

    try {
      const files = fs.readdirSync(messagesDir);
      for (const file of files) {
        if (!file.endsWith(".js") && !file.endsWith(".ts")) continue;

        const fullPath = path.join(messagesDir, file);
        try {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const mod = require(fullPath);
          const PacketClass = mod?.default ?? mod;

          // Packet classes must support no-arg construction (for `id` discovery).
          const instance = new PacketClass();
          if (typeof instance?.id !== "number") continue;

          this.packets[instance.id] = PacketClass;
        } catch (err) {
          console.error(`[MessageFactory] Failed to load ${file}:`, err);
        }
      }
    } catch (err) {
      console.error("[MessageFactory] init failed:", err);
    }
  }

  handle(id: number): any {
    return this.packets[id];
  }

  getPackets(): string[] {
    return Object.keys(this.packets);
  }
}

