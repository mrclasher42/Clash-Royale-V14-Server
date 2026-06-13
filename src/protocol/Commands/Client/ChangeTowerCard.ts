class ChangeTowerCard {
    client: any;
    commandID: number;
    towerCard: number;

    constructor(client: any) {
      this.client = client;
      this.commandID = 682;
      this.towerCard = 159000000;
    }
  
    decode(buf: any) {
        console.log(buf.readVInt());
        console.log(buf.readVInt());
        console.log(buf.readVInt());
        console.log(buf.readVInt());
        console.log(buf.readVInt());
        this.towerCard = buf.readInt();
        if (this.towerCard >= 159000000 || this.towerCard < 159999999)
        console.log("old");
        console.log(this.client.user.towerCard);
        this.client.user.towerCard = this.towerCard;
        console.log("new");
        console.log(this.client.user.towerCard);
        this.client.ctx.database.update(this.client.user._systemid, this.client.user);
    }
    process() {
      
    }
}

module.exports = ChangeTowerCard;