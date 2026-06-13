// @ts-nocheck
const PiranhaMessage = require("../../PiranhaMessage");

class BattleEventMessage extends PiranhaMessage {
  constructor(client, emoteId, emote2Id, from) {
    super();
    this.id = 29541;
    this.version = 0;
    this.client = client;
    this.emoteId = emoteId;
    this.emote2Id = emote2Id;
    this.from = from;
  }

  async encode() {
    this.writeBoolean(true);
    this.writeByte(0x3);
    this.writeVInt(this.from.user.id.high);
    this.writeVInt(this.from.user.id.low);
    this.writeVInt(this.emoteId);
    this.writeVInt(1726);
    this.writeVInt(0);
    this.writeVInt(3);
    this.writeVInt(this.emote2Id); //emote
    this.writeVInt(0);
    this.writeVInt(1);
  }
}

module.exports = BattleEventMessage;

