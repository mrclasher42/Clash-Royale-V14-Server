const PiranhaMessage = require("../../PiranhaMessage");
const ChestContentMessage = require("../Server/ChestContentMessage");

class OpenChestMessage extends PiranhaMessage {
    constructor(bytes, client) {
        super(bytes);
        this.client = client;
        this.id = 10188;
        this.version = 1;
    }

    async decode() {
        this.data = {};
        this.data.chestSlot = this.readInt();
        console.log(`[Shop] Opening chest at slot: ${this.data.chestSlot}`);
    }

    async process() {
        const user = this.client.user;
        if (!user) return;

        console.log(`[${user.username}] >> Chest opened!`);
        new ChestContentMessage(this.client).send();
    }
}

module.exports = OpenChestMessage;
