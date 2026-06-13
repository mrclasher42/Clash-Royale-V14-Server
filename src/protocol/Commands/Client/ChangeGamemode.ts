class ChangeGamemode {
    client: any;
    commandID: number;
    gameMode: number;

    constructor(client: any) {
      this.client = client;
      this.commandID = 755;
      this.gameMode = -64;
    }
  
    decode(buf: any) {
      buf.readVInt();
      buf.readVInt();
      buf.readVInt();
      buf.readVInt();
      this.gameMode = buf.readVInt();
      console.log("GameMode: " + this.gameMode);
      // console.log(buf.readVInt());
      // console.log(buf.readVInt());
    }
    process() {

    }
}

module.exports = ChangeGamemode;