// @ts-nocheck
const PiranhaMessage = require("../../PiranhaMessage");

class BattleResultMessage extends PiranhaMessage {
  constructor(client, ownCrowns, enemyCrowns) {
    super();
    this.id = 22319;
    this.client = client;
    this.version = 0;
    this.ownCrowns = ownCrowns;
    this.enemyCrowns = enemyCrowns;
  }

  async encode() {
    this.writeVInt(0);
    this.writeVInt(0);
    this.writeVInt(0);
    this.writeInt(0);
    this.writeInt(0);
    this.writeInt(0);
    this.writeVInt(this.enemyCrowns);
    this.writeVInt(0);
    this.writeInt(0);
    this.writeVInt(0);
    this.writeVInt(0);
    this.writeVInt(0);
    this.writeVInt(this.ownCrowns);
    this.writeVInt(0);
    this.writeInt(0);
    this.writeVInt(0);
    this.writeBoolean(false);
    this.writeVInt(0);
    this.writeVInt(this.ownCrowns > this.enemyCrowns ? 1 : 0); //0 = lose 1 = win
    this.writeVInt(0);
    this.writeVInt(0);
  }
}

module.exports = BattleResultMessage;

