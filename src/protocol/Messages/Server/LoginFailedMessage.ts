import { loadConfig } from "../../../config/loadConfig";

// @ts-nocheck
const PiranhaMessage = require("../../PiranhaMessage");
const fs = require("fs");
const path = require("path");

class LoginFailedMessage extends PiranhaMessage {
  constructor(client: any, jsonParams: any) {
    super();
    this.id = 20103;
    this.client = client;
    this.version = 4;
    this.jsonParams = jsonParams;
  }

  encode() {
    // 8 = Update Available
    // 9 = Connection Error
    // 10 = Maintenance
    // 11 = Banned
    let cfg = loadConfig();

    //https://link-target.net/927764/POMeEPEp8tYD
    let updateURL = "https://eriksroyale.netlify.app";
    if (this.jsonParams?.reason === "update") {
      this.writeHex("08");
      this.writeString("{}");
      this.writeString("");
      this.writeString(updateURL);
      this.writeString(""); //update url
      this.writeString("");
      this.writeHex("0000FFFFFFFF00FFFFFFFF00");
      return;
    }

    if (this.jsonParams?.reason === "patch") {
      this.writeVInt(7);
      let fingerprint = fs.readFileSync(path.join("Gamefiles/fingerprint.json"), "utf-8");
      this.writeString(
        fingerprint,
      );
      console.log(fingerprint);
      this.writeString(null);
      this.writeString(null);
      this.writeString(null);
      this.writeVInt(0);
      this.writeBoolean(false);
      this.writeString(null);
      this.writeVInt(2);
      let patchUrl = cfg.patchUrl;
      this.writeString(patchUrl);
      this.writeString(patchUrl);
      this.writeString(null);
      this.writeBoolean(true);
      this.writeCompressedString(
        fingerprint,
      );
      this.writeBoolean(false);
      this.writeBoolean(false);
      this.writeBoolean(false);
      this.writeBoolean(false);
      this.writeBoolean(false);
    }

    if (this.jsonParams?.reason) {
      this.writeHex("03FFFFFFFFFFFFFFFFFFFFFFFF");
      this.writeString(this.jsonParams.reason);
      this.writeHex("0000FFFFFFFF00FFFFFFFF00");
    }
  }
}

module.exports = LoginFailedMessage;
