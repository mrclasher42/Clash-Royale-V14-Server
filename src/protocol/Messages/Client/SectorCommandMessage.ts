// @ts-nocheck
const PiranhaMessage = require("../../PiranhaMessage");

class SectorCommandMessage extends PiranhaMessage {
  constructor(bytes, client) {
    super(bytes);
    this.client = client;
    this.id = 19066;
    this.version = 0;
  }

  async decode() {
    this.json = {};
    this.readVInt(); // vint: 571330933
    this.json.unk1 = this.readVInt(); //vint: 548
    this.readVInt();
    this.json.unk2 = this.readVInt(); //vint: 124;
    this.json.tick = this.readVInt(); //vint: 548;
    this.json.unk4 = this.readVInt(); //vint: -1;
    this.readVInt(); //vint: 0;
    this.readVInt(); // vint: 69916417;
    this.json.x = this.readVInt(); //vint: 26499;
    this.readVInt(); //vint: -1;
    this.readVInt(); //vint: 3;

    this.json.y = this.readVInt(); //vint: 7499;
    this.json.cardSCID = this.readInt(); //int: 26000004;
    this.json.unk5 = this.readInt(); //int: 0;
    this.json.checksum = this.readInt(); //int: 1900024832;
    console.log(this.json);
    console.log(this.json.cardSCID.toString().slice(0, 4));

    this.json.userHighId = this.client.user.id.high;
    this.json.userLowId = this.client.user.id.low;

    /*{
  unk1: 304,
  unk2: 178,
  tick: 304,
  unk4: -64,
  x: 2,
  y: 5000006,
  cardSCID: 0,
  unk5: 0,
  checksum: 0
  this.writeVInt(33);
this.writeVInt(-1494173208);
this.writeVInt(1);
this.writeVInt(124);
this.writeVInt(317);
this.writeVInt(-1);
this.writeVInt(0);
this.writeVInt(70424893);
this.writeVInt(25500);
this.writeVInt(-1);
this.writeVInt(2);
this.writeVInt(7500);
this.writeInt(26000005);
this.writeInt(0);
this.writeInt(817904640);
}*/

    // if (
    //   this.json.checksum < 100000000 &&
    //   this.client.battle.clients.length > 1
    // ) {
    //   this.client.destroy();
    //   return;
    // }
    if (
      ["2600", "2700", "2800"].includes(
        this.json.cardSCID.toString().slice(0, 4),
      ) ||
      (["5000"].includes(this.json.y.toString().slice(0, 4)) &&
        this.cardSCID === 0)
    ) {
      this.client.battle.commands.push(this.json);
    }

    this.client.battle.battleLastCommandTime = Date.now();
  }

  async process() {
    //await new TrainingSectorStateMessage(this.client).send();
  }
}

module.exports = SectorCommandMessage;

