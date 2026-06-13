
// @ts-nocheck
import { ClanDatabase, Clan, ClanMember } from "../db/ClanDatabase";
import { ShopManager, ChestReward } from "./ShopManager";

const shopManager = new ShopManager();

/**
 * War phases:
 *   0 = none
 *   1 = matchmaking (auto → prep after 60s)
 *   2 = preparation (24h — members choose decks)
 *   3 = battle day (24h — members attack, earn fame)
 *   4 = war ended (results available, rewards claimable)
 */

/** Duration of each war phase in seconds */
const MATCHMAKING_DURATION = 60;
const PREP_DURATION = 86400;    // 24h
const BATTLE_DURATION = 86400;  // 24h
const RESULTS_DURATION = 86400; // 24h before auto-reset

/** Fame required to finish the race */
const FAME_GOAL = 50000;

/** Max attacks per member per war day */
const MAX_ATTACKS = 4;

/** Fame earned per attack based on result */
const FAME_PER_WIN = 200;
const FAME_PER_LOSS = 50;
const FAME_PER_DRAW = 100;

/** Reward tiers based on clan's finishing position (1st to 5th) */
const WAR_REWARDS: Record<number, { gold: number; gems: number; cards: number; warTrophies: number }> = {
  1: { gold: 4000, gems: 200, cards: 20, warTrophies: 200 },
  2: { gold: 3000, gems: 150, cards: 15, warTrophies: 100 },
  3: { gold: 2000, gems: 100, cards: 10, warTrophies: 50 },
  4: { gold: 1000, gems: 50,  cards: 5,  warTrophies: 0 },
  5: { gold: 500,  gems: 25,  cards: 3,  warTrophies: -50 },
};

export interface WarAttack {
  attackerLow: number;
  attackerName: string;
  stars: number;           // 0-3
  crowns: number;
  fameEarned: number;
  timestamp: number;
}

export interface WarOpponent {
  id: { high: number; low: number };
  name: string;
  badge: number;
  warTrophies: number;
  memberCount: number;
  fame: number;
}

export interface WarState {
  phase: number;           // 0-4
  startTime: number;
  attacks: WarAttack[];
  opponents: WarOpponent[];
  totalFame: number;
  finishPosition: number;  // 1-5 (0 = not finished)
  rewardsClaimed: number[]; // player low IDs who claimed
}

/**
 * ClanWarManager
 *
 * Full Clan War 2 (River Race) implementation:
 * - Matchmaking → Preparation → Battle Day → War End
 * - 5 clans compete in a fame race to 50,000
 * - Each member gets 4 attacks per war day
 * - Stars/fame system
 * - Position-based rewards (gold, gems, cards, war trophies)
 */
export class ClanWarManager {
  private clanDb: ClanDatabase;
  
  constructor(clanDb: ClanDatabase) {
    this.clanDb = clanDb;
  }

  /**
   * Start a clan war (called by co-leader+).
   * Transitions to matchmaking phase.
   */
  startWar(clanLow: number, starterLow: number): { success: boolean; message: string } {
    const clan = this.clanDb.findClanById(clanLow);
    if (!clan) return { success: false, message: "Clan not found" };

    const role = this.clanDb.getMemberRole(clanLow, starterLow);
    if (role < 3) return { success: false, message: "Only co-leader+ can start war" };

    const war = this.getWarState(clan);
    if (war.phase !== 0) return { success: false, message: "War already in progress" };

    if (clan.members.length < 5) return { success: false, message: "Need at least 5 members" };

    const now = Math.floor(Date.now() / 1000);

    // Generate 4 opponent clans for the race
    const opponents = this.generateOpponents(clan);

    // Initialize war state
    const warState: WarState = {
      phase: 2, // Skip matchmaking, go straight to preparation
      startTime: now,
      attacks: [],
      opponents,
      totalFame: 0,
      finishPosition: 0,
      rewardsClaimed: [],
    };

    // Reset member war data
    for (const member of clan.members) {
      (member as any).warAttacksUsed = 0;
      (member as any).warFame = 0;
      (member as any).warStars = 0;
    }

    this.clanDb.updateClan(clanLow, {
      warState: 2,
      warStartTime: now,
      ...({ warData: warState } as any),
    });

    return { success: true, message: "War started! Preparation phase begins." };
  }

