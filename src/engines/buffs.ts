// ── Race Buff System ───────────────────────────────────────────────────
// Buffs are purchasable with coins earned from achievements + race wins.
// Max 2 buffs per NFT per race. Consumed on use.

export type BuffRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export interface BuffDefinition {
  id: string;
  name: string;
  description: string;
  rarity: BuffRarity;
  cost: number; // coins
  icon: string;
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
  // ─── Common (30-50 coins) ─────────────────────────────────────────
  {
    id: "nitro_boost",
    name: "Nitro Boost",
    description: "+30% speed for one burst at a random point in the race.",
    rarity: "common",
    cost: 30,
    icon: "🚀",
  },
  {
    id: "banana_peel",
    name: "Banana Peel",
    description: "A random opponent hits a slowdown obstacle mid-race.",
    rarity: "common",
    cost: 40,
    icon: "🍌",
  },
  {
    id: "energy_drink",
    name: "Energy Drink",
    description: "Fatigue point delayed by 20% — stay fast longer.",
    rarity: "common",
    cost: 35,
    icon: "⚡",
  },
  {
    id: "lucky_penny",
    name: "Lucky Penny",
    description: "Luck burst chance doubled for this race.",
    rarity: "common",
    cost: 30,
    icon: "🪙",
  },

  // ─── Uncommon (60-90 coins) ───────────────────────────────────────
  {
    id: "slipstream",
    name: "Slipstream",
    description: "Draft behind the leader — speed boost in the final 20% if you're 2nd-4th.",
    rarity: "uncommon",
    cost: 70,
    icon: "💨",
  },
  {
    id: "double_luck",
    name: "Four-Leaf Clover",
    description: "Double your luck stat for this race.",
    rarity: "uncommon",
    cost: 60,
    icon: "🍀",
  },
  {
    id: "rubber_bumpers",
    name: "Rubber Bumpers",
    description: "Collision penalties reduced by 75%.",
    rarity: "uncommon",
    cost: 65,
    icon: "🛞",
  },
  {
    id: "head_start",
    name: "Head Start",
    description: "Start the race at position 5 instead of 0.",
    rarity: "uncommon",
    cost: 80,
    icon: "🏃",
  },

  // ─── Rare (100-150 coins) ─────────────────────────────────────────
  {
    id: "shield_wall",
    name: "Shield Wall",
    description: "Immune to ALL collision penalties this race.",
    rarity: "rare",
    cost: 120,
    icon: "🛡️",
  },
  {
    id: "crowd_frenzy",
    name: "Crowd Frenzy",
    description: "Charisma crowd boost activates from 40% instead of 70%.",
    rarity: "rare",
    cost: 100,
    icon: "📣",
  },
  {
    id: "turbo_charger",
    name: "Turbo Charger",
    description: "+15% base speed for the entire race.",
    rarity: "rare",
    cost: 140,
    icon: "🔥",
  },

  // ─── Epic (200-300 coins) ─────────────────────────────────────────
  {
    id: "earthquake",
    name: "Earthquake",
    description: "ALL racers get a random slowdown at the 50% mark — chaos equalizer.",
    rarity: "epic",
    cost: 200,
    icon: "🌋",
  },
  {
    id: "time_warp",
    name: "Time Warp",
    description: "Swap positions with the racer directly ahead of you at the 60% mark.",
    rarity: "epic",
    cost: 250,
    icon: "⏳",
  },
  {
    id: "clone_sprint",
    name: "Clone Sprint",
    description: "Your agility shortcut chance is tripled for the entire race.",
    rarity: "epic",
    cost: 220,
    icon: "👥",
  },

  // ─── Legendary (400-500 coins) ────────────────────────────────────
  {
    id: "ghost_mode",
    name: "Ghost Mode",
    description: "Phase through all obstacles for the first 40% of the race.",
    rarity: "legendary",
    cost: 400,
    icon: "👻",
  },
  {
    id: "photo_finish",
    name: "Photo Finish",
    description: "If you finish within 0.5s of the winner, you ALSO get 1st place points.",
    rarity: "legendary",
    cost: 450,
    icon: "📸",
  },
];

export const BUFF_MAP = new Map(BUFF_CATALOG.map((b) => [b.id, b]));

export const MAX_BUFFS_PER_ENTRY = 2;

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
