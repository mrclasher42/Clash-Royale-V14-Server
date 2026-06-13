// @ts-nocheck
const PiranhaMessage = require("../../PiranhaMessage");
const JoinClanMessage = require("../Server/JoinClanMessage");

class AskForClanCreationMessage extends PiranhaMessage {
  constructor(bytes, client) {
    super(bytes);
    this.client = client;
    this.id = 19278;
    this.version = 0;
  }

  async decode() {}

  async process() {
    new JoinClanMessage(this.client).send();
  }
}

module.exports = AskForClanCreationMessage;

