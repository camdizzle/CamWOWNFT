// ── Achievement System ─────────────────────────────────────────────────
// Achievements reward coins based on MyStats race participation data.
// MyStats tracks race data per user — we query it and evaluate locally.

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  coinReward: number;
  category: "streamer" | "race" | "placement" | "milestone" | "streak";
  check: (stats: PlayerStats) => boolean;
}

// ── Stats aggregated from MyStats + local race data ────────────────────

export interface PlayerStats {
  // From MyStats database
  mystatsRaceCount: number;
  mystatsStreamersPlayed: string[]; // unique streamer IDs
  mystatsPointsEarned: number;

  // From local race data
  totalRaces: number;
  totalWins: number;
  totalSecondPlace: number;
  totalThirdPlace: number;
  totalTopThree: number;
  totalCoinsEarned: number;
  currentWinStreak: number;
  longestWinStreak: number;
  racesThisWeek: number;
  racesThisSeason: number;
  uniqueNftsRaced: number;
  buffsUsed: number;
}

// ── Coin Rewards from Racing ───────────────────────────────────────────
// Economy: ~15 coins per race avg, common buff costs 30-40 coins
// So you can afford a common buff every 2-3 races

export const RACE_COIN_REWARDS: Record<number, number> = {
  1: 25,  // 1st place
  2: 15,  // 2nd place
  3: 10,  // 3rd place
  4: 6,
  5: 4,
  6: 3,
  7: 2,
  8: 2,
};

// Participation reward for everyone who races
export const PARTICIPATION_COINS = 2;

// ── Achievement Definitions ────────────────────────────────────────────

