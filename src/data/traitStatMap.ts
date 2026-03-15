import type { Stats, StatKey } from "../types/nft";

// ── Stat Modifier: how a single trait value impacts stats ──────────────

interface StatModifier {
  stat: StatKey;
  value: number;
}

// ── Trait Tier Reference ────────────────────────────────────────────────
//
//   S-tier  →  +4 primary, +1 secondary   (Legendary / 1-of-1)
//   A-tier  →  +3 primary, +1 secondary   (Rare)
//   B-tier  →  +2 primary                 (Uncommon)
//   C-tier  →  +1 primary                 (Common)
//
// Empty slots (no trait) contribute nothing — this is the main driver
// of the power gap between common and legendary NFTs.

// ── Master Trait → Stat Mapping ────────────────────────────────────────
// CamWOW Series 1 real traits.  11 trait categories.

export const TRAIT_STAT_MAP: Record<string, Record<string, StatModifier[]>> = {
  // ─── Skin / Body ───────────────────────────────────────────────────
  Skin: {
    "Solid Gold": [
      { stat: "charisma", value: 4 },
      { stat: "luck", value: 1 },
    ],
    Diamond: [
      { stat: "toughness", value: 4 },
      { stat: "charisma", value: 1 },
    ],
    Obsidian: [
      { stat: "toughness", value: 3 },
      { stat: "agility", value: 1 },
    ],
    Crystal: [
      { stat: "luck", value: 3 },
      { stat: "charisma", value: 1 },
    ],
    Lava: [
      { stat: "toughness", value: 3 },
    ],
    Silver: [
      { stat: "toughness", value: 2 },
      { stat: "charisma", value: 1 },
    ],
    Ice: [
      { stat: "agility", value: 2 },
      { stat: "toughness", value: 1 },
    ],
    Neon: [
      { stat: "speed", value: 2 },
      { stat: "charisma", value: 1 },
    ],
    Bronze: [
      { stat: "toughness", value: 2 },
    ],
    OG: [{ stat: "charisma", value: 1 }],
    Default: [{ stat: "toughness", value: 1 }],
  },

  // ─── Eyes / Eyewear ────────────────────────────────────────────────
  Eyes: {
    "Cyborg Eyes": [
      { stat: "speed", value: 4 },
      { stat: "luck", value: 1 },
    ],
    "Laser Eyes": [
      { stat: "speed", value: 3 },
      { stat: "toughness", value: 1 },
    ],
    Sunglasses: [
      { stat: "charisma", value: 3 },
      { stat: "luck", value: 1 },
    ],
    "3D Glasses": [
      { stat: "luck", value: 2 },
      { stat: "agility", value: 1 },
    ],
    Monocle: [
      { stat: "charisma", value: 2 },
    ],
    Visor: [
      { stat: "speed", value: 2 },
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
      { stat: "charisma", value: 4 },
      { stat: "luck", value: 1 },
    ],
    "Diamond Tiara": [
      { stat: "luck", value: 4 },
      { stat: "charisma", value: 1 },
    ],
    Helmet: [
      { stat: "toughness", value: 3 },
      { stat: "stamina", value: 1 },
    ],
    Halo: [
      { stat: "luck", value: 3 },
      { stat: "charisma", value: 1 },
    ],
    "Baseball Cap": [
      { stat: "agility", value: 2 },
    ],
    Beanie: [
      { stat: "stamina", value: 2 },
    ],
    Bandana: [
      { stat: "agility", value: 2 },
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
      { stat: "toughness", value: 4 },
      { stat: "charisma", value: 1 },
    ],
    Armor: [
      { stat: "toughness", value: 3 },
      { stat: "stamina", value: 1 },
    ],
    Suit: [
      { stat: "charisma", value: 3 },
      { stat: "luck", value: 1 },
    ],
    Cape: [
      { stat: "speed", value: 2 },
      { stat: "charisma", value: 1 },
    ],
    Hoodie: [
      { stat: "agility", value: 2 },
    ],
    Jersey: [
      { stat: "speed", value: 2 },
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
      { stat: "charisma", value: 4 },
      { stat: "luck", value: 1 },
    ],
    "Gold Watch": [
      { stat: "luck", value: 3 },
      { stat: "charisma", value: 1 },
    ],
    Skateboard: [
      { stat: "speed", value: 3 },
      { stat: "agility", value: 1 },
    ],
    Shield: [
      { stat: "toughness", value: 2 },
    ],
    Chain: [
      { stat: "charisma", value: 2 },
    ],
    Backpack: [
      { stat: "stamina", value: 2 },
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
      { stat: "luck", value: 4 },
      { stat: "charisma", value: 1 },
    ],
    Galaxy: [
      { stat: "luck", value: 3 },
      { stat: "speed", value: 1 },
    ],
    Space: [
      { stat: "luck", value: 2 },
      { stat: "speed", value: 1 },
    ],
    Fire: [
      { stat: "toughness", value: 2 },
    ],
    Ocean: [
      { stat: "stamina", value: 2 },
    ],
    City: [
      { stat: "charisma", value: 1 },
      { stat: "speed", value: 1 },
    ],
    Forest: [
      { stat: "agility", value: 2 },
    ],
    Desert: [
      { stat: "stamina", value: 2 },
    ],
    Plain: [{ stat: "luck", value: 1 }],
    Default: [{ stat: "luck", value: 1 }],
  },

  // ─── Mouth / Expression ───────────────────────────────────────────
  Mouth: {
    "Gold Grill": [
      { stat: "charisma", value: 4 },
      { stat: "luck", value: 1 },
    ],
    "Diamond Grill": [
      { stat: "charisma", value: 3 },
      { stat: "toughness", value: 1 },
    ],
    Cigar: [
      { stat: "toughness", value: 2 },
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
      { stat: "charisma", value: 3 },
      { stat: "luck", value: 1 },
    ],
    "Full Beard": [
      { stat: "toughness", value: 2 },
      { stat: "charisma", value: 1 },
    ],
    Goatee: [
      { stat: "charisma", value: 2 },
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
      { stat: "luck", value: 3 },
      { stat: "charisma", value: 1 },
    ],
    "Gold Hoops": [
      { stat: "charisma", value: 2 },
      { stat: "luck", value: 1 },
    ],
    AirPods: [
      { stat: "speed", value: 2 },
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
      { stat: "toughness", value: 3 },
      { stat: "charisma", value: 1 },
    ],
    "Tribal Mark": [
      { stat: "toughness", value: 2 },
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
      { stat: "charisma", value: 4 },
      { stat: "luck", value: 1 },
    ],
    "420 Badge": [
      { stat: "luck", value: 3 },
      { stat: "charisma", value: 1 },
    ],
    "OG Tag": [
      { stat: "luck", value: 2 },
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
