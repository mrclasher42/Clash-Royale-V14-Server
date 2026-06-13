// @ts-nocheck
const PiranhaMessage = require("../../PiranhaMessage");

class JoinClanMessage extends PiranhaMessage {
  constructor(client) {
    super();
    this.id = 25693;
    this.client = client;
    this.version = 0;
  }

  async encode() {
    this.writeVInt(293);
    this.writeVInt(1);
    this.writeVInt(-1);
    this.writeVInt(-1);
    this.writeVInt(0);
    this.writeVInt(0);
    this.writeString("clan1");
    this.writeVInt(0);
    this.writeInt(16000052);
    this.writeBoolean(true);
    this.writeInt(0); //clan high id
    this.writeInt(14709126); //clan low id
    this.writeBoolean(true);
  }
}

module.exports = JoinClanMessage;

