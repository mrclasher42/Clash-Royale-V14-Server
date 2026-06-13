// @ts-nocheck
const PiranhaMessage = require('../../PiranhaMessage')
const FriendListMessage = require('../Server/FriendListMessage')
const PlayerProfileMessage = require('../Server/PlayerProfileMessage')

class HomeStreamMessage extends PiranhaMessage {
  constructor (bytes, client) {
    super(bytes)
    this.client = client
    this.id = 13427
    this.version = 1
  }

  async decode () {}

  async process () {
    await new PlayerProfileMessage(this.client).send();
  }
}

module.exports = HomeStreamMessage
