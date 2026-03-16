import type { Stats, StatKey } from "../types/nft";

// ── Stat Progression System ────────────────────────────────────────────
// Slow, incremental stat gains from race performance.
// Designed so maxing out takes hundreds of races.

// ── Progression Constants ──────────────────────────────────────────────

// Max bonus any single stat can gain from progression
export const MAX_PROGRESSION_BONUS = 15;

// Max overall NFT level
export const MAX_NFT_LEVEL = 50;

// Per-race stat-XP gains by placement (very small — takes ~100+ wins to max a stat)
const PLACEMENT_STAT_XP: Record<number, number> = {
  1: 3,   // 1st place
  2: 2,   // 2nd place
  3: 1,   // 3rd place
};

// ── Overall NFT XP Awards ────────────────────────────────────────────
// These are for the NFT's overall level, separate from per-stat XP.

// Race XP by placement
const RACE_XP: Record<number, number> = {
  1: 120,  // 1st place
  2: 85,   // 2nd place
  3: 60,   // 3rd place
};
const RACE_XP_PARTICIPATION = 30; // 4th place and below

// Battle XP
const BATTLE_XP_WIN = 80;
const BATTLE_XP_LOSS = 25;

// XP needed per stat level (escalating curve)
// Level 1: 10 XP, Level 2: 25 XP, Level 3: 50 XP, etc.
function xpForStatLevel(level: number): number {
  if (level <= 0) return 0;
  return Math.floor(10 * Math.pow(level, 1.6));
}

// XP needed for next overall NFT level (gentle curve)
// Level 1: 80 XP, Level 10: ~897, Level 25: ~2349, Level 50: ~4864
// Total to max: ~121k XP — achievable in ~11 months of dedicated play
export function xpForNftLevel(level: number): number {
  if (level <= 0) return 0;
  return Math.floor(80 * Math.pow(level, 1.05));
}

// Total XP needed to reach a given stat level
export function totalXpForStatLevel(level: number): number {
  let total = 0;
  for (let i = 1; i <= level; i++) {
    total += xpForStatLevel(i);
  }
  return total;
}

// Total XP needed to reach a given NFT level
export function totalXpForNftLevel(level: number): number {
  let total = 0;
  for (let i = 1; i <= level; i++) {
    total += xpForNftLevel(i);
  }
  return total;
}

// Legacy alias
export const totalXpForLevel = totalXpForStatLevel;

// ── Character Progression State ────────────────────────────────────────

export interface StatProgression {
  xp: number;
  level: number;
}

