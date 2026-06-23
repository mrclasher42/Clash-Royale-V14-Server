const PiranhaMessage = require("../../PiranhaMessage");
const CancelMatchmakingMessage = require("../Server/CancelMatchmakingMessage");

class AskForCancelMatchmakingMessage extends PiranhaMessage {
    constructor(bytes, client) {
        super(bytes);
        this.client = client;
        this.id = 18057;
        this.version = 1;
    }

    async decode() {
        console.log("[AskForCancelMatchmakingMessage] Cancel request received");
    }

    async process() {
        const user = this.client.user;
        if (!user) return;

        console.log(`[${user.username}] >> Cancelling matchmaking...`);

        const ctx = this.client.ctx;
        if (ctx && ctx.userInBattleSearch) {
            for (let [gameMode, client] of ctx.userInBattleSearch) {
                if (client === this.client) {
                    ctx.userInBattleSearch.set(gameMode, null);
                    console.log(`[${user.username}] >> Removed from search`);
                    break;
                }
            }
        }

        new CancelMatchmakingMessage(this.client).send();
        console.log(`[${user.username}] >> Matchmaking cancelled!`);
    }
}

module.exports = AskForCancelMatchmakingMessage;
