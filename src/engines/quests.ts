// ── Quest System ──────────────────────────────────────────────────────────
// Daily / Weekly / Milestone quests that reward coins for engagement.
// Daily quests reset every 24 h (midnight UTC), weekly quests every Monday.
// Milestone quests are one-time, with progressive tiers.

// ── Types ─────────────────────────────────────────────────────────────────

export type QuestFrequency = "daily" | "weekly" | "milestone";

export interface QuestDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  frequency: QuestFrequency;
  /** Stat key from PlayerStats (or special key) used to measure progress. */
  statKey: string;
  /** How many of that stat the player needs to advance *within the period*. */
  target: number;
  /** Coin reward on completion. */
  coinReward: number;
  /** For milestones only — tier label like "Bronze", "Silver", etc. */
  tier?: string;
  /** For milestones — the next quest id in the chain. */
  nextTierId?: string;
}

export interface QuestProgress {
  questId: string;
  progress: number; // current count within the period
  completed: boolean;
  claimed: boolean; // true once the player has claimed the coin reward
}

export interface QuestState {
  daily: QuestProgress[];
  weekly: QuestProgress[];
  milestone: QuestProgress[];
  dailyResetAt: number; // epoch ms — next daily reset
  weeklyResetAt: number; // epoch ms — next weekly reset
}

// ── Helpers ───────────────────────────────────────────────────────────────

/** Next midnight UTC from a given timestamp. */
export function nextMidnightUTC(now: number = Date.now()): number {
  const d = new Date(now);
  d.setUTCHours(24, 0, 0, 0);
  return d.getTime();
}

/** Next Monday 00:00 UTC from a given timestamp. */
export function nextMondayUTC(now: number = Date.now()): number {
  const d = new Date(now);
  const day = d.getUTCDay(); // 0=Sun … 6=Sat
  const daysUntilMonday = day === 0 ? 1 : 8 - day;
  d.setUTCDate(d.getUTCDate() + daysUntilMonday);
  d.setUTCHours(0, 0, 0, 0);
  return d.getTime();
}

// ── Quest Catalog ─────────────────────────────────────────────────────────

// --- Daily Quests (pick 3 each day) ---

export const DAILY_QUEST_POOL: QuestDefinition[] = [
  {
    id: "dq_race_3",
    name: "Daily Racer",
    description: "Enter 3 races today.",
    icon: "🏁",
    frequency: "daily",
    statKey: "totalRaces",
    target: 3,
    coinReward: 30,
  },
  {
    id: "dq_win_1",
    name: "Victory Lap",
    description: "Win a race today.",
    icon: "🏆",
    frequency: "daily",
    statKey: "totalWins",
    target: 1,
    coinReward: 40,
  },
  {
    id: "dq_top3_2",
    name: "Podium Regular",
    description: "Finish top 3 in 2 races today.",
    icon: "🥇",
    frequency: "daily",
    statKey: "totalTopThree",
    target: 2,
    coinReward: 35,
  },
  {
    id: "dq_use_buff",
    name: "Power Up",
    description: "Use a buff in a race.",
    icon: "⚡",
    frequency: "daily",
    statKey: "buffsUsed",
    target: 1,
    coinReward: 20,
  },
  {
    id: "dq_battle_1",
    name: "Arena Fighter",
    description: "Fight a battle today.",
    icon: "⚔️",
    frequency: "daily",
    statKey: "battlesPlayed",
    target: 1,
    coinReward: 25,
  },
  {
    id: "dq_race_5",
    name: "Marathon Runner",
    description: "Enter 5 races today.",
    icon: "🏃",
    frequency: "daily",
    statKey: "totalRaces",
    target: 5,
    coinReward: 50,
  },
  {
    id: "dq_win_battle",
    name: "Gladiator",
    description: "Win a battle today.",
    icon: "🗡️",
    frequency: "daily",
    statKey: "battlesWon",
    target: 1,
    coinReward: 35,
  },
];

