// @ts-nocheck
const PiranhaMessage = require("../../PiranhaMessage");

class SendBattleEventMessage extends PiranhaMessage {
  constructor(bytes, client) {
    super(bytes);
    this.client = client;
    this.id = 11216;
    this.version = 1;
  }

  async decode() {
    if (this.readVInt() !== 1) return;
    if (this.readVInt() !== 3) return;
    for (let i = 0; i < 5; i++) {
      console.log(this.readVInt());
    }
    this.emote2 = this.readVInt();
    // for (let i = 0; i < 2; i++) {
    //   console.log(this.readVInt());
    // }
    // this.emote2 = this.readVInt();
  }

  async process() {
    this.client.battle.sendEvent(this.emote, this.emote2, this.client);
    console.log("emote " + this.emote, +" emote2 " + this.emote2);
  }
}

module.exports = SendBattleEventMessage;

