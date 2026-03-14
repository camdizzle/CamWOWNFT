import type { Stats, StatKey } from "../types/nft";

// ── Stat Progression System ────────────────────────────────────────────
// Slow, incremental stat gains from race performance.
// Designed so maxing out takes hundreds of races.

// ── Progression Constants ──────────────────────────────────────────────

// Max bonus any single stat can gain from progression
export const MAX_PROGRESSION_BONUS = 15;

// Per-race gains by placement (very small — takes ~100+ wins to max a stat)
const PLACEMENT_XP: Record<number, number> = {
  1: 3,   // 1st place
  2: 2,   // 2nd place
  3: 1,   // 3rd place
};

// XP needed per stat level (escalating curve)
// Level 1: 10 XP, Level 2: 25 XP, Level 3: 50 XP, etc.
function xpForLevel(level: number): number {
  if (level <= 0) return 0;
  return Math.floor(10 * Math.pow(level, 1.6));
}

// Total XP needed to reach a given level
export function totalXpForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i <= level; i++) {
    total += xpForLevel(i);
  }
  return total;
}

// ── Character Progression State ────────────────────────────────────────

export interface StatProgression {
  xp: number;
  level: number;
}

export interface CharacterProgression {
  characterId: string;
  statProgress: Record<StatKey, StatProgression>;
  totalRaces: number;
  totalWins: number;
  lastRaceTime: number;
}

export function createEmptyProgression(characterId: string): CharacterProgression {
  const statProgress = {} as Record<StatKey, StatProgression>;
  const keys: StatKey[] = ["speed", "toughness", "charisma", "luck", "stamina", "agility"];
  for (const key of keys) {
    statProgress[key] = { xp: 0, level: 0 };
  }
  return {
    characterId,
    statProgress,
    totalRaces: 0,
    totalWins: 0,
    lastRaceTime: 0,
  };
}

// ── Which stat gets XP from placement ──────────────────────────────────
// 1st place: XP to the character's HIGHEST base stat (reinforces strength)
// 2nd place: XP to a random stat weighted by base stats
// 3rd place: XP to the character's LOWEST base stat (shores up weakness)
// Participation: tiny XP to stamina (just for showing up)

export interface ProgressionGain {
  stat: StatKey;
  xpGained: number;
  leveledUp: boolean;
  newLevel: number;
}

export function applyRaceProgression(
  progression: CharacterProgression,
  baseStats: Stats,
  placement: number
): ProgressionGain[] {
  const gains: ProgressionGain[] = [];
  const keys: StatKey[] = ["speed", "toughness", "charisma", "luck", "stamina", "agility"];

  const xpEarned = PLACEMENT_XP[placement] ?? 0;

  // Everyone who races gets +1 stamina XP (participation reward)
  const participationStat: StatKey = "stamina";
  const partGain = applyXpToStat(progression, participationStat, 1);
  if (partGain) gains.push(partGain);

  if (xpEarned <= 0) return gains;

  // Determine which stat(s) receive the placement XP
  let targetStat: StatKey;

  if (placement === 1) {
    // Highest base stat gets XP (reinforce strengths)
    targetStat = keys.reduce((best, key) =>
      baseStats[key] > baseStats[best] ? key : best
    );
  } else if (placement === 3) {
    // Lowest base stat gets XP (shore up weakness)
    targetStat = keys.reduce((worst, key) =>
      baseStats[key] < baseStats[worst] ? key : worst
    );
  } else {
    // 2nd place: speed XP (the racing stat)
    targetStat = "speed";
  }

  const gain = applyXpToStat(progression, targetStat, xpEarned);
  if (gain) gains.push(gain);

  progression.totalRaces += 1;
  if (placement === 1) progression.totalWins += 1;
  progression.lastRaceTime = Date.now();

  return gains;
}

function applyXpToStat(
  progression: CharacterProgression,
  stat: StatKey,
  xp: number
): ProgressionGain | null {
  const sp = progression.statProgress[stat];
  if (sp.level >= MAX_PROGRESSION_BONUS) return null; // already maxed

  sp.xp += xp;

  let leveledUp = false;
  while (sp.level < MAX_PROGRESSION_BONUS && sp.xp >= xpForLevel(sp.level + 1)) {
    sp.xp -= xpForLevel(sp.level + 1);
    sp.level += 1;
    leveledUp = true;
  }

  // Clamp at max
  if (sp.level >= MAX_PROGRESSION_BONUS) {
    sp.level = MAX_PROGRESSION_BONUS;
    sp.xp = 0;
  }

  return {
    stat,
    xpGained: xp,
    leveledUp,
    newLevel: sp.level,
  };
}

// ── Apply progression bonuses to base stats ────────────────────────────

export function getEffectiveStats(
  baseStats: Stats,
  progression: CharacterProgression
): Stats {
  return {
    speed: baseStats.speed + progression.statProgress.speed.level,
    toughness: baseStats.toughness + progression.statProgress.toughness.level,
    charisma: baseStats.charisma + progression.statProgress.charisma.level,
    luck: baseStats.luck + progression.statProgress.luck.level,
    stamina: baseStats.stamina + progression.statProgress.stamina.level,
    agility: baseStats.agility + progression.statProgress.agility.level,
  };
}

// ── Progression summary for display ────────────────────────────────────

export function getProgressionSummary(progression: CharacterProgression): {
  totalBonusStats: number;
  statLevels: Record<StatKey, { level: number; xp: number; xpToNext: number; pct: number }>;
} {
  const keys: StatKey[] = ["speed", "toughness", "charisma", "luck", "stamina", "agility"];
  let totalBonusStats = 0;
  const statLevels = {} as Record<StatKey, { level: number; xp: number; xpToNext: number; pct: number }>;

  for (const key of keys) {
    const sp = progression.statProgress[key];
    totalBonusStats += sp.level;
    const xpToNext = sp.level >= MAX_PROGRESSION_BONUS ? 0 : xpForLevel(sp.level + 1);
    const pct = xpToNext > 0 ? (sp.xp / xpToNext) * 100 : 100;
    statLevels[key] = { level: sp.level, xp: sp.xp, xpToNext, pct };
  }

  return { totalBonusStats, statLevels };
}
