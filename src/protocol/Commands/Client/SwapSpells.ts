// @ts-nocheck
const TrainingSectorStateMessage = require("../../Messages/Server/TrainingSectorStateMessage");

class SwapSpells {
  constructor(client) {
    this.client = client;
    this.commandID = 955;
  }

  decode(buf) {
    buf.readVInt();
    buf.readVInt();
    buf.readVInt();
    buf.readVInt();
    this.positionIndex = buf.readVInt();

    for (let i = 0; i < 6; i++) {
      buf.readByte();
    }

    this.card = buf.readInt();
    console.log(this.card);
    console.log(this.positionIndex);

    console.log(buf.readAll());
  }
  process() {
    if (this.positionIndex <= 7 && this.card != 0) {
      if (this.card.toString().length === 8) {
        if (
          this.card.toString().startsWith("2600") ||
          this.card.toString().startsWith("2700") ||
          this.card.toString().startsWith("2800")
        ) {
          console.log("old");
          console.log(this.client.user.deck);
          this.client.user.deck[this.positionIndex] = this.card;
          console.log("new");
          console.log(this.client.user.deck);
          this.client.ctx.database.update(this.client.user._systemid, this.client.user);
        }
      }
    }
  }
}

module.exports = SwapSpells;