// --- Weekly Quests (pick 2 each week) ---

export const WEEKLY_QUEST_POOL: QuestDefinition[] = [
  {
    id: "wq_race_15",
    name: "Weekly Warrior",
    description: "Enter 15 races this week.",
    icon: "📅",
    frequency: "weekly",
    statKey: "totalRaces",
    target: 15,
    coinReward: 150,
  },
  {
    id: "wq_win_5",
    name: "Dominant Force",
    description: "Win 5 races this week.",
    icon: "👑",
    frequency: "weekly",
    statKey: "totalWins",
    target: 5,
    coinReward: 200,
  },
  {
    id: "wq_top3_10",
    name: "Consistent Podium",
    description: "Finish top 3 in 10 races this week.",
    icon: "🎖️",
    frequency: "weekly",
    statKey: "totalTopThree",
    target: 10,
    coinReward: 175,
  },
  {
    id: "wq_buffs_5",
    name: "Power Hungry",
    description: "Use 5 buffs in races this week.",
    icon: "🔋",
    frequency: "weekly",
    statKey: "buffsUsed",
    target: 5,
    coinReward: 125,
  },
  {
    id: "wq_battles_3",
    name: "Battle Hardened",
    description: "Fight 3 battles this week.",
    icon: "🛡️",
    frequency: "weekly",
    statKey: "battlesPlayed",
    target: 3,
    coinReward: 130,
  },
  {
    id: "wq_earn_200",
    name: "Coin Collector",
    description: "Earn 200 coins from races this week.",
    icon: "💰",
    frequency: "weekly",
    statKey: "coinsEarnedThisPeriod",
    target: 200,
    coinReward: 100,
  },
];

// --- Milestone Quests (one-time, tiered) ---

