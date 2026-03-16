// ── Race Buff System ───────────────────────────────────────────────────
// Buffs are purchasable with coins OR SOL. Some premium buffs are SOL-only.
// Max 2 buffs per NFT per race. Consumed on use.

export type BuffRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export interface BuffDefinition {
  id: string;
  name: string;
  description: string;
  rarity: BuffRarity;
  cost: number; // coins (0 if SOL-only)
  solPrice: number; // SOL price (0 if coins-only, >0 if purchasable with SOL)
  premiumOnly: boolean; // true = SOL purchase only, false = coins OR SOL
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
  // ─── Common (30-50 coins OR 0.005-0.01 SOL) ──────────────────────
  {
    id: "nitro_boost",
    name: "Nitro Boost",
    description: "+30% speed for one burst at a random point in the race.",
    rarity: "common",
    cost: 30,
    solPrice: 0.005,
    premiumOnly: false,
    icon: "🚀",
  },
  {
    id: "banana_peel",
    name: "Banana Peel",
    description: "A random opponent hits a slowdown obstacle mid-race.",
    rarity: "common",
    cost: 40,
    solPrice: 0.007,
    premiumOnly: false,
    icon: "🍌",
  },
  {
    id: "energy_drink",
    name: "Energy Drink",
    description: "Fatigue point delayed by 20% — stay fast longer.",
    rarity: "common",
    cost: 35,
    solPrice: 0.006,
    premiumOnly: false,
    icon: "⚡",
  },
  {
    id: "lucky_penny",
    name: "Lucky Penny",
    description: "Luck burst chance doubled for this race.",
    rarity: "common",
    cost: 30,
    solPrice: 0.005,
    premiumOnly: false,
    icon: "🪙",
  },

  // ─── Uncommon (60-90 coins OR 0.01-0.015 SOL) ────────────────────
  {
    id: "slipstream",
    name: "Slipstream",
    description: "Draft behind the leader — speed boost in the final 20% if you're 2nd-4th.",
    rarity: "uncommon",
    cost: 70,
    solPrice: 0.012,
    premiumOnly: false,
    icon: "💨",
  },
  {
    id: "double_luck",
    name: "Four-Leaf Clover",
    description: "Double your luck stat for this race.",
    rarity: "uncommon",
    cost: 60,
    solPrice: 0.01,
    premiumOnly: false,
    icon: "🍀",
  },
  {
    id: "rubber_bumpers",
    name: "Rubber Bumpers",
    description: "Collision penalties reduced by 75%.",
    rarity: "uncommon",
    cost: 65,
    solPrice: 0.011,
    premiumOnly: false,
    icon: "🛞",
  },
  {
    id: "head_start",
    name: "Head Start",
    description: "Start the race at position 5 instead of 0.",
    rarity: "uncommon",
    cost: 80,
    solPrice: 0.013,
    premiumOnly: false,
    icon: "🏃",
  },

  // ─── Rare (100-150 coins OR 0.02-0.03 SOL) ─────────────────────
  {
    id: "shield_wall",
    name: "Shield Wall",
    description: "Immune to ALL collision penalties this race.",
    rarity: "rare",
    cost: 120,
    solPrice: 0.02,
    premiumOnly: false,
    icon: "🛡️",
  },
  {
    id: "crowd_frenzy",
    name: "Crowd Frenzy",
    description: "Charisma crowd boost activates from 40% instead of 70%.",
    rarity: "rare",
    cost: 100,
    solPrice: 0.018,
    premiumOnly: false,
    icon: "📣",
  },
  {
    id: "turbo_charger",
    name: "Turbo Charger",
    description: "+15% base speed for the entire race.",
    rarity: "rare",
    cost: 140,
    solPrice: 0.025,
    premiumOnly: false,
    icon: "🔥",
  },

  // ─── Epic (200-300 coins OR 0.04-0.06 SOL) ─────────────────────
  {
    id: "earthquake",
    name: "Earthquake",
    description: "ALL racers get a random slowdown at the 50% mark — chaos equalizer.",
    rarity: "epic",
    cost: 200,
    solPrice: 0.04,
    premiumOnly: false,
    icon: "🌋",
  },
  {
    id: "time_warp",
    name: "Time Warp",
    description: "Swap positions with the racer directly ahead of you at the 60% mark.",
    rarity: "epic",
    cost: 250,
    solPrice: 0.05,
    premiumOnly: false,
    icon: "⏳",
  },
  {
    id: "clone_sprint",
    name: "Clone Sprint",
    description: "Your agility shortcut chance is tripled for the entire race.",
    rarity: "epic",
    cost: 220,
    solPrice: 0.045,
    premiumOnly: false,
    icon: "👥",
  },

  // ─── Legendary (400-500 coins OR 0.08-0.1 SOL) ────────────────
  {
    id: "ghost_mode",
    name: "Ghost Mode",
    description: "Phase through all obstacles for the first 40% of the race.",
    rarity: "legendary",
    cost: 400,
    solPrice: 0.08,
    premiumOnly: false,
    icon: "👻",
  },
  {
    id: "photo_finish",
    name: "Photo Finish",
    description: "If you finish within 0.5s of the winner, you ALSO get 1st place points.",
    rarity: "legendary",
    cost: 450,
    solPrice: 0.09,
    premiumOnly: false,
    icon: "📸",
  },

  // ─── PREMIUM ONLY (SOL purchase only) ──────────────────────────
  {
    id: "warp_drive",
    name: "Warp Drive",
    description: "Teleport to 1st place position at the 75% mark. One-time burst.",
    rarity: "legendary",
    cost: 0,
    solPrice: 0.15,
    premiumOnly: true,
    icon: "🌀",
  },
  {
    id: "gravity_well",
    name: "Gravity Well",
    description: "All opponents within 10% of your position get pulled back 5% at the 50% mark.",
    rarity: "epic",
    cost: 0,
    solPrice: 0.08,
    premiumOnly: true,
    icon: "🕳️",
  },
  {
    id: "mirror_image",
    name: "Mirror Image",
    description: "Copy the best buff active in the race and apply it to yourself.",
    rarity: "epic",
    cost: 0,
    solPrice: 0.07,
    premiumOnly: true,
    icon: "🪞",
  },
  {
    id: "golden_ticket",
    name: "Golden Ticket",
    description: "+50% coin earnings from this race. Stacks with placement bonuses.",
    rarity: "rare",
    cost: 0,
    solPrice: 0.03,
    premiumOnly: true,
    icon: "🎫",
  },
  {
    id: "adrenaline_surge",
    name: "Adrenaline Surge",
    description: "When you drop below 4th place, get a massive +40% speed burst for 3 ticks.",
    rarity: "uncommon",
    cost: 0,
    solPrice: 0.02,
    premiumOnly: true,
    icon: "💉",
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

// ── Currency helpers ───────────────────────────────────────────────────

export type PurchaseCurrency = "coins" | "sol";

export function canPurchaseWithCoins(buff: BuffDefinition): boolean {
  return !buff.premiumOnly && buff.cost > 0;
}

export function canPurchaseWithSol(buff: BuffDefinition): boolean {
  return buff.solPrice > 0;
}
