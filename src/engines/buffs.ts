// ── Race Buff System ───────────────────────────────────────────────────
// Buffs are purchasable with coins OR PBP token. Some premium buffs are PBP-only.
// Max 2 buffs per NFT per race. Consumed on use.

export type BuffRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export interface BuffDefinition {
  id: string;
  name: string;
  description: string;
  rarity: BuffRarity;
  cost: number; // coins (0 if PBP-only)
  pbpPrice: number; // PBP token price in PBP (0 if coins-only, >0 if purchasable with PBP)
  premiumOnly: boolean; // true = PBP purchase only, false = coins OR PBP
  icon: string;
  tags?: string[]; // e.g. ["anti-leader"] for abuse-limit grouping
}

// ── How buffs modify the race tick ─────────────────────────────────────

export interface ActiveBuff {
  buffId: string;
  characterId: string;
  // Runtime state tracked during simulation
  triggered: boolean;
  triggerTick?: number;
}

// ── Buff Catalog ───────────────────────────────────────────────────────

export const BUFF_CATALOG: BuffDefinition[] = [
  // ─── Common (30-50 coins OR ~37-60 PBP) ──────────────────────
  {
    id: "nitro_boost",
    name: "Nitro Boost",
    description: "+30% speed for one burst at a random point in the race.",
    rarity: "common",
    cost: 30,
    pbpPrice: 37.5,
    premiumOnly: false,
    icon: "🚀",
  },
  {
    id: "banana_peel",
    name: "Banana Peel",
    description: "A random opponent hits a slowdown obstacle mid-race.",
    rarity: "common",
    cost: 40,
    pbpPrice: 52.5,
    premiumOnly: false,
    icon: "🍌",
  },
  {
    id: "energy_drink",
    name: "Energy Drink",
    description: "Fatigue point delayed by 20% — stay fast longer.",
    rarity: "common",
    cost: 35,
    pbpPrice: 45,
    premiumOnly: false,
    icon: "⚡",
  },
  {
    id: "lucky_penny",
    name: "Lucky Penny",
    description: "Luck burst chance doubled for this race.",
    rarity: "common",
    cost: 30,
    pbpPrice: 37.5,
    premiumOnly: false,
    icon: "🪙",
  },
  {
    id: "tailwind",
    name: "Tailwind",
    description: "If you're NOT in 1st place, get a speed boost during the 25-65% stretch.",
    rarity: "common",
    cost: 45,
    pbpPrice: 60,
    premiumOnly: false,
    icon: "🌬️",
    tags: ["anti-leader"],
  },

  // ─── Uncommon (60-90 coins OR ~75-97.5 PBP) ────────────────────
  {
    id: "slipstream",
    name: "Slipstream",
    description: "Draft behind the leader — speed boost in the final 20% if you're 2nd-4th.",
    rarity: "uncommon",
    cost: 70,
    pbpPrice: 90,
    premiumOnly: false,
    icon: "💨",
  },
  {
    id: "double_luck",
    name: "Four-Leaf Clover",
    description: "Double your luck stat for this race.",
    rarity: "uncommon",
    cost: 60,
    pbpPrice: 75,
    premiumOnly: false,
    icon: "🍀",
  },
  {
    id: "rubber_bumpers",
    name: "Rubber Bumpers",
    description: "Collision penalties reduced by 75%.",
    rarity: "uncommon",
    cost: 65,
    pbpPrice: 82.5,
    premiumOnly: false,
    icon: "🛞",
  },
  {
    id: "head_start",
    name: "Head Start",
    description: "Start the race at position 5 instead of 0.",
    rarity: "uncommon",
    cost: 80,
    pbpPrice: 97.5,
    premiumOnly: false,
    icon: "🏃",
  },

  // ─── Rare (100-150 coins OR ~135-187.5 PBP) ─────────────────────
  {
    id: "shield_wall",
    name: "Shield Wall",
    description: "Immune to ALL collision penalties this race.",
    rarity: "rare",
    cost: 120,
    pbpPrice: 150,
    premiumOnly: false,
    icon: "🛡️",
  },
  {
    id: "crowd_frenzy",
    name: "Crowd Frenzy",
    description: "Charisma crowd boost activates from 40% instead of 70%.",
    rarity: "rare",
    cost: 100,
    pbpPrice: 135,
    premiumOnly: false,
    icon: "📣",
  },
  {
    id: "turbo_charger",
    name: "Turbo Charger",
    description: "+15% base speed for the entire race.",
    rarity: "rare",
    cost: 140,
    pbpPrice: 187.5,
    premiumOnly: false,
    icon: "🔥",
  },
  {
    id: "spotlight_curse",
    name: "Spotlight Curse",
    description: "The leader's collision rate triples and speed drops during the 40-80% stretch.",
    rarity: "rare",
    cost: 110,
    pbpPrice: 150,
    premiumOnly: false,
    icon: "🔦",
    tags: ["anti-leader"],
  },

  // ─── Epic (200-300 coins OR ~197-281 PBP) ─────────────────────
  {
    id: "earthquake",
    name: "Earthquake",
    description: "ALL racers get a random slowdown at the 50% mark — chaos equalizer.",
    rarity: "epic",
    cost: 200,
    pbpPrice: 225,
    premiumOnly: false,
    icon: "🌋",
  },
  {
    id: "time_warp",
    name: "Time Warp",
    description: "Swap positions with the racer directly ahead of you at the 60% mark.",
    rarity: "epic",
    cost: 250,
    pbpPrice: 281.25,
    premiumOnly: false,
    icon: "⏳",
  },
  {
    id: "clone_sprint",
    name: "Clone Sprint",
    description: "Your agility shortcut chance is tripled for the entire race.",
    rarity: "epic",
    cost: 220,
    pbpPrice: 253.125,
    premiumOnly: false,
    icon: "👥",
  },
  {
    id: "blue_shell",
    name: "Blue Shell",
    description: "When the leader reaches 65%, they get hit with a 6% position penalty.",
    rarity: "epic",
    cost: 180,
    pbpPrice: 196.875,
    premiumOnly: false,
    icon: "🐚",
    tags: ["anti-leader"],
  },

  // ─── Legendary (400-500 coins OR ~300-337.5 PBP) ────────────────
  {
    id: "ghost_mode",
    name: "Ghost Mode",
    description: "Phase through all obstacles for the first 40% of the race.",
    rarity: "legendary",
    cost: 400,
    pbpPrice: 300,
    premiumOnly: false,
    icon: "👻",
  },
  {
    id: "photo_finish",
    name: "Photo Finish",
    description: "If you finish within 0.5s of the winner, you ALSO get 1st place points.",
    rarity: "legendary",
    cost: 450,
    pbpPrice: 337.5,
    premiumOnly: false,
    icon: "📸",
  },

  // ─── PREMIUM ONLY (PBP purchase only) ──────────────────────────
  {
    id: "warp_drive",
    name: "Warp Drive",
    description: "Teleport to 1st place position at the 75% mark. One-time burst.",
    rarity: "legendary",
    cost: 0,
    pbpPrice: 562.5,
    premiumOnly: true,
    icon: "🌀",
  },
  {
    id: "gravity_well",
    name: "Gravity Well",
    description: "All opponents within 10% of your position get pulled back 5% at the 50% mark.",
    rarity: "epic",
    cost: 0,
    pbpPrice: 300,
    premiumOnly: true,
    icon: "🕳️",
  },
  {
    id: "mirror_image",
    name: "Mirror Image",
    description: "Copy the best buff active in the race and apply it to yourself.",
    rarity: "epic",
    cost: 0,
    pbpPrice: 262.5,
    premiumOnly: true,
    icon: "🪞",
  },
  {
    id: "golden_ticket",
    name: "Golden Ticket",
    description: "+50% coin earnings from this race. Stacks with placement bonuses.",
    rarity: "rare",
    cost: 0,
    pbpPrice: 112.5,
    premiumOnly: true,
    icon: "🎫",
  },
  {
    id: "adrenaline_surge",
    name: "Adrenaline Surge",
    description: "When you drop below 4th place, get a massive +40% speed burst for 3 ticks.",
    rarity: "uncommon",
    cost: 0,
    pbpPrice: 75,
    premiumOnly: true,
    icon: "💉",
  },
];

