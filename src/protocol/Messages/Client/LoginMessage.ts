import { loadConfig } from "../../../config/loadConfig";

// @ts-nocheck
const PiranhaMessage = require("../../PiranhaMessage");
const LoginFailedMessage = require("../Server/LoginFailedMessage");
const LoginOkMessage = require("../Server/LoginOkMessage");
const OwnHomeDataMessage = require("../Server/OwnHomeDataMessage");
const AllianceStreamEntryMessage = require("../Server/AllianceStreamEntryMessage");
let { generateToken } = require("../../../utils/TokenGenerator");
let fs = require("fs");
let path = require("path");

class LoginMessage extends PiranhaMessage {
  constructor(bytes: any, client: any) {
    super(bytes);
    this.client = client;
    this.id = 10101;
    this.version = 1;
  }

  async decode() {
    this.data = {};

    this.data.HighID = this.readInt();
    this.data.LowID = this.readInt();
    this.data.Token = this.readString();
    this.data.Major = this.readVInt();
    this.data.Build = this.readVInt();
    this.data.Content = this.readVInt();

    this.data.resourceSha = this.readString();

    console.log(this.data);
  }

  async process() {
    if (this.data.Content === 377) {
      this.client.flagged = true;
    }
    let currentFingerprintSha = JSON.parse(fs.readFileSync(path.resolve("Gamefiles/fingerprint.json"), "utf-8")).sha;
    if (currentFingerprintSha !== null) {
      if (
        this.data.resourceSha !== currentFingerprintSha
      ) {
        setTimeout(() => {
          new LoginFailedMessage(this.client, {
            //reason: "New update avaliable, update at: dsc.gg/erikclash",
            reason: "patch",
          }).send();
        }, 2000);
        return;
      }
    }
    const ctx = this.client.ctx;
    const db = ctx.database;
    let playerId = { high: this.data.HighID, low: this.data.LowID };
    let databaseuser = null;

    if (this.data.HighID !== 0 || this.data.LowID !== 0) {
      databaseuser = db.findOneBy({
        id: playerId,
        token: this.data.Token,
      });
    }

    if (this.data.HighID === 0 && this.data.LowID === 0) {
      databaseuser = db.create({
        id: {
          high: 0,
          low: ctx.consumeNewUserId(),
        },
        token: generateToken(),
        trophies: 0,
        username: "",
        deck: [
          26000026, 26000015, 26000012, 26000000, 26000004, 26000005, 26000006,
          26000007,
        ],
      });
      // `ctx.consumeNewUserId()` already persists `newUserId.txt`.
    } else {
      if (!databaseuser) {
        setTimeout(() => {
          new LoginFailedMessage(this.client, {
            //reason: "New update avaliable, update at: dsc.gg/erikclash",
            reason: "Invalid credentials, please clear app data",
          }).send();
        }, 2000);
        return;
      }
    }

    this.client.user = databaseuser;
    console.log(this.client.user);

    setTimeout(() => {
      new LoginOkMessage(this.client).send();
      new OwnHomeDataMessage(this.client).send();
      new AllianceStreamEntryMessage(this.client).send();
    }, 2000);
  }
}

module.exports = LoginMessage;