  /**
   * Process a war attack result.
   * Called after a war battle finishes.
   */
  processAttack(
    clanLow: number,
    attackerLow: number,
    crowns: number,
    enemyCrowns: number
  ): { success: boolean; fame: number; stars: number; message: string } {
    const clan = this.clanDb.findClanById(clanLow);
    if (!clan) return { success: false, fame: 0, stars: 0, message: "Clan not found" };

    const war = this.getWarState(clan);
    if (war.phase !== 3) return { success: false, fame: 0, stars: 0, message: "Not in battle phase" };

    const member = clan.members.find(m => m.id.low === attackerLow);
    if (!member) return { success: false, fame: 0, stars: 0, message: "Not a clan member" };

    const attacksUsed = (member as any).warAttacksUsed || 0;
    if (attacksUsed >= MAX_ATTACKS) {
      return { success: false, fame: 0, stars: 0, message: "No attacks remaining" };
    }

    // Calculate stars (CR style: 1 star per crown, max 3)
    const stars = Math.min(3, crowns);

    // Calculate fame
    let fame: number;
    if (crowns > enemyCrowns) {
      fame = FAME_PER_WIN;
    } else if (crowns === enemyCrowns) {
      fame = FAME_PER_DRAW;
    } else {
      fame = FAME_PER_LOSS;
    }

    // Bonus fame for 3-star
    if (stars === 3) fame += 100;

    // Record attack
    const attack: WarAttack = {
      attackerLow,
      attackerName: member.name,
      stars,
      crowns,
      fameEarned: fame,
      timestamp: Math.floor(Date.now() / 1000),
    };

    war.attacks.push(attack);
    war.totalFame += fame;

    // Update member stats
    (member as any).warAttacksUsed = attacksUsed + 1;
    (member as any).warFame = ((member as any).warFame || 0) + fame;
    (member as any).warStars = ((member as any).warStars || 0) + stars;

    // Check if we reached fame goal
    if (war.totalFame >= FAME_GOAL && war.finishPosition === 0) {
      war.finishPosition = this.calculatePosition(war);
    }

    // Simulate opponent fame progress
    this.simulateOpponentProgress(war);

    // Save
    this.clanDb.updateClan(clanLow, {
      ...({ warData: war } as any),
    });

    return { success: true, fame, stars, message: `Attack recorded: ${stars} stars, ${fame} fame` };
  }

  /**
   * Check and transition war phases based on elapsed time.
   */
  tickWarPhase(clan: Clan): number {
    const war = this.getWarState(clan);
    if (war.phase === 0) return 0;

    const now = Math.floor(Date.now() / 1000);
    const elapsed = now - war.startTime;
    let changed = false;

    if (war.phase === 1 && elapsed >= MATCHMAKING_DURATION) {
      // Matchmaking → Preparation
      war.phase = 2;
      war.startTime = now;
      changed = true;
    } else if (war.phase === 2 && elapsed >= PREP_DURATION) {
      // Preparation → Battle Day
      war.phase = 3;
      war.startTime = now;
      changed = true;
    } else if (war.phase === 3 && elapsed >= BATTLE_DURATION) {
      // Battle Day → War Ended
      war.phase = 4;
      war.startTime = now;
      
      // Final position calculation
      if (war.finishPosition === 0) {
        war.finishPosition = this.calculatePosition(war);
      }

      // Apply war trophy changes
      const reward = WAR_REWARDS[war.finishPosition] || WAR_REWARDS[5];
      clan.warTrophies = Math.max(0, (clan.warTrophies || 0) + reward.warTrophies);

      changed = true;
    } else if (war.phase === 4 && elapsed >= RESULTS_DURATION) {
      // Auto-reset after results period
      war.phase = 0;
      clan.warState = 0;
      clan.warStartTime = 0;
      this.clanDb.updateClan(clan.id.low, {
        warState: 0,
        warStartTime: 0,
        warTrophies: clan.warTrophies,
        ...({ warData: null } as any),
      });
      return 0;
    }

    if (changed) {
      clan.warState = war.phase;
      this.clanDb.updateClan(clan.id.low, {
        warState: war.phase,
        warStartTime: war.startTime,
        warTrophies: clan.warTrophies,
        ...({ warData: war } as any),
      });
    }

    return war.phase;
  }

