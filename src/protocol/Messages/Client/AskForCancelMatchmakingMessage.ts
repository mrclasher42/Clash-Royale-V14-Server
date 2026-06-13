// @ts-nocheck
const PiranhaMessage = require("../../PiranhaMessage");
const CancelMatchmakingMessage = require("../Server/CancelMatchmakingMessage");

class AskForCancelMatchmakingMessage extends PiranhaMessage {
  constructor(bytes, client) {
    super(bytes);
    this.client = client;
    this.id = 18057;
    this.version = 1;
  }

  async decode() {}

  async process() {
    //await new Promise(resolve => setTimeout(resolve, 1000))
    const ctx = this.client.ctx;

    for (let key of ctx.userInBattleSearch.keys()) {    
      if (ctx.userInBattleSearch.get(key) === this.client) {
        ctx.userInBattleSearch.set(key, null);
      }
    }

    await new CancelMatchmakingMessage(this.client).send();
  }
}

module.exports = AskForCancelMatchmakingMessage;

