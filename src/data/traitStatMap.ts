import type { Stats, StatKey } from "../types/nft";

// ── Stat Modifier: how a single trait value impacts stats ──────────────

interface StatModifier {
  stat: StatKey;
  value: number;
}

// ── Trait Tier Reference ────────────────────────────────────────────────
//
//   S-tier  →  +2 primary, +1 secondary   (Legendary / 1-of-1)
//   A-tier  →  +2 primary                 (Rare)
//   B-tier  →  +1 primary                 (Uncommon)
//   C-tier  →  +1 primary                 (Common)
//
// Stat bonuses are intentionally compressed so that rarer NFTs enjoy a
// modest edge (~10 % higher win-rate) rather than dominating outright.
// The real differentiator is progression: levelling up through races
// and battles lets any NFT close the gap over time.

// ── Master Trait → Stat Mapping ────────────────────────────────────────
// CamWOW Series 1 real traits.  11 trait categories.

export const TRAIT_STAT_MAP: Record<string, Record<string, StatModifier[]>> = {
  // ─── Skin / Body ───────────────────────────────────────────────────
  Skin: {
    "Solid Gold": [
      { stat: "charisma", value: 2 },
      { stat: "luck", value: 1 },
    ],
    Diamond: [
      { stat: "toughness", value: 2 },
      { stat: "charisma", value: 1 },
    ],
    Obsidian: [
      { stat: "toughness", value: 2 },
    ],
    Crystal: [
      { stat: "luck", value: 2 },
    ],
    Lava: [
      { stat: "toughness", value: 2 },
    ],
    Silver: [
      { stat: "toughness", value: 1 },
      { stat: "charisma", value: 1 },
    ],
    Ice: [
      { stat: "agility", value: 1 },
      { stat: "toughness", value: 1 },
    ],
    Neon: [
      { stat: "speed", value: 1 },
      { stat: "charisma", value: 1 },
    ],
    Bronze: [
      { stat: "toughness", value: 1 },
    ],
    OG: [{ stat: "charisma", value: 1 }],
    Default: [{ stat: "toughness", value: 1 }],
  },

  // ─── Eyes / Eyewear ────────────────────────────────────────────────
  Eyes: {
    "Cyborg Eyes": [
      { stat: "speed", value: 2 },
      { stat: "luck", value: 1 },
    ],
    "Laser Eyes": [
      { stat: "speed", value: 2 },
    ],
    Sunglasses: [
      { stat: "charisma", value: 2 },
    ],
    "3D Glasses": [
      { stat: "luck", value: 1 },
      { stat: "agility", value: 1 },
    ],
    Monocle: [
      { stat: "charisma", value: 1 },
    ],
    Visor: [
      { stat: "speed", value: 1 },
    ],
    "Heart Eyes": [
      { stat: "charisma", value: 1 },
    ],
    "Wide Eyes": [
      { stat: "luck", value: 1 },
    ],
    Squint: [{ stat: "agility", value: 1 }],
    Default: [{ stat: "charisma", value: 1 }],
  },

  // ─── Headwear ──────────────────────────────────────────────────────
  Headwear: {
    "Bronze Crown": [
      { stat: "charisma", value: 2 },
      { stat: "luck", value: 1 },
    ],
    "Diamond Tiara": [
      { stat: "luck", value: 2 },
      { stat: "charisma", value: 1 },
    ],
    Helmet: [
      { stat: "toughness", value: 2 },
    ],
    Halo: [
      { stat: "luck", value: 2 },
    ],
    "Baseball Cap": [
      { stat: "agility", value: 1 },
    ],
    Beanie: [
      { stat: "stamina", value: 1 },
    ],
    Bandana: [
      { stat: "agility", value: 1 },
    ],
    "Backwards Cap": [
      { stat: "speed", value: 1 },
    ],
    None: [],
    Default: [{ stat: "stamina", value: 1 }],
  },

  // ─── Clothing / Outfit ────────────────────────────────────────────
  Clothing: {
    "Gold Armor": [
      { stat: "toughness", value: 2 },
      { stat: "charisma", value: 1 },
    ],
    Armor: [
      { stat: "toughness", value: 2 },
    ],
    Suit: [
      { stat: "charisma", value: 2 },
    ],
    Cape: [
      { stat: "speed", value: 1 },
      { stat: "charisma", value: 1 },
    ],
    Hoodie: [
      { stat: "agility", value: 1 },
    ],
    Jersey: [
      { stat: "speed", value: 1 },
    ],
    "Plain Tee": [
      { stat: "stamina", value: 1 },
    ],
    Tank: [
      { stat: "speed", value: 1 },
    ],
    None: [],
    Default: [{ stat: "stamina", value: 1 }],
  },

  // ─── Accessories ───────────────────────────────────────────────────
  Accessory: {
    "Diamond Chain": [
      { stat: "charisma", value: 2 },
      { stat: "luck", value: 1 },
    ],
    "Gold Watch": [
      { stat: "luck", value: 2 },
    ],
    Skateboard: [
      { stat: "speed", value: 2 },
    ],
    Shield: [
      { stat: "toughness", value: 1 },
    ],
    Chain: [
      { stat: "charisma", value: 1 },
    ],
    Backpack: [
      { stat: "stamina", value: 1 },
    ],
    Wristband: [
      { stat: "stamina", value: 1 },
    ],
    None: [],
    Default: [{ stat: "luck", value: 1 }],
  },

  // ─── Background ───────────────────────────────────────────────────
  Background: {
    "420": [
      { stat: "luck", value: 2 },
      { stat: "charisma", value: 1 },
    ],
    Galaxy: [
      { stat: "luck", value: 2 },
    ],
    Space: [
      { stat: "luck", value: 1 },
      { stat: "speed", value: 1 },
    ],
    Fire: [
      { stat: "toughness", value: 1 },
    ],
    Ocean: [
      { stat: "stamina", value: 1 },
    ],
    City: [
      { stat: "charisma", value: 1 },
      { stat: "speed", value: 1 },
    ],
    Forest: [
      { stat: "agility", value: 1 },
    ],
    Desert: [
      { stat: "stamina", value: 1 },
    ],
    Plain: [{ stat: "luck", value: 1 }],
    Default: [{ stat: "luck", value: 1 }],
  },

  // ─── Mouth / Expression ───────────────────────────────────────────
  Mouth: {
    "Gold Grill": [
      { stat: "charisma", value: 2 },
      { stat: "luck", value: 1 },
    ],
    "Diamond Grill": [
      { stat: "charisma", value: 2 },
    ],
    Cigar: [
      { stat: "toughness", value: 1 },
    ],
    Smirk: [
      { stat: "charisma", value: 1 },
    ],
    Grin: [
      { stat: "luck", value: 1 },
    ],
    Neutral: [{ stat: "stamina", value: 1 }],
    None: [],
    Default: [],
  },

  // ─── Facial Hair ──────────────────────────────────────────────────
  "Facial Hair": {
    "Gold Mustache": [
      { stat: "charisma", value: 2 },
    ],
    "Full Beard": [
      { stat: "toughness", value: 1 },
      { stat: "charisma", value: 1 },
    ],
    Goatee: [
      { stat: "charisma", value: 1 },
    ],
    Stubble: [
      { stat: "toughness", value: 1 },
    ],
    None: [],
    Default: [],
  },

  // ─── Ear Accessories ──────────────────────────────────────────────
  Ears: {
    "Diamond Studs": [
      { stat: "luck", value: 2 },
    ],
    "Gold Hoops": [
      { stat: "charisma", value: 2 },
    ],
    AirPods: [
      { stat: "speed", value: 1 },
    ],
    Studs: [
      { stat: "charisma", value: 1 },
    ],
    None: [],
    Default: [],
  },

  // ─── Tattoos / Body Art ───────────────────────────────────────────
  Tattoo: {
    "Full Sleeve": [
      { stat: "toughness", value: 2 },
    ],
    "Tribal Mark": [
      { stat: "toughness", value: 1 },
    ],
    "Small Ink": [
      { stat: "charisma", value: 1 },
    ],
    None: [],
    Default: [],
  },

  // ─── Special / Logos / 1-of-1 ─────────────────────────────────────
  Special: {
    "CamWOW Logo": [
      { stat: "charisma", value: 2 },
      { stat: "luck", value: 1 },
    ],
    "420 Badge": [
      { stat: "luck", value: 2 },
    ],
    "OG Tag": [
      { stat: "luck", value: 1 },
    ],
    Verified: [
      { stat: "charisma", value: 1 },
    ],
    None: [],
    Default: [],
  },
};

