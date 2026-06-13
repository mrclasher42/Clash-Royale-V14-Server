class ChangeTowerSkin {
    client: any;
    commandID: number;
    towerSkin: number;

    constructor(client: any) {
      this.client = client;
      this.commandID = 596;
      this.towerSkin = 87000001
    }
  
    decode(buf: any) {
      console.log(buf.readVInt());
      console.log(buf.readVInt());
      console.log(buf.readVInt());
      console.log(buf.readVInt());
      buf.readBoolean();
      this.towerSkin = buf.readVInt();
      console.log(buf.readVInt());
      console.log(buf.readVInt());
      console.log(buf.readVInt());
      console.log(buf.readVInt());
      console.log(buf.readVInt());
    }
    process() {
      this.client.user.towerSkin = this.towerSkin;
      this.client.ctx.database.update(this.client.user._systemid, this.client.user);
    }
}

module.exports = ChangeTowerSkin;