const PiranhaMessage = require("../../PiranhaMessage");
const ChestContentMessage = require("../Server/ChestContentMessage");

class BuyShopChestMessage extends PiranhaMessage {
    constructor(bytes, client) {
        super(bytes);
        this.client = client;
        this.id = 19779;  // الرقم من v13
        this.version = 1;
    }

    async decode() {
        console.log("[Shop] Buying chest...");
    }

    async process() {
        const user = this.client.user;
        if (!user) return;

        console.log(`[${user.username}] >> Chest purchased!`);
        new ChestContentMessage(this.client).send();
    }
}

module.exports = BuyShopChestMessage;
