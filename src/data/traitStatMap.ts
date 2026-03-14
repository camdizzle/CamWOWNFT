import type { Stats, StatKey } from "../types/nft";

// ── Stat Modifier: how a single trait value impacts stats ──────────────

interface StatModifier {
  stat: StatKey;
  value: number;
}

// ── Master Trait → Stat Mapping ────────────────────────────────────────
// Each trait_type has a map of possible values → stat bonuses.
// Extend this as your collection grows.

export const TRAIT_STAT_MAP: Record<string, Record<string, StatModifier[]>> = {
  // ─── Skin / Body ───────────────────────────────────────────────────
  Skin: {
    Diamond: [
      { stat: "toughness", value: 5 },
      { stat: "charisma", value: 2 },
    ],
    Gold: [
      { stat: "charisma", value: 4 },
      { stat: "luck", value: 3 },
    ],
    Silver: [
      { stat: "toughness", value: 3 },
      { stat: "charisma", value: 2 },
    ],
    Bronze: [
      { stat: "toughness", value: 2 },
      { stat: "stamina", value: 2 },
    ],
    Obsidian: [
      { stat: "toughness", value: 4 },
      { stat: "agility", value: 1 },
    ],
    Crystal: [
      { stat: "luck", value: 3 },
      { stat: "charisma", value: 3 },
    ],
    Lava: [
      { stat: "toughness", value: 3 },
      { stat: "speed", value: 2 },
    ],
    Ice: [
      { stat: "agility", value: 3 },
      { stat: "toughness", value: 2 },
    ],
    Neon: [
      { stat: "speed", value: 3 },
      { stat: "charisma", value: 2 },
    ],
    Default: [{ stat: "toughness", value: 1 }],
  },

  // ─── Eyes / Eyewear ────────────────────────────────────────────────
  Eyes: {
    Sunglasses: [
      { stat: "charisma", value: 5 },
      { stat: "luck", value: 1 },
    ],
    "Laser Eyes": [
      { stat: "speed", value: 3 },
      { stat: "toughness", value: 2 },
    ],
    "3D Glasses": [
      { stat: "luck", value: 3 },
      { stat: "agility", value: 2 },
    ],
    Monocle: [
      { stat: "charisma", value: 4 },
      { stat: "luck", value: 2 },
    ],
    Visor: [
      { stat: "speed", value: 3 },
      { stat: "agility", value: 2 },
    ],
    Goggles: [
      { stat: "stamina", value: 3 },
      { stat: "toughness", value: 2 },
    ],
    "Heart Eyes": [
      { stat: "charisma", value: 4 },
      { stat: "luck", value: 1 },
    ],
    "Glowing Eyes": [
      { stat: "luck", value: 3 },
      { stat: "charisma", value: 2 },
    ],
    Default: [{ stat: "charisma", value: 1 }],
  },

  // ─── Headwear ──────────────────────────────────────────────────────
  Headwear: {
    Crown: [
      { stat: "charisma", value: 5 },
      { stat: "luck", value: 3 },
    ],
    Helmet: [
      { stat: "toughness", value: 5 },
      { stat: "stamina", value: 2 },
    ],
    "Baseball Cap": [
      { stat: "agility", value: 3 },
      { stat: "speed", value: 2 },
    ],
    Beanie: [
      { stat: "stamina", value: 3 },
      { stat: "luck", value: 1 },
    ],
    Halo: [
      { stat: "luck", value: 5 },
      { stat: "charisma", value: 2 },
    ],
    Horns: [
      { stat: "toughness", value: 3 },
      { stat: "speed", value: 2 },
    ],
    Bandana: [
      { stat: "agility", value: 3 },
      { stat: "charisma", value: 2 },
    ],
    "Top Hat": [
      { stat: "charisma", value: 4 },
      { stat: "luck", value: 2 },
    ],
    Mohawk: [
      { stat: "speed", value: 3 },
      { stat: "charisma", value: 2 },
    ],
    Default: [{ stat: "stamina", value: 1 }],
  },

  // ─── Clothing / Outfit ────────────────────────────────────────────
  Clothing: {
    Armor: [
      { stat: "toughness", value: 5 },
      { stat: "stamina", value: 3 },
    ],
    Cape: [
      { stat: "speed", value: 3 },
      { stat: "charisma", value: 3 },
    ],
    Hoodie: [
      { stat: "agility", value: 3 },
      { stat: "stamina", value: 2 },
    ],
    Suit: [
      { stat: "charisma", value: 5 },
      { stat: "luck", value: 2 },
    ],
    Jersey: [
      { stat: "speed", value: 3 },
      { stat: "stamina", value: 3 },
    ],
    "Lab Coat": [
      { stat: "luck", value: 3 },
      { stat: "stamina", value: 2 },
    ],
    Leather: [
      { stat: "toughness", value: 3 },
      { stat: "charisma", value: 2 },
    ],
    Robe: [
      { stat: "luck", value: 4 },
      { stat: "stamina", value: 2 },
    ],
    Tank: [
      { stat: "speed", value: 2 },
      { stat: "agility", value: 3 },
    ],
    Default: [{ stat: "stamina", value: 1 }],
  },

  // ─── Accessories ───────────────────────────────────────────────────
  Accessory: {
    Chain: [
      { stat: "charisma", value: 3 },
      { stat: "luck", value: 2 },
    ],
    Shield: [
      { stat: "toughness", value: 5 },
      { stat: "stamina", value: 1 },
    ],
    Sword: [
      { stat: "speed", value: 3 },
      { stat: "toughness", value: 3 },
    ],
    Wand: [
      { stat: "luck", value: 4 },
      { stat: "charisma", value: 2 },
    ],
    Skateboard: [
      { stat: "speed", value: 4 },
      { stat: "agility", value: 3 },
    ],
    Guitar: [
      { stat: "charisma", value: 5 },
      { stat: "luck", value: 1 },
    ],
    Watch: [
      { stat: "luck", value: 3 },
      { stat: "speed", value: 2 },
    ],
    Backpack: [
      { stat: "stamina", value: 4 },
      { stat: "agility", value: 2 },
    ],
    Default: [{ stat: "luck", value: 1 }],
  },

  // ─── Background ───────────────────────────────────────────────────
  Background: {
    Space: [
      { stat: "luck", value: 3 },
      { stat: "speed", value: 2 },
    ],
    Fire: [
      { stat: "toughness", value: 3 },
      { stat: "speed", value: 2 },
    ],
    Ocean: [
      { stat: "stamina", value: 3 },
      { stat: "agility", value: 2 },
    ],
    Forest: [
      { stat: "agility", value: 3 },
      { stat: "stamina", value: 2 },
    ],
    City: [
      { stat: "charisma", value: 2 },
      { stat: "speed", value: 2 },
    ],
    Desert: [
      { stat: "stamina", value: 4 },
      { stat: "toughness", value: 1 },
    ],
    Arctic: [
      { stat: "toughness", value: 3 },
      { stat: "stamina", value: 2 },
    ],
    Neon: [
      { stat: "charisma", value: 3 },
      { stat: "luck", value: 2 },
    ],
    Galaxy: [
      { stat: "luck", value: 4 },
      { stat: "charisma", value: 2 },
    ],
    Default: [{ stat: "luck", value: 1 }],
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