export interface CharacterProgression {
  characterId: string;
  statProgress: Record<StatKey, StatProgression>;
  // Overall NFT level
  xp: number;
  level: number;
  // Activity counters
  totalRaces: number;
  totalWins: number;
  totalBattles: number;
  totalBattleWins: number;
  lastRaceTime: number;
  lastBattleTime: number;
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
    xp: 0,
    level: 0,
    totalRaces: 0,
    totalWins: 0,
    totalBattles: 0,
    totalBattleWins: 0,
    lastRaceTime: 0,
    lastBattleTime: 0,
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

export interface LevelUpEvent {
  previousLevel: number;
  newLevel: number;
  xpAwarded: number;
}

export function applyRaceProgression(
  progression: CharacterProgression,
  baseStats: Stats,
  placement: number
): { statGains: ProgressionGain[]; levelUp: LevelUpEvent | null } {
  const statGains: ProgressionGain[] = [];
  const keys: StatKey[] = ["speed", "toughness", "charisma", "luck", "stamina", "agility"];

  const statXpEarned = PLACEMENT_STAT_XP[placement] ?? 0;

  // Everyone who races gets +1 stamina stat-XP (participation reward)
  const partGain = applyXpToStat(progression, "stamina", 1);
  if (partGain) statGains.push(partGain);

  if (statXpEarned > 0) {
    // Determine which stat(s) receive the placement stat-XP
    let targetStat: StatKey;

    if (placement === 1) {
      targetStat = keys.reduce((best, key) =>
        baseStats[key] > baseStats[best] ? key : best
      );
    } else if (placement === 3) {
      targetStat = keys.reduce((worst, key) =>
        baseStats[key] < baseStats[worst] ? key : worst
      );
    } else {
      targetStat = "speed";
    }

    const gain = applyXpToStat(progression, targetStat, statXpEarned);
    if (gain) statGains.push(gain);
  }

  // Overall NFT XP from race
  const nftXp = RACE_XP[placement] ?? RACE_XP_PARTICIPATION;
  const levelUp = applyNftXp(progression, nftXp);

  progression.totalRaces += 1;
  if (placement === 1) progression.totalWins += 1;
  progression.lastRaceTime = Date.now();

  return { statGains, levelUp };
}

// ── Battle Progression ───────────────────────────────────────────────
// Battles award overall NFT XP + stat XP based on outcome.
// All 6 stats can grow from battles — winners and losers gain different stats.
//
// Winner: +2 toughness (proved durability), +1 luck, +1 agility (combat reflexes)
// Loser:  +1 stamina (endurance), +1 charisma (learned from defeat), +1 speed (got faster)

export function applyBattleProgression(
  progression: CharacterProgression,
  baseStats: Stats,
  won: boolean
): { statGains: ProgressionGain[]; levelUp: LevelUpEvent | null } {
  const statGains: ProgressionGain[] = [];

  if (won) {
    const tough = applyXpToStat(progression, "toughness", 2);
    if (tough) statGains.push(tough);
    const luck = applyXpToStat(progression, "luck", 1);
    if (luck) statGains.push(luck);
    const agility = applyXpToStat(progression, "agility", 1);
    if (agility) statGains.push(agility);
  } else {
    const stam = applyXpToStat(progression, "stamina", 1);
    if (stam) statGains.push(stam);
    const charisma = applyXpToStat(progression, "charisma", 1);
    if (charisma) statGains.push(charisma);
    const speed = applyXpToStat(progression, "speed", 1);
    if (speed) statGains.push(speed);
  }

  // Overall NFT XP from battle
  const nftXp = won ? BATTLE_XP_WIN : BATTLE_XP_LOSS;
  const levelUp = applyNftXp(progression, nftXp);

  progression.totalBattles += 1;
  if (won) progression.totalBattleWins += 1;
  progression.lastBattleTime = Date.now();

  return { statGains, levelUp };
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
  while (sp.level < MAX_PROGRESSION_BONUS && sp.xp >= xpForStatLevel(sp.level + 1)) {
    sp.xp -= xpForStatLevel(sp.level + 1);
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

function applyNftXp(
  progression: CharacterProgression,
  xp: number
): LevelUpEvent | null {
  if (progression.level >= MAX_NFT_LEVEL) return null;

  const prevLevel = progression.level;
  progression.xp += xp;

  while (progression.level < MAX_NFT_LEVEL && progression.xp >= xpForNftLevel(progression.level + 1)) {
    progression.xp -= xpForNftLevel(progression.level + 1);
    progression.level += 1;
  }

  if (progression.level >= MAX_NFT_LEVEL) {
    progression.level = MAX_NFT_LEVEL;
    progression.xp = 0;
  }

  if (progression.level > prevLevel) {
    return { previousLevel: prevLevel, newLevel: progression.level, xpAwarded: xp };
  }
  return null;
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

export interface ProgressionSummary {
  // Overall NFT level
  nftLevel: number;
  nftXp: number;
  nftXpToNext: number;
  nftXpPct: number;
  isMaxLevel: boolean;
  // Per-stat
  totalBonusStats: number;
  statLevels: Record<StatKey, { level: number; xp: number; xpToNext: number; pct: number }>;
  // Activity
  totalRaces: number;
  totalWins: number;
  totalBattles: number;
  totalBattleWins: number;
}

export function getProgressionSummary(progression: CharacterProgression): ProgressionSummary {
  const keys: StatKey[] = ["speed", "toughness", "charisma", "luck", "stamina", "agility"];
  let totalBonusStats = 0;
  const statLevels = {} as Record<StatKey, { level: number; xp: number; xpToNext: number; pct: number }>;

  for (const key of keys) {
    const sp = progression.statProgress[key];
    totalBonusStats += sp.level;
    const xpToNext = sp.level >= MAX_PROGRESSION_BONUS ? 0 : xpForStatLevel(sp.level + 1);
    const pct = xpToNext > 0 ? (sp.xp / xpToNext) * 100 : 100;
    statLevels[key] = { level: sp.level, xp: sp.xp, xpToNext, pct };
  }

  const isMaxLevel = progression.level >= MAX_NFT_LEVEL;
  const nftXpToNext = isMaxLevel ? 0 : xpForNftLevel(progression.level + 1);
  const nftXpPct = nftXpToNext > 0 ? (progression.xp / nftXpToNext) * 100 : 100;

  return {
    nftLevel: progression.level,
    nftXp: progression.xp,
    nftXpToNext,
    nftXpPct,
    isMaxLevel,
    totalBonusStats,
    statLevels,
    totalRaces: progression.totalRaces,
    totalWins: progression.totalWins,
    totalBattles: progression.totalBattles,
    totalBattleWins: progression.totalBattleWins,
  };
}
