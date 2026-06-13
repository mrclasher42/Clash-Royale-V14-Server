// @ts-nocheck
const Battle = require("../../../utils/Battle");

class StartBattle {
  constructor(client) {
    this.client = client;
    this.commandID = 751;
  }

  decode(buf) {
    buf.readVInt();
    buf.readVInt();
    buf.readVInt();
    buf.readVInt();
    buf.readVInt();
    buf.readVInt();
    buf.readVInt();
    buf.readVInt();
    this.gameMode = buf.readVInt();
    console.log("GameMode: " + this.gameMode);
  }
  process() {
    if (this.client.flagged) {
      return;
    }
    const ctx = this.client.ctx;
    let myIP = this.client.remoteAddress.replace(/^::ffff:/, "");

    for (let connectedPlayer of ctx.connectedPlayers) {
      if (connectedPlayer.battle) {
        if (
          connectedPlayer.remoteAddress.replace(/^::ffff:/, "") === myIP &&
          connectedPlayer !== this.client
        ) {
          this.client.destroy();
          //connectedPlayer.destroy();
          return;
        }
      }
    }
    if (ctx.userInBattleSearch.get(this.gameMode) === null) {
      ctx.userInBattleSearch.set(this.gameMode, this.client);
      ctx.sendDiscordMessage(
        `${this.client.user.username || "someone"} Is Searching for battle on Eriks Royale`,
      );
    } else if ([undefined, this.client].includes(ctx.userInBattleSearch.get(this.gameMode))) {
      //await new TrainSectorStateMessage(this.client).send();
      let b = new Battle([ctx.userInBattleSearch.get(this.gameMode), this.client]);
      b.start();
      ctx.userInBattleSearch.get(this.gameMode) = null;
    }
  }
}

module.exports = StartBattle;