  /**
   * Claim war rewards for a player.
   */
  claimRewards(
    clanLow: number,
    playerLow: number,
    userDb: any,
    database: any
  ): { success: boolean; gold: number; gems: number; cards: number } | null {
    const clan = this.clanDb.findClanById(clanLow);
    if (!clan) return null;

    const war = this.getWarState(clan);
    if (war.phase !== 4) return null;
    if (war.rewardsClaimed.includes(playerLow)) return null;

    const position = war.finishPosition || 5;
    const reward = WAR_REWARDS[position] || WAR_REWARDS[5];

    // Apply rewards to user
    userDb.gold = (userDb.gold || 0) + reward.gold;
    userDb.gems = (userDb.gems || 0) + reward.gems;
    database.update(userDb._systemid, userDb);

    // Mark as claimed
    war.rewardsClaimed.push(playerLow);
    this.clanDb.updateClan(clanLow, {
      ...({ warData: war } as any),
    });

    return { success: true, gold: reward.gold, gems: reward.gems, cards: reward.cards };
  }

  /**
   * Get remaining attacks for a member.
   */
  getRemainingAttacks(clan: Clan, playerLow: number): number {
    const member = clan.members.find(m => m.id.low === playerLow);
    if (!member) return 0;
    return MAX_ATTACKS - ((member as any).warAttacksUsed || 0);
  }

  /**
   * Get war state from clan data.
   */
  getWarState(clan: Clan): WarState {
    const warData = (clan as any).warData;
    if (warData) return warData;

    return {
      phase: clan.warState || 0,
      startTime: clan.warStartTime || 0,
      attacks: [],
      opponents: [],
      totalFame: 0,
      finishPosition: 0,
      rewardsClaimed: [],
    };
  }

  /**
   * Get time remaining in current phase (seconds).
   */
  getTimeRemaining(clan: Clan): number {
    const war = this.getWarState(clan);
    if (war.phase === 0) return 0;

    const now = Math.floor(Date.now() / 1000);
    const elapsed = now - war.startTime;

    const durations: Record<number, number> = {
      1: MATCHMAKING_DURATION,
      2: PREP_DURATION,
      3: BATTLE_DURATION,
      4: RESULTS_DURATION,
    };

    const duration = durations[war.phase] || 0;
    return Math.max(0, duration - elapsed);
  }

  /**
   * Get war leaderboard (all 5 clans sorted by fame).
   */
  getLeaderboard(clan: Clan): { name: string; fame: number; position: number }[] {
    const war = this.getWarState(clan);
    const entries = [
      { name: clan.name, fame: war.totalFame },
      ...war.opponents.map(o => ({ name: o.name, fame: o.fame })),
    ];

    entries.sort((a, b) => b.fame - a.fame);
    return entries.map((e, i) => ({ ...e, position: i + 1 }));
  }

  // ============ Private Helpers ============

  private generateOpponents(clan: Clan): WarOpponent[] {
    const names = [
      "Dragon Riders", "Thunder Legion", "Shadow Knights", "Ice Storm",
      "Fire Hawks", "Dark Phoenix", "Steel Warriors", "Night Wolves",
      "Storm Clan", "Iron Fist", "Battle Kings", "War Machine",
    ];
    const baseTrophies = clan.warTrophies || 0;
    const opponents: WarOpponent[] = [];

    for (let i = 0; i < 4; i++) {
      const nameIdx = Math.floor(Math.random() * names.length);
      opponents.push({
        id: { high: 0, low: 14800000 + Math.floor(Math.random() * 100000) },
        name: names.splice(nameIdx, 1)[0],
        badge: 16000000 + Math.floor(Math.random() * 50),
        warTrophies: Math.max(0, baseTrophies + Math.floor(Math.random() * 600) - 300),
        memberCount: 15 + Math.floor(Math.random() * 30),
        fame: 0,
      });
    }

    return opponents;
  }

  private simulateOpponentProgress(war: WarState) {
    const now = Math.floor(Date.now() / 1000);
    const elapsed = now - war.startTime;
    const progress = Math.min(1, elapsed / BATTLE_DURATION);

    for (const opp of war.opponents) {
      // Each opponent progresses at a slightly different rate
      const speed = 0.6 + Math.random() * 0.8; // 60% to 140% of average
      const targetFame = FAME_GOAL * progress * speed;
      // Smoothly increase, never decrease
      opp.fame = Math.max(opp.fame, Math.floor(targetFame));
    }
  }

  private calculatePosition(war: WarState): number {
    const fames = [
      war.totalFame,
      ...war.opponents.map(o => o.fame),
    ];
    const sorted = [...fames].sort((a, b) => b - a);
    return sorted.indexOf(war.totalFame) + 1;
  }
}