export const BUFF_MAP = new Map(BUFF_CATALOG.map((b) => [b.id, b]));

export const MAX_BUFFS_PER_ENTRY = 2;

// ── Anti-leader buff abuse limits ────────────────────────────────────
// Prevents a lobby from stacking too many leader-targeting buffs.
export const MAX_SAME_ANTI_LEADER_PER_RACE = 2; // max 2 of the same anti-leader buff across all entrants
export const MAX_TOTAL_ANTI_LEADER_PER_RACE = 4; // max 4 anti-leader buffs total in one race

export const ANTI_LEADER_BUFF_IDS = new Set(
  BUFF_CATALOG.filter((b) => b.tags?.includes("anti-leader")).map((b) => b.id)
);

/** Validate whether adding a buff to the race would violate anti-leader limits. */
export function canEquipAntiLeaderBuff(
  buffId: string,
  allEquippedBuffs: ActiveBuff[]
): { allowed: boolean; reason?: string } {
  if (!ANTI_LEADER_BUFF_IDS.has(buffId)) return { allowed: true };

  const antiLeaderBuffs = allEquippedBuffs.filter((b) => ANTI_LEADER_BUFF_IDS.has(b.buffId));

  if (antiLeaderBuffs.length >= MAX_TOTAL_ANTI_LEADER_PER_RACE) {
    return { allowed: false, reason: `Max ${MAX_TOTAL_ANTI_LEADER_PER_RACE} anti-leader buffs allowed per race.` };
  }

  const sameCount = antiLeaderBuffs.filter((b) => b.buffId === buffId).length;
  if (sameCount >= MAX_SAME_ANTI_LEADER_PER_RACE) {
    return { allowed: false, reason: `Max ${MAX_SAME_ANTI_LEADER_PER_RACE} of the same anti-leader buff per race.` };
  }

  return { allowed: true };
}

// ── Rarity colors ──────────────────────────────────────────────────────

export const RARITY_COLORS: Record<BuffRarity, string> = {
  common: "#8888aa",
  uncommon: "#55efc4",
  rare: "#74b9ff",
  epic: "#a29bfe",
  legendary: "#ffd700",
};

// ── Inventory item ─────────────────────────────────────────────────────

export interface BuffInventoryItem {
  buffId: string;
  quantity: number;
}

// ── Currency helpers ───────────────────────────────────────────────────

export type PurchaseCurrency = "coins" | "pbp";

export function canPurchaseWithCoins(buff: BuffDefinition): boolean {
  return !buff.premiumOnly && buff.cost > 0;
}

export function canPurchaseWithPbp(buff: BuffDefinition): boolean {
  return buff.pbpPrice > 0;
}
