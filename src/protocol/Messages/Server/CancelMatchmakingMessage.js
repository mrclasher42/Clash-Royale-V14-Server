const PiranhaMessage = require("../../PiranhaMessage");

class CancelMatchmakingMessage extends PiranhaMessage {
    constructor(client) {
        super();
        this.client = client;
        this.id = 29690;
        this.version = 1;
    }

    encode() {
        this.writeInt(0);
        this.writeString("Matchmaking cancelled!");
    }

    send() {
        this.encode();
        this.client.send(this);
    }
}

module.exports = CancelMatchmakingMessage;
