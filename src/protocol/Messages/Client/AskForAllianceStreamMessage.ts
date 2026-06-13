// @ts-nocheck
const PiranhaMessage = require("../../PiranhaMessage");
const AllianceStreamEntryMessage = require("../Server/AllianceStreamEntryMessage");

class AskForAllianceStreamMessage extends PiranhaMessage {
  constructor(bytes, client) {
    super(bytes);
    this.client = client;
    this.id = 11163;
    this.version = 0;
  }

  async decode() {}

  async process() {
    await new AllianceStreamEntryMessage(this.client).send()
  }
}

module.exports = AskForAllianceStreamMessage;

