import shopCycleData from "./shop_cycle.json";

/**
 * Card rarity definitions matching CR v14 APK.
 */
const RARITY_POOLS: Record<string, number[]> = {
  Common: [
    26000000,26000001,26000002,26000003,26000004,26000005,26000006,
    26000008,26000009,26000010,26000013,26000014,26000016,26000019,
    26000020,26000022,26000024,26000030,26000034,26000035,26000037,
    26000039,26000044,26000046,26000048,26000055,26000058,26000062,
    26000068,26000072,26000080,26000084,26000085,26000096,26000097,
    26000101,26000103,27000000,27000003,27000006,27000010,27000012,
    28000000,28000001,28000008,28000015,28000017,
  ],
  Rare: [
    26000007,26000011,26000012,26000015,26000017,26000018,26000021,
    26000023,26000025,26000026,26000027,26000028,26000029,26000032,
    26000033,26000036,26000038,26000040,26000041,26000042,26000043,
    26000045,26000047,26000050,26000053,26000056,26000057,26000059,
    26000060,26000063,26000064,26000067,26000069,26000074,26000077,
    26000083,26000087,26000093,26000095,26000099,26000102,
    27000001,27000002,27000004,27000005,27000007,27000008,27000009,
    27000013,28000002,28000003,28000005,28000009,28000010,28000014,
    28000018,28000023,28000024,
  ],
  Epic: [
    26000031,26000049,26000051,26000052,26000054,26000061,26000065,
    27000011,28000004,28000006,28000007,28000011,28000012,28000013,
    28000016,28000025,28000026,
  ],
  Legendary: [
    26000057,26000060,26000064,26000069,26000074,26000080,26000083,
    26000085,26000093,26000095,26000099,26000101,26000102,26000103,
  ],
};

/**
 * Chest reward tables matching CR globals.
 */
const CHEST_REWARDS: Record<string, { gold: [number, number]; cards: number; guaranteed: string | null }> = {
  SilverChest:       { gold: [36, 108],    cards: 3,  guaranteed: null },
  GoldChest:         { gold: [100, 264],   cards: 8,  guaranteed: "Rare" },
  MagicalChest:      { gold: [200, 480],   cards: 18, guaranteed: "Epic" },
  GiantChest:        { gold: [360, 840],   cards: 36, guaranteed: null },
  SuperMagicalChest: { gold: [600, 1500],  cards: 36, guaranteed: "Legendary" },
  EpicChest:         { gold: [0, 0],       cards: 10, guaranteed: "Epic" },
  LegendaryChest:    { gold: [0, 0],       cards: 1,  guaranteed: "Legendary" },
  MegaLightningChest:{ gold: [800, 2000],  cards: 45, guaranteed: "Legendary" },
  RoyalWildChest:    { gold: [500, 1200],  cards: 30, guaranteed: "Epic" },
};

/**
 * Gems cost to buy/open chests in shop.
 */
const CHEST_GEM_COST: Record<string, number> = {
  SilverChest: 18,
  GoldChest: 60,
  MagicalChest: 600,
  GiantChest: 780,
  SuperMagicalChest: 2600,
  EpicChest: 1000,
  LegendaryChest: 2500,
  MegaLightningChest: 3000,
  RoyalWildChest: 1500,
};

/**
 * Gems cost to speed-open a chest (per hour remaining).
 */
const GEMS_PER_HOUR = 1;

export interface ShopItem {
  type: "card" | "chest" | "gold" | "gems" | "offer";
  id: string;
  cardId?: number;
  rarity?: string;
  count?: number;
  goldCost?: number;
  gemsCost?: number;
  goldReward?: number;
}

export interface ChestReward {
  gold: number;
  cards: { cardId: number; count: number }[];
}

/**
 * ShopManager
 *
 * Handles daily card deals, special offers, chest purchases,
 * gems-for-gold exchange, and chest opening with dynamic rewards.
 */
export class ShopManager {
  private shopData = shopCycleData;

