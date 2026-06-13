const ChestContentMessage = require("../../Messages/Server/ChestContentMessage");

class BuyShopChest {
    client: any;
    commandID: number;  

    constructor(client: any) {
      this.client = client;
      this.commandID = 651;
    }
  
    decode(buf: any) {}
    process() {
      new ChestContentMessage(this.client).send();
    }
}

module.exports = BuyShopChest;