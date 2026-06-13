// @ts-nocheck
const PiranhaMessage = require("../../PiranhaMessage");

class CustomMessage extends PiranhaMessage {
  constructor(bytes, client) {
    super(bytes);
    this.client = client;
    this.id = 11111;
    this.version = 0;
  }

  async decode() {
    this.stringMessage = this.readString();
    console.log(this.stringMessage);
  }

  async process() {}
}

module.exports = CustomMessage;