  /**
   * Get today's shop items for a player.
   */
  getDailyShop(user: any): ShopItem[] {
    const dayIndex = this.getDayIndex();
    const cycleSlots = this.shopData.cycle[dayIndex % this.shopData.cycle.length].slots;
    const items: ShopItem[] = [];

    // Daily card deals from cycle
    for (const slot of cycleSlots) {
      items.push({
        type: "card",
        id: `card_${slot.cardId}`,
        cardId: slot.cardId,
        rarity: slot.type,
        count: slot.count,
        goldCost: slot.gold,
      });
    }

    // Random daily deals (3 cards of varying rarity)
    const seed = this.seedForDay(dayIndex, user.id?.low || 0);
    const rarities = ["Common", "Rare", "Epic"];
    for (let i = 0; i < 3; i++) {
      const rarity = rarities[i];
      const pool = RARITY_POOLS[rarity] || RARITY_POOLS.Common;
      const cardIndex = this.seededRandom(seed + i * 7, pool.length);
      const deal = this.shopData.dailyDeals.find((d: any) => d.type === rarity) || this.shopData.dailyDeals[0];
      items.push({
        type: "card",
        id: `daily_${rarity}_${i}`,
        cardId: pool[cardIndex],
        rarity,
        count: deal.count,
        goldCost: deal.goldCost,
      });
    }

    // Gems for gold
    for (let i = 0; i < this.shopData.gemsForGold.length; i++) {
      const g = this.shopData.gemsForGold[i];
      items.push({
        type: "gold",
        id: `gold_${i}`,
        gemsCost: g.gems,
        goldReward: g.gold,
      });
    }

    return items;
  }

  /**
   * Buy a card from the shop.
   */
  buyCard(user: any, itemId: string, shopItems: ShopItem[]): { success: boolean; message: string } {
    const item = shopItems.find(i => i.id === itemId && i.type === "card");
    if (!item) return { success: false, message: "Item not found" };

    // Check if already purchased today
    if (!user.shopPurchases) user.shopPurchases = {};
    const today = new Date().toISOString().split("T")[0];
    const key = `${today}_${itemId}`;
    if (user.shopPurchases[key]) return { success: false, message: "Already purchased today" };

    // Check gold
    if ((user.gold || 0) < (item.goldCost || 0)) return { success: false, message: "Not enough gold" };

    user.gold -= item.goldCost!;
    user.shopPurchases[key] = true;

    return { success: true, message: `Bought ${item.rarity} card x${item.count}` };
  }

  /**
   * Buy gold with gems.
   */
  buyGoldWithGems(user: any, offerIndex: number): { success: boolean; gold?: number } {
    if (offerIndex < 0 || offerIndex >= this.shopData.gemsForGold.length) return { success: false };
    const offer = this.shopData.gemsForGold[offerIndex];
    if ((user.gems || 0) < offer.gems) return { success: false };
    user.gems -= offer.gems;
    user.gold = (user.gold || 0) + offer.gold;
    return { success: true, gold: offer.gold };
  }

  /**
   * Buy a chest from shop with gems.
   */
  buyChest(user: any, chestType: string): { success: boolean; reward?: ChestReward } {
    const cost = CHEST_GEM_COST[chestType];
    if (!cost) return { success: false };
    if ((user.gems || 0) < cost) return { success: false };

    user.gems -= cost;
    const reward = this.generateChestReward(chestType);
    this.applyReward(user, reward);
    return { success: true, reward };
  }

  /**
   * Generate dynamic chest rewards based on type.
   */
  generateChestReward(chestType: string): ChestReward {
    const template = CHEST_REWARDS[chestType] || CHEST_REWARDS.SilverChest;
    const gold = this.randomRange(template.gold[0], template.gold[1]);
    const cards: { cardId: number; count: number }[] = [];
    let remaining = template.cards;

    // Guaranteed card
    if (template.guaranteed) {
      const pool = RARITY_POOLS[template.guaranteed] || RARITY_POOLS.Common;
      const cardId = pool[Math.floor(Math.random() * pool.length)];
      const count = template.guaranteed === "Legendary" ? 1 : (template.guaranteed === "Epic" ? 2 : 4);
      cards.push({ cardId, count });
      remaining -= count;
    }

    // Fill remaining with commons/rares
    while (remaining > 0) {
      const isRare = Math.random() < 0.25;
      const pool = isRare ? RARITY_POOLS.Rare : RARITY_POOLS.Common;
      const cardId = pool[Math.floor(Math.random() * pool.length)];
      const count = Math.min(remaining, isRare ? 1 : Math.ceil(remaining * 0.4));
      cards.push({ cardId, count });
      remaining -= count;
    }

    return { gold, cards };
  }

