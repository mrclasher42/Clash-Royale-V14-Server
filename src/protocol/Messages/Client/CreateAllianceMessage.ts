// @ts-nocheck
const PiranhaMessage = require("../../PiranhaMessage")
const AllianceStreamEntryMessage = require("../Server/AllianceStreamEntryMessage")
const Message29314 = require("../Server/Message29314")

class CreateAllianceMessage extends PiranhaMessage {
  constructor(bytes, client) {
    super(bytes)
    this.id = 12696
    this.client = client
    this.version = 0
  }

  decode() {
    this.clanName = this.readString();
    console.log(this.clanName);
  }

  process() {
    new Message29314(this.client).send();
    new AllianceStreamEntryMessage(this.client).send();
  }
}

module.exports = CreateAllianceMessage
