// @ts-nocheck
const PiranhaMessage = require("../../PiranhaMessage");

class ClanEmoteMessage extends PiranhaMessage {
  constructor(client, jsonParams) {
    super();
    this.id = 24551;
    this.client = client;
    this.version = 0;
    this.jsonParams = jsonParams;
  }

  async encode() {
    this.writeInt(1);
    this.writeInt(0);
    this.writeBoolean(true);
    this.writeBoolean(true);
    this.writeStringReference("sfx/emotes/king_happy_01_dl.ogg");
    this.writeStringReference("");
    this.writeStringReference("");
    this.writeStringReference("sc/emotes_king_01_dl.sc");
    this.writeStringReference("");
    this.writeStringReference("");
    this.writeBoolean(false);
    this.writeBoolean(false);
    this.writeBoolean(false);
    this.writeInt(117000000);
    this.writeInt(16801);
    this.writeVInt(0);
  }
}

module.exports = ClanEmoteMessage;

