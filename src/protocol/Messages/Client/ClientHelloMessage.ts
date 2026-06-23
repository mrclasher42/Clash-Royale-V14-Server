import { loadConfig } from "../../../config/loadConfig";

// @ts-nocheck
const PiranhaMessage = require("../../PiranhaMessage");
const LoginFailedMessage = require("../Server/LoginFailedMessage");

const ServerHelloMessage = require("../Server/ServerHelloMessage");
class ClientHelloMessage extends PiranhaMessage {
  constructor(bytes: any, client: any) {
    super(bytes);
    this.client = client;
    this.id = 10100;
    this.version = 0;
  }

  async decode() {
    this.readInt();
    this.readInt();
    this.readInt();
    this.readInt();
    this.readInt();
    this.userFingerprintSha = this.readString();
  }

  async process() {
    console.log(this.userFingerprintSha);
    // if ((loadConfig()).currentFingerprintSha !== null) {
    //   if (
    //     this.userFingerprintSha !== (loadConfig()).currentFingerprintSha
    //   ) {
    //     setTimeout(() => {
    //       new LoginFailedMessage(this.client, {
    //         //reason: "New update avaliable, update at: dsc.gg/Clashclash",
    //         reason: "patch",
    //       }).send();
    //     }, 2000);
    //     return;
    //   }
    // }
    new ServerHelloMessage(this.client).send();
  }
}

module.exports = ClientHelloMessage;