export const MILESTONE_QUESTS: QuestDefinition[] = [
  // Race veteran chain
  {
    id: "mq_races_50",
    name: "Race Veteran I",
    description: "Complete 50 races total.",
    icon: "🏁",
    frequency: "milestone",
    statKey: "totalRaces",
    target: 50,
    coinReward: 200,
    tier: "Bronze",
    nextTierId: "mq_races_150",
  },
  {
    id: "mq_races_150",
    name: "Race Veteran II",
    description: "Complete 150 races total.",
    icon: "🏁",
    frequency: "milestone",
    statKey: "totalRaces",
    target: 150,
    coinReward: 500,
    tier: "Silver",
    nextTierId: "mq_races_500",
  },
  {
    id: "mq_races_500",
    name: "Race Veteran III",
    description: "Complete 500 races total.",
    icon: "🏁",
    frequency: "milestone",
    statKey: "totalRaces",
    target: 500,
    coinReward: 1500,
    tier: "Gold",
  },

  // Win chain
  {
    id: "mq_wins_10",
    name: "Champion I",
    description: "Win 10 races total.",
    icon: "🏆",
    frequency: "milestone",
    statKey: "totalWins",
    target: 10,
    coinReward: 150,
    tier: "Bronze",
    nextTierId: "mq_wins_50",
  },
  {
    id: "mq_wins_50",
    name: "Champion II",
    description: "Win 50 races total.",
    icon: "🏆",
    frequency: "milestone",
    statKey: "totalWins",
    target: 50,
    coinReward: 500,
    tier: "Silver",
    nextTierId: "mq_wins_200",
  },
  {
    id: "mq_wins_200",
    name: "Champion III",
    description: "Win 200 races total.",
    icon: "🏆",
    frequency: "milestone",
    statKey: "totalWins",
    target: 200,
    coinReward: 2000,
    tier: "Gold",
  },

  // Battle chain
  {
    id: "mq_battles_10",
    name: "Battle Master I",
    description: "Win 10 battles total.",
    icon: "⚔️",
    frequency: "milestone",
    statKey: "battlesWon",
    target: 10,
    coinReward: 150,
    tier: "Bronze",
    nextTierId: "mq_battles_50",
  },
  {
    id: "mq_battles_50",
    name: "Battle Master II",
    description: "Win 50 battles total.",
    icon: "⚔️",
    frequency: "milestone",
    statKey: "battlesWon",
    target: 50,
    coinReward: 500,
    tier: "Silver",
    nextTierId: "mq_battles_200",
  },
  {
    id: "mq_battles_200",
    name: "Battle Master III",
    description: "Win 200 battles total.",
    icon: "⚔️",
    frequency: "milestone",
    statKey: "battlesWon",
    target: 200,
    coinReward: 2000,
    tier: "Gold",
  },

  // Buff usage chain
  {
    id: "mq_buffs_25",
    name: "Power User I",
    description: "Use 25 buffs in races.",
    icon: "⚡",
    frequency: "milestone",
    statKey: "buffsUsed",
    target: 25,
    coinReward: 100,
    tier: "Bronze",
    nextTierId: "mq_buffs_100",
  },
  {
    id: "mq_buffs_100",
    name: "Power User II",
    description: "Use 100 buffs in races.",
    icon: "⚡",
    frequency: "milestone",
    statKey: "buffsUsed",
    target: 100,
    coinReward: 400,
    tier: "Silver",
    nextTierId: "mq_buffs_500",
  },
  {
    id: "mq_buffs_500",
    name: "Power User III",
    description: "Use 500 buffs in races.",
    icon: "⚡",
    frequency: "milestone",
    statKey: "buffsUsed",
    target: 500,
    coinReward: 1500,
    tier: "Gold",
  },

  // Coins earned chain
  {
    id: "mq_coins_1000",
    name: "Coin Hoarder I",
    description: "Earn 1,000 coins total.",
    icon: "💰",
    frequency: "milestone",
    statKey: "totalCoinsEarned",
    target: 1000,
    coinReward: 100,
    tier: "Bronze",
    nextTierId: "mq_coins_5000",
  },
  {
    id: "mq_coins_5000",
    name: "Coin Hoarder II",
    description: "Earn 5,000 coins total.",
    icon: "💰",
    frequency: "milestone",
    statKey: "totalCoinsEarned",
    target: 5000,
    coinReward: 500,
    tier: "Silver",
    nextTierId: "mq_coins_25000",
  },
  {
    id: "mq_coins_25000",
    name: "Coin Hoarder III",
    description: "Earn 25,000 coins total.",
    icon: "💰",
    frequency: "milestone",
    statKey: "totalCoinsEarned",
    target: 25000,
    coinReward: 2500,
    tier: "Gold",
  },

  // Win streak
  {
    id: "mq_streak_3",
    name: "Hot Streak I",
    description: "Achieve a 3-race win streak.",
    icon: "🔥",
    frequency: "milestone",
    statKey: "longestWinStreak",
    target: 3,
    coinReward: 100,
    tier: "Bronze",
    nextTierId: "mq_streak_7",
  },
  {
    id: "mq_streak_7",
    name: "Hot Streak II",
    description: "Achieve a 7-race win streak.",
    icon: "🔥",
    frequency: "milestone",
    statKey: "longestWinStreak",
    target: 7,
    coinReward: 500,
    tier: "Silver",
    nextTierId: "mq_streak_15",
  },
  {
    id: "mq_streak_15",
    name: "Hot Streak III",
    description: "Achieve a 15-race win streak.",
    icon: "🔥",
    frequency: "milestone",
    statKey: "longestWinStreak",
    target: 15,
    coinReward: 2000,
    tier: "Gold",
  },
];

// ── Quest Maps ────────────────────────────────────────────────────────────

export const DAILY_QUEST_MAP = new Map(DAILY_QUEST_POOL.map((q) => [q.id, q]));
export const WEEKLY_QUEST_MAP = new Map(WEEKLY_QUEST_POOL.map((q) => [q.id, q]));
export const MILESTONE_QUEST_MAP = new Map(MILESTONE_QUESTS.map((q) => [q.id, q]));
export const ALL_QUEST_MAP = new Map([
  ...DAILY_QUEST_MAP,
  ...WEEKLY_QUEST_MAP,
  ...MILESTONE_QUEST_MAP,
]);

