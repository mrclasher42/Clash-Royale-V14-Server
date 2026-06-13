// @ts-nocheck
const PiranhaMessage = require("../../PiranhaMessage");

class ClanMessageMessage extends PiranhaMessage {
  constructor(client, jsonParams) {
    super();
    this.id = 24551;
    this.client = client;
    this.version = 0;
    this.jsonParams = jsonParams;
  }

  async encode() {
    this.writeVInt(2);
    this.writeVInt(0);
    this.writeVInt(Date.now() / 1000 | 0);
    this.writeVInt(this.jsonParams.user.id.high);
    this.writeVInt(this.jsonParams.user.id.low);
    this.writeVInt(this.jsonParams.user.id.high);
    this.writeVInt(this.jsonParams.user.id.low);
    this.writeString(this.jsonParams.user.username);
    this.writeVInt(10);
    this.writeVInt(2);
    this.writeVInt(0);
    this.writeBoolean(false);
    this.writeBoolean(false);
    this.writeBoolean(false);
    this.writeInt(0);
    this.writeInt(0);
    this.writeString(this.jsonParams.message || "");

    // emote
    // this.writeInt(1);
    // this.writeInt(0);
    // this.writeBoolean(true);
    // this.writeBoolean(true);
    // this.writeStringReference("sfx/emotes/king_happy_01_dl.ogg");
    // this.writeStringReference("");
    // this.writeStringReference("");
    // this.writeStringReference("sc/emotes_king_01_dl.sc");
    // this.writeStringReference("");
    // this.writeStringReference("");
    // this.writeBoolean(false);
    // this.writeBoolean(false);
    // this.writeBoolean(false);
    // this.writeInt(117000000);
    // this.writeInt(16801);
    // this.writeVInt(0);
  }
}

module.exports = ClanMessageMessage;

