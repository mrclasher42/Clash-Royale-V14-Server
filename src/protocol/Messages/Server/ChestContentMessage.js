const PiranhaMessage = require("../../PiranhaMessage");

class ChestContentMessage extends PiranhaMessage {
    constructor(client) {
        super();
        this.client = client;
        this.id = 24603;
        this.version = 1;
    }

    encode() {
        // بيانات الصندوق الفارغة
        this.writeVInt(0);
        this.writeVInt(0);
        this.writeVInt(0);
        this.writeVInt(0);
        this.writeVInt(0);
        this.writeVInt(0);
        this.writeVInt(0);
        this.writeVInt(0);
        this.writeVInt(0);
        this.writeVInt(0);
    }

    send() {
        this.encode();
        this.client.send(this);
    }
}

module.exports = ChestContentMessage;
