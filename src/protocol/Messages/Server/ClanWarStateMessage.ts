// @ts-nocheck
const PiranhaMessage = require("../../PiranhaMessage");
import { ClanWarManager } from "../../../data/ClanWarManager";

class ClanWarStateMessage extends PiranhaMessage {
  constructor(client, clan) {
    super();
    this.id = 24150;
    this.client = client;
    this.version = 0;
    this.clan = clan;
  }

  async encode() {
    const clan = this.clan;
    const warManager = new ClanWarManager(this.client.ctx.clanDatabase);

    // Tick phase transitions
    const currentPhase = warManager.tickWarPhase(clan);
    const war = warManager.getWarState(clan);

    // War state: 0=none, 1=matchmaking, 2=preparation, 3=warDay, 4=ended
    this.writeVInt(currentPhase);

    if (currentPhase === 0) {
      this.writeVInt(0);
      return;
    }

    // War start time
    this.writeVInt(war.startTime);

    // Number of participating clans (5 = our clan + 4 opponents)
    this.writeVInt(5);

    // === OUR CLAN ===
    this.writeInt(clan.id.high || 0);
    this.writeInt(clan.id.low);
    this.writeString(clan.name);
    this.writeInt(clan.badge || 16000000);
    this.writeVInt(clan.warTrophies || 0);
    this.writeVInt(clan.members.length);
    this.writeVInt(war.totalFame); // our fame
    this.writeVInt(0); // repair points

    // === 4 OPPONENT CLANS ===
    for (const opp of war.opponents) {
      this.writeInt(opp.id.high || 0);
      this.writeInt(opp.id.low);
      this.writeString(opp.name);
      this.writeInt(opp.badge);
      this.writeVInt(opp.warTrophies);
      this.writeVInt(opp.memberCount);
      this.writeVInt(opp.fame);
      this.writeVInt(0); // repair points
    }

    // Fill missing opponents (if less than 4)
    for (let i = war.opponents.length; i < 4; i++) {
      this.writeInt(0);
      this.writeInt(14800000 + i);
      this.writeString(`Clan ${i + 1}`);
      this.writeInt(16000000 + i);
      this.writeVInt(0);
      this.writeVInt(20);
      this.writeVInt(0);
      this.writeVInt(0);
    }

    // === MEMBER WAR INFO ===
    this.writeVInt(clan.members.length);
    for (const member of clan.members) {
      this.writeInt(member.id.high || 0);
      this.writeInt(member.id.low);
      this.writeString(member.name);
      this.writeVInt(member.trophies || 0);
      this.writeVInt(member.warAttacksUsed || 0);   // attacks used
      this.writeVInt(4);                              // max attacks
      this.writeVInt(member.warFame || 0);            // fame earned
    }

    // Time remaining in current phase
    const remaining = warManager.getTimeRemaining(clan);
    this.writeVInt(remaining);

    // If war ended, write finish position
    if (currentPhase === 4) {
      this.writeVInt(war.finishPosition || 5);
      
      // Has player claimed rewards?
      const userId = this.client.user?.id?.low || 0;
      this.writeBoolean(war.rewardsClaimed.includes(userId));
    }
  }
}

module.exports = ClanWarStateMessage;
