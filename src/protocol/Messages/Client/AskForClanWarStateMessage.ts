// @ts-nocheck
const PiranhaMessage = require("../../PiranhaMessage");
const ClanWarStateMessage = require("../Server/ClanWarStateMessage");

class AskForClanWarStateMessage extends PiranhaMessage {
  constructor(bytes, client) {
    super(bytes);
    this.client = client;
    this.id = 14150;
    this.version = 0;
  }

  async decode() {}

  async process() {
    // const ctx = this.client.ctx;
    // const user = this.client.user;
    // const clan = ctx.clanDatabase.findClanByMember(user.id.low);
    // if (clan) {
    new ClanWarStateMessage(this.client, clan).send();
    // }
  }
}

module.exports = AskForClanWarStateMessage;