  /**
   * Apply chest reward to user.
   */
  applyReward(user: any, reward: ChestReward) {
    user.gold = (user.gold || 0) + reward.gold;
    // Cards are tracked client-side in this version
  }

  /**
   * Get gems cost to speed-open a chest.
   */
  getSpeedOpenCost(remainingSeconds: number): number {
    return Math.max(1, Math.ceil(remainingSeconds / 3600) * GEMS_PER_HOUR);
  }

  /**
   * Get chest slots state for a user.
   */
  getChestSlots(user: any): any[] {
    if (!user.chestSlots) {
      user.chestSlots = [null, null, null, null]; // 4 slots
    }
    return user.chestSlots;
  }

  /**
   * Add a chest to an empty slot after a battle win.
   */
  addChestToSlot(user: any, chestType: string): boolean {
    const slots = this.getChestSlots(user);
    const emptyIndex = slots.findIndex((s: any) => s === null);
    if (emptyIndex === -1) return false; // All slots full

    slots[emptyIndex] = {
      type: chestType,
      unlocking: false,
      unlockStartTime: 0,
    };
    user.chestSlots = slots;
    return true;
  }

  /**
   * Start unlocking a chest.
   */
  startUnlocking(user: any, slotIndex: number): boolean {
    const slots = this.getChestSlots(user);
    if (!slots[slotIndex] || slots[slotIndex].unlocking) return false;

    // Check no other chest is unlocking
    if (slots.some((s: any) => s && s.unlocking)) return false;

    slots[slotIndex].unlocking = true;
    slots[slotIndex].unlockStartTime = Date.now() / 1000 | 0;
    user.chestSlots = slots;
    return true;
  }

  /**
   * Open a finished chest.
   */
  openChest(user: any, slotIndex: number): ChestReward | null {
    const slots = this.getChestSlots(user);
    const chest = slots[slotIndex];
    if (!chest) return null;

    const unlockTime = this.getUnlockTime(chest.type);
    const elapsed = (Date.now() / 1000 | 0) - chest.unlockStartTime;

    if (chest.unlocking && elapsed < unlockTime) return null; // Not ready

    const reward = this.generateChestReward(chest.type);
    this.applyReward(user, reward);
    slots[slotIndex] = null;
    user.chestSlots = slots;
    return reward;
  }

  /**
   * Speed-open a chest with gems.
   */
  speedOpen(user: any, slotIndex: number): ChestReward | null {
    const slots = this.getChestSlots(user);
    const chest = slots[slotIndex];
    if (!chest) return null;

    const unlockTime = this.getUnlockTime(chest.type);
    const elapsed = chest.unlocking ? (Date.now() / 1000 | 0) - chest.unlockStartTime : 0;
    const remaining = Math.max(0, unlockTime - elapsed);
    const cost = this.getSpeedOpenCost(remaining);

    if ((user.gems || 0) < cost) return null;
    user.gems -= cost;

    const reward = this.generateChestReward(chest.type);
    this.applyReward(user, reward);
    slots[slotIndex] = null;
    user.chestSlots = slots;
    return reward;
  }

  private getUnlockTime(chestType: string): number {
    const times: Record<string, number> = {
      SilverChest: 10800,
      GoldChest: 28800,
      MagicalChest: 43200,
      GiantChest: 43200,
      EpicChest: 43200,
      SuperMagicalChest: 86400,
      LegendaryChest: 86400,
      MegaLightningChest: 86400,
      RoyalWildChest: 43200,
    };
    return times[chestType] || 10800;
  }

  private getDayIndex(): number {
    const now = new Date();
    const start = new Date("2024-01-01");
    return Math.floor((now.getTime() - start.getTime()) / 86400000);
  }

  private seedForDay(day: number, userId: number): number {
    return (day * 2654435761 + userId * 1103515245) >>> 0;
  }

  private seededRandom(seed: number, max: number): number {
    seed = ((seed * 1103515245 + 12345) & 0x7fffffff);
    return seed % max;
  }

  private randomRange(min: number, max: number): number {
    return min + Math.floor(Math.random() * (max - min + 1));
  }
}
