const BattleEventMessage = require("../protocol/Messages/Server/BattleEventMessage");
const BattleResultMessage = require("../protocol/Messages/Server/BattleResultMessage");
const SectorHearbeatMessage = require("../protocol/Messages/Server/SectorHearbeatMessage");

const SectorStateMessage = require("../protocol/Messages/Server/SectorStateMessage");
const TouchdownDraftSectorStateMessage = require("../protocol/Messages/Server/TouchdownDraftSectorStateMessage");
const TrainingSectorStateMessage = require("../protocol/Messages/Server/TrainingSectorStateMessage");

class Battle {
  hearBeatId: number;
  hearBeat: any;
  commands: any[];
  battleLastCommandTime: number;
  crowns: number[];
  gameMode: string;
  sectorStateClass: any;
  clients: any[];

  constructor(clients: any[]) {
    this.hearBeatId = 1;
    this.commands = [];
    this.battleLastCommandTime = Date.now();
    this.crowns = [];
    this.gameMode = "ladder";
    this.sectorStateClass = SectorStateMessage;

    // if (Math.random() < 0.5) {
    //   this.gameMode = "touchdown";
    //   this.sectorStateClass = TouchdownDraftSectorStateMessage;
    // }

    this.clients = clients;
    for (let i = 0; i < this.clients.length; i++) {
      let el = this.clients[i];
      el.battle = this;
      this.crowns.push(0);
    }
  }

  start() {
    if (this.clients.length >= 2) {
      //new StopHomeLogicMessage(this.clients[0]).send();
      new this.sectorStateClass(this.clients[0], this.clients[0], this.clients[1]).send();

      //new StopHomeLogicMessage(this.clients[1]).send();
      new this.sectorStateClass(this.clients[1], this.clients[0], this.clients[1]).send();
    } else {
      //new StopHomeLogicMessage(this.clients[0]).send();
      new TrainingSectorStateMessage(this.clients[0]).send();
    }

    setTimeout(() => {
      this.hearBeat = setInterval(() => {
        this.sendHearBeat();
      }, 500);
    }, 5000);
  }

  sendHearBeat() {
    if (Date.now() - this.battleLastCommandTime > 3000 && this.hearBeatId >= 10 * 2) {
      this.finish();
      return;
    }

    new SectorHearbeatMessage(this.clients[0], this.hearBeatId, this.commands, false).send();
    if (this.clients.length >= 2) {
      new SectorHearbeatMessage(this.clients[1], this.hearBeatId, this.commands, true).send();
    }

    this.commands = [];
    this.hearBeatId += 1;
  }

  setCrowns(client: any, crowns: number) {
    this.crowns[this.clients.indexOf(client)] = crowns;
    // console.log("set crowns to " + crowns);
  }

  setEnemyCrowns(client: any, crowns: number) {
    this.crowns[this.clients.indexOf(client) == 0 ? 1 : 0] = crowns;
    // console.log("set enemy crowns to " + crowns);
  }

  getOpponentCrowns(client: any) {
    return this.crowns[this.clients.indexOf(client) == 0 ? 1 : 0];
  }

  sendResult() {
    const player1Crowns = this.crowns[0];
    const player2Crowns = this.crowns[1];
    let player1trophies = 0;
    let player2trophies = 0;

    if (player1Crowns > player2Crowns) {
      player1trophies = 30;
    } else {
      player1trophies = -30;
    }
    player2trophies = -player1trophies;

    new BattleResultMessage(this.clients[0], player1Crowns, player2Crowns, player1trophies).send();
    if (this.clients.length >= 2) {
      new BattleResultMessage(this.clients[1], player2Crowns, player1Crowns, player2trophies).send();
    }

    if (this.clients.length >= 2) {
      if (!this.clients[0].user.trophies) {
        this.clients[0].user.trophies = 0;
      }

      this.clients[0].user.trophies += player1trophies;
      if (this.clients[0].user.trophies < 0) {
        this.clients[0].user.trophies = 0;
      }

      if (!this.clients[1].user.trophies) {
        this.clients[1].user.trophies = 0;
      }
      this.clients[1].user.trophies += player2trophies;
      if (this.clients[1].user.trophies < 0) {
        this.clients[1].user.trophies = 0;
      }
      this.clients[1].ctx.database.update(this.clients[1].user._systemid, this.clients[1].user);
    }
  }

  sendEvent(emoteId: number, emote2Id: number, from: any) {
    let to = this.clients.indexOf(from) === 0 ? 1 : 0;
    if (this.clients[to]) {
      new BattleEventMessage(this.clients[to], emoteId, emote2Id, from).send();
    }
  }

  finish() {
    for (let i = 0; i < this.clients.length; i++) {
      let el = this.clients[i];
      el.battle = null;
    }
    this.sendResult();
    clearInterval(this.hearBeat);
  }
}

export = Battle;