export const ACHIEVEMENTS: Achievement[] = [
  // ─── Streamer Participation ───────────────────────────────────────
  {
    id: "streamer_rookie",
    name: "Stream Hopper",
    description: "Race in 1 MyStats streamer's lobby.",
    icon: "📺",
    coinReward: 25,
    category: "streamer",
    check: (s) => s.mystatsStreamersPlayed.length >= 1,
  },
  {
    id: "streamer_explorer",
    name: "Channel Surfer",
    description: "Race in 3 different MyStats streamers' lobbies.",
    icon: "🏄",
    coinReward: 75,
    category: "streamer",
    check: (s) => s.mystatsStreamersPlayed.length >= 3,
  },
  {
    id: "streamer_veteran",
    name: "Community Builder",
    description: "Race in 5 different MyStats streamers' lobbies.",
    icon: "🌐",
    coinReward: 150,
    category: "streamer",
    check: (s) => s.mystatsStreamersPlayed.length >= 5,
  },
  {
    id: "streamer_legend",
    name: "Stream Legend",
    description: "Race in 10 different MyStats streamers' lobbies.",
    icon: "👑",
    coinReward: 400,
    category: "streamer",
    check: (s) => s.mystatsStreamersPlayed.length >= 10,
  },
  {
    id: "streamer_globetrotter",
    name: "Globetrotter",
    description: "Race in 20 different MyStats streamers' lobbies.",
    icon: "🌍",
    coinReward: 1000,
    category: "streamer",
    check: (s) => s.mystatsStreamersPlayed.length >= 20,
  },

  // ─── Race Count ───────────────────────────────────────────────────
  {
    id: "race_first",
    name: "First Lap",
    description: "Complete your first race.",
    icon: "🏁",
    coinReward: 10,
    category: "race",
    check: (s) => s.totalRaces >= 1,
  },
  {
    id: "race_10",
    name: "Getting Warmed Up",
    description: "Complete 10 races.",
    icon: "🔟",
    coinReward: 50,
    category: "race",
    check: (s) => s.totalRaces >= 10,
  },
  {
    id: "race_25",
    name: "Quarter Century",
    description: "Complete 25 races.",
    icon: "🏎️",
    coinReward: 100,
    category: "race",
    check: (s) => s.totalRaces >= 25,
  },
  {
    id: "race_50",
    name: "Half Century",
    description: "Complete 50 races.",
    icon: "🏅",
    coinReward: 200,
    category: "race",
    check: (s) => s.totalRaces >= 50,
  },
  {
    id: "race_100",
    name: "Century Racer",
    description: "Complete 100 races.",
    icon: "💯",
    coinReward: 500,
    category: "race",
    check: (s) => s.totalRaces >= 100,
  },
  {
    id: "race_250",
    name: "Track Veteran",
    description: "Complete 250 races.",
    icon: "🎖️",
    coinReward: 1000,
    category: "race",
    check: (s) => s.totalRaces >= 250,
  },
  {
    id: "race_500",
    name: "Iron Marble",
    description: "Complete 500 races.",
    icon: "⚙️",
    coinReward: 2000,
    category: "race",
    check: (s) => s.totalRaces >= 500,
  },

  // ─── Wins ─────────────────────────────────────────────────────────
  {
    id: "win_first",
    name: "First Victory",
    description: "Win your first race.",
    icon: "🥇",
    coinReward: 25,
    category: "placement",
    check: (s) => s.totalWins >= 1,
  },
  {
    id: "win_5",
    name: "Five-Timer",
    description: "Win 5 races.",
    icon: "✋",
    coinReward: 75,
    category: "placement",
    check: (s) => s.totalWins >= 5,
  },
  {
    id: "win_10",
    name: "Double Digits",
    description: "Win 10 races.",
    icon: "🔥",
    coinReward: 150,
    category: "placement",
    check: (s) => s.totalWins >= 10,
  },
  {
    id: "win_25",
    name: "Champion",
    description: "Win 25 races.",
    icon: "🏆",
    coinReward: 300,
    category: "placement",
    check: (s) => s.totalWins >= 25,
  },
  {
    id: "win_50",
    name: "Dominant Force",
    description: "Win 50 races.",
    icon: "💎",
    coinReward: 750,
    category: "placement",
    check: (s) => s.totalWins >= 50,
  },
  {
    id: "win_100",
    name: "GOAT",
    description: "Win 100 races.",
    icon: "🐐",
    coinReward: 2000,
    category: "placement",
    check: (s) => s.totalWins >= 100,
  },

  // ─── Second Place / Bridesmaid ────────────────────────────────────
  {
    id: "silver_3",
    name: "Always the Bridesmaid",
    description: "Finish 2nd place 3 times.",
    icon: "🥈",
    coinReward: 30,
    category: "placement",
    check: (s) => s.totalSecondPlace >= 3,
  },
  {
    id: "silver_10",
    name: "The Silver Collector",
    description: "Finish 2nd place 10 times.",
    icon: "🪞",
    coinReward: 100,
    category: "placement",
    check: (s) => s.totalSecondPlace >= 10,
  },
  {
    id: "silver_25",
    name: "Forever Second",
    description: "Finish 2nd place 25 times. So close, so many times.",
    icon: "😤",
    coinReward: 250,
    category: "placement",
    check: (s) => s.totalSecondPlace >= 25,
  },
  {
    id: "silver_50",
    name: "Professional Bridesmaid",
    description: "Finish 2nd place 50 times. It's a lifestyle at this point.",
    icon: "💍",
    coinReward: 600,
    category: "placement",
    check: (s) => s.totalSecondPlace >= 50,
  },

  // ─── Podium ───────────────────────────────────────────────────────
  {
    id: "podium_10",
    name: "Podium Regular",
    description: "Finish top 3 in 10 races.",
    icon: "🎯",
    coinReward: 100,
    category: "placement",
    check: (s) => s.totalTopThree >= 10,
  },
  {
    id: "podium_50",
    name: "Podium Master",
    description: "Finish top 3 in 50 races.",
    icon: "🏛️",
    coinReward: 500,
    category: "placement",
    check: (s) => s.totalTopThree >= 50,
  },

  // ─── Streaks ──────────────────────────────────────────────────────
  {
    id: "streak_3",
    name: "Hot Streak",
    description: "Win 3 races in a row.",
    icon: "🔥",
    coinReward: 100,
    category: "streak",
    check: (s) => s.longestWinStreak >= 3,
  },
  {
    id: "streak_5",
    name: "On Fire",
    description: "Win 5 races in a row.",
    icon: "☄️",
    coinReward: 300,
    category: "streak",
    check: (s) => s.longestWinStreak >= 5,
  },
  {
    id: "streak_10",
    name: "Unstoppable",
    description: "Win 10 races in a row.",
    icon: "⚡",
    coinReward: 1000,
    category: "streak",
    check: (s) => s.longestWinStreak >= 10,
  },

  // ─── Milestones ───────────────────────────────────────────────────
  {
    id: "multi_nft_3",
    name: "Stable Owner",
    description: "Race with 3 different NFTs.",
    icon: "🐴",
    coinReward: 50,
    category: "milestone",
    check: (s) => s.uniqueNftsRaced >= 3,
  },
  {
    id: "buff_first",
    name: "Power Up",
    description: "Use your first race buff.",
    icon: "⬆️",
    coinReward: 15,
    category: "milestone",
    check: (s) => s.buffsUsed >= 1,
  },
  {
    id: "buff_10",
    name: "Buff Junkie",
    description: "Use 10 race buffs.",
    icon: "💊",
    coinReward: 75,
    category: "milestone",
    check: (s) => s.buffsUsed >= 10,
  },
  {
    id: "weekly_5",
    name: "Dedicated Racer",
    description: "Race 5 times in one week.",
    icon: "📅",
    coinReward: 40,
    category: "milestone",
    check: (s) => s.racesThisWeek >= 5,
  },
  {
    id: "weekly_10",
    name: "Track Addict",
    description: "Race 10 times in one week.",
    icon: "🗓️",
    coinReward: 100,
    category: "milestone",
    check: (s) => s.racesThisWeek >= 10,
  },
  {
    id: "mystats_points_100",
    name: "Point Collector",
    description: "Earn 100 points across MyStats races.",
    icon: "📊",
    coinReward: 30,
    category: "milestone",
    check: (s) => s.mystatsPointsEarned >= 100,
  },
  {
    id: "mystats_points_500",
    name: "Point Hoarder",
    description: "Earn 500 points across MyStats races.",
    icon: "📈",
    coinReward: 100,
    category: "milestone",
    check: (s) => s.mystatsPointsEarned >= 500,
  },
  {
    id: "mystats_points_2000",
    name: "Point Machine",
    description: "Earn 2,000 points across MyStats races.",
    icon: "🏧",
    coinReward: 400,
    category: "milestone",
    check: (s) => s.mystatsPointsEarned >= 2000,
  },
  {
    id: "mystats_races_50",
    name: "MyStats Veteran",
    description: "Race 50 times in MyStats streams.",
    icon: "🎬",
    coinReward: 200,
    category: "milestone",
    check: (s) => s.mystatsRaceCount >= 50,
  },
];

// ── Evaluate achievements ──────────────────────────────────────────────

export interface AchievementUnlock {
  achievement: Achievement;
  isNew: boolean;
}

export function evaluateAchievements(
  stats: PlayerStats,
  alreadyUnlocked: Set<string>
): AchievementUnlock[] {
  const results: AchievementUnlock[] = [];

  for (const ach of ACHIEVEMENTS) {
    const earned = ach.check(stats);
    if (earned) {
      results.push({
        achievement: ach,
        isNew: !alreadyUnlocked.has(ach.id),
      });
    }
  }

  return results;
}

// ── Create empty stats ─────────────────────────────────────────────────

export function createEmptyPlayerStats(): PlayerStats {
  return {
    mystatsRaceCount: 0,
    mystatsStreamersPlayed: [],
    mystatsPointsEarned: 0,
    totalRaces: 0,
    totalWins: 0,
    totalSecondPlace: 0,
    totalThirdPlace: 0,
    totalTopThree: 0,
    totalCoinsEarned: 0,
    currentWinStreak: 0,
    longestWinStreak: 0,
    racesThisWeek: 0,
    racesThisSeason: 0,
    uniqueNftsRaced: 0,
    buffsUsed: 0,
  };
}