// ── Daily / Weekly selection (seeded by date) ─────────────────────────────

/** Simple hash to pick deterministic quests for a given day string. */
function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/** Seeded shuffle — Fisher-Yates with a basic LCG. */
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const out = [...arr];
  let s = seed;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Get the 3 daily quests for a given date (YYYY-MM-DD string). */
export function getDailyQuests(dateStr?: string): QuestDefinition[] {
  const d = dateStr ?? new Date().toISOString().slice(0, 10);
  const seed = hashSeed(`daily-${d}`);
  return seededShuffle(DAILY_QUEST_POOL, seed).slice(0, 3);
}

/** Get the 2 weekly quests for a given ISO week key (e.g. "2026-W12"). */
export function getWeeklyQuests(weekKey?: string): QuestDefinition[] {
  const key = weekKey ?? getISOWeekKey();
  const seed = hashSeed(`weekly-${key}`);
  return seededShuffle(WEEKLY_QUEST_POOL, seed).slice(0, 2);
}

/** Returns ISO week key like "2026-W12". */
export function getISOWeekKey(now: Date = new Date()): string {
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

// ── Active milestone detection ────────────────────────────────────────────

/**
 * Returns the currently active milestone quests for a player.
 * For each chain, only the first uncompleted tier is active.
 */
export function getActiveMilestones(completedIds: Set<string>): QuestDefinition[] {
  // Group milestone chains by their root stat+icon combo
  const chains: QuestDefinition[][] = [];
  const visited = new Set<string>();

  for (const quest of MILESTONE_QUESTS) {
    if (visited.has(quest.id)) continue;

    // Walk the chain from this quest
    const chain: QuestDefinition[] = [];
    let current: QuestDefinition | undefined = quest;
    while (current) {
      chain.push(current);
      visited.add(current.id);
      current = current.nextTierId
        ? MILESTONE_QUEST_MAP.get(current.nextTierId)
        : undefined;
    }
    chains.push(chain);
  }

  // For each chain, find the first incomplete quest
  const active: QuestDefinition[] = [];
  for (const chain of chains) {
    for (const quest of chain) {
      if (!completedIds.has(quest.id)) {
        active.push(quest);
        break;
      }
    }
    // If all tiers done, chain is fully complete — nothing active
  }

  return active;
}

// ── Quest evaluation ──────────────────────────────────────────────────────

/**
 * Check quest progress against current period stats.
 * `periodStats` is a Record<string, number> with keys matching quest statKeys.
 * For daily/weekly: these are the stats accumulated *within the current period*.
 * For milestones: these are the all-time totals.
 */
export function evaluateQuest(
  quest: QuestDefinition,
  periodStats: Record<string, number>
): { progress: number; completed: boolean } {
  const value = periodStats[quest.statKey] ?? 0;
  const progress = Math.min(value, quest.target);
  return { progress, completed: progress >= quest.target };
}

// ── Empty state factory ───────────────────────────────────────────────────

export function createEmptyQuestState(): QuestState {
  const now = Date.now();
  const dailyQuests = getDailyQuests();
  const weeklyQuests = getWeeklyQuests();

  return {
    daily: dailyQuests.map((q) => ({
      questId: q.id,
      progress: 0,
      completed: false,
      claimed: false,
    })),
    weekly: weeklyQuests.map((q) => ({
      questId: q.id,
      progress: 0,
      completed: false,
      claimed: false,
    })),
    milestone: [], // populated when milestones are checked
    dailyResetAt: nextMidnightUTC(now),
    weeklyResetAt: nextMondayUTC(now),
  };
}

/** How many daily/weekly quests to show. */
export const DAILY_QUEST_COUNT = 3;
export const WEEKLY_QUEST_COUNT = 2;
