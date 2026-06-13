const fs = require("fs");
const path = require("path");

class MessageFactory {
  constructor() {
    this.packets = {};
    this.init();
  }

  init() {
    const messagesDir = path.resolve(__dirname, "Messages/Client");

    try {
      const files = fs.readdirSync(messagesDir);
      for (const file of files) {
        if (!file.endsWith(".js") && !file.endsWith(".ts")) continue;

        const fullPath = path.join(messagesDir, file);
        try {
          const mod = require(fullPath);
          const PacketClass = mod?.default ?? mod;

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

  handle(id) {
    return this.packets[id];
  }

  getPackets() {
    return Object.keys(this.packets);
  }
}

module.exports = { MessageFactory };