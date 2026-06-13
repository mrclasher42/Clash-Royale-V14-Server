// @ts-nocheck
const PiranhaMessage = require("../../PiranhaMessage");
const ClanMessageMessage = require("../Server/ClanMessageMessage");

class ChatToAllianceStreamMessage extends PiranhaMessage {
  constructor(bytes, client) {
    super(bytes);
    this.client = client;
    this.id = 19594;
    this.version = 0;
  }

  async decode() {
    this.readByte();
    this.message = this.readString();
  }

  async process() {
    if (this.message.length === 5) {
      if (this.message.startsWith("{") && this.message.endsWith("7")) {
        let yourcrowns = parseInt(this.message.charAt(1));
        let enemycrowns = parseInt(this.message.charAt(3));
        this.client.battle.setCrowns(this.client, yourcrowns);
        if (
          this.client.battle.getOpponentCrowns(this.client) === 0 &&
          enemycrowns > 0
        ) {
          this.client.battle.setEnemyCrowns(this.client, enemycrowns);
        }
        return;
      }
    }

    await new ClanMessageMessage(this.client, {user: this.client.user, message: this.message}).send();
  }
}

module.exports = ChatToAllianceStreamMessage;