// ── Base Stats ─────────────────────────────────────────────────────────

export function createBaseStats(): Stats {
  return { speed: 5, toughness: 5, charisma: 5, luck: 5, stamina: 5, agility: 5 };
}

// ── Calculate Stats from Traits ────────────────────────────────────────

export function calculateStats(
  traits: { trait_type: string; value: string }[]
): Stats {
  const stats = createBaseStats();

  for (const trait of traits) {
    const traitMap = TRAIT_STAT_MAP[trait.trait_type];
    if (!traitMap) continue;

    const modifiers = traitMap[trait.value] ?? traitMap["Default"];
    if (!modifiers) continue;

    for (const mod of modifiers) {
      stats[mod.stat] += mod.value;
    }
  }

  return stats;
}

export function totalPower(stats: Stats): number {
  return stats.speed + stats.toughness + stats.charisma + stats.luck + stats.stamina + stats.agility;
}

// ── Stat display helpers ───────────────────────────────────────────────

export const STAT_COLORS: Record<StatKey, string> = {
  speed: "#ff6b6b",
  toughness: "#4ecdc4",
  charisma: "#ffe66d",
  luck: "#a29bfe",
  stamina: "#55efc4",
  agility: "#fd79a8",
};

export const STAT_ICONS: Record<StatKey, string> = {
  speed: "⚡",
  toughness: "🛡️",
  charisma: "✨",
  luck: "🍀",
  stamina: "❤️",
  agility: "🌪️",
};
