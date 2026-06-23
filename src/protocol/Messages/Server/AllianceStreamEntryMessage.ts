// @ts-nocheck
const PiranhaMessage = require('../../PiranhaMessage')

class AllianceStreamEntryMessage extends PiranhaMessage {
  constructor (client) {
    super()
    this.id = 27016
    this.client = client
    this.version = 1
  }

  async encode () {
    this.writeBoolean(true);
    this.writeInt(0);
    this.writeInt(14709138);
    this.writeString("clan1");
    this.writeInt(16000123);
    this.writeVInt(1);
    this.writeVInt(1);
    this.writeVInt(0);
    this.writeVInt(0);
    this.writeVInt(0);
    this.writeVInt(0);
    this.writeVInt(0);
    this.writeVInt(0);
    this.writeVInt(0);
    this.writeVInt(0);
    this.writeInt(0);
    this.writeInt(57000006);
    this.writeBoolean(false);
    this.writeVInt(0);
    this.writeVInt(0);
    this.writeVInt(0);
    this.writeBoolean(false);
    this.writeBoolean(false);
    this.writeBoolean(false);
    this.writeBoolean(false);
    this.writeVInt(0);
    this.writeBoolean(false);
    this.writeVInt(0);
    this.writeString("");
    this.writeVInt(10); //clan members

    for (let i = 0; i < 10; i++) {
      this.writeInt(0);
      this.writeInt(70424893 + i);
      this.writeString("Clash");
      this.writeInt(54000001);
      this.writeVInt(2);
      this.writeVInt(90);
      this.writeVInt(0);
      this.writeVInt(0);
      this.writeVInt(0);
      this.writeVInt(0);
      this.writeVInt(0);
      this.writeVInt(0);
      this.writeVInt(0);
      this.writeBoolean(false);
      this.writeBoolean(false);
      this.writeInt(1775862096);
      this.writeBoolean(true);
      this.writeInt(0);
      this.writeInt(70424893 + i);
      this.writeLong(0);
      this.writeVInt(0);
      this.writeVInt(-1);
      this.writeVInt(0);
      this.writeVInt(0);
      this.writeVInt(0);
      this.writeVInt(0);
      this.writeVInt(0);
    }

    this.writeLong(0);
    this.writeVInt(0);
    this.writeVInt(-1);
    this.writeVInt(0);
    this.writeVInt(0);
    this.writeVInt(0);
    this.writeVInt(0);
    this.writeVInt(0);
    this.writeVInt(0);
    this.writeBoolean(false);
    this.writeBoolean(false);
  }
}

module.exports = AllianceStreamEntryMessage

