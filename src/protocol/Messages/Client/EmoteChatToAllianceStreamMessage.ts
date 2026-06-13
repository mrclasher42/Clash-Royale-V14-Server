// @ts-nocheck
const PiranhaMessage = require("../../PiranhaMessage");
const ClanEmoteMessage = require("../Server/ClanEmoteMessage");

class EmoteChatToAllianceStreamMessage extends PiranhaMessage {
  constructor(bytes, client) {
    super(bytes);
    this.client = client;
    this.id = 19905;
    this.version = 0;
  }

  async decode() {
    this.readAll();
  }

  async process() {
    await new ClanEmoteMessage(this.client, {user: this.client.user, message: "emote1"}).send();
  }
}

module.exports = EmoteChatToAllianceStreamMessage;

