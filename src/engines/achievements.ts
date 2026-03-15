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
    id: "streamer_1",
    name: "Stream Hopper",
    description: "Race in 1 MyStats streamer's lobby.",
    icon: "📺",
    coinReward: 10,
    category: "streamer",
    check: (s) => s.mystatsStreamersPlayed.length >= 1,
  },
  {
    id: "streamer_10",
    name: "Channel Surfer",
    description: "Race in 10 different MyStats streamers' lobbies.",
    icon: "🏄",
    coinReward: 50,
    category: "streamer",
    check: (s) => s.mystatsStreamersPlayed.length >= 10,
  },
  {
    id: "streamer_25",
    name: "Community Builder",
    description: "Race in 25 different MyStats streamers' lobbies.",
    icon: "🌐",
    coinReward: 150,
    category: "streamer",
    check: (s) => s.mystatsStreamersPlayed.length >= 25,
  },
  {
    id: "streamer_50",
    name: "Stream Legend",
    description: "Race in 50 different MyStats streamers' lobbies.",
    icon: "👑",
    coinReward: 400,
    category: "streamer",
    check: (s) => s.mystatsStreamersPlayed.length >= 50,
  },
  {
    id: "streamer_100",
    name: "Globetrotter",
    description: "Race in 100 different MyStats streamers' lobbies.",
    icon: "🌍",
    coinReward: 1000,
    category: "streamer",
    check: (s) => s.mystatsStreamersPlayed.length >= 100,
  },

  // ─── Race Count (any MyStats stream) ──────────────────────────────
  {
    id: "race_1",
    name: "First Lap",
    description: "Complete your first race in any MyStats stream.",
    icon: "🏁",
    coinReward: 10,
    category: "race",
    check: (s) => s.totalRaces >= 1,
  },
  {
    id: "race_50",
    name: "Getting Warmed Up",
    description: "Complete 50 races.",
    icon: "🏎️",
    coinReward: 50,
    category: "race",
    check: (s) => s.totalRaces >= 50,
  },
  {
    id: "race_100",
    name: "Century Racer",
    description: "Complete 100 races.",
    icon: "💯",
    coinReward: 150,
    category: "race",
    check: (s) => s.totalRaces >= 100,
  },
  {
    id: "race_250",
    name: "Quarter Thousand",
    description: "Complete 250 races.",
    icon: "🏅",
    coinReward: 300,
    category: "race",
    check: (s) => s.totalRaces >= 250,
  },
  {
    id: "race_500",
    name: "Half Grand",
    description: "Complete 500 races.",
    icon: "🎖️",
    coinReward: 750,
    category: "race",
    check: (s) => s.totalRaces >= 500,
  },
  {
    id: "race_1000",
    name: "Iron Marble",
    description: "Complete 1,000 races.",
    icon: "⚙️",
    coinReward: 2000,
    category: "race",
    check: (s) => s.totalRaces >= 1000,
  },
  {
    id: "race_10000",
    name: "Track Legend",
    description: "Complete 10,000 races.",
    icon: "🌟",
    coinReward: 10000,
    category: "race",
    check: (s) => s.totalRaces >= 10000,
  },

  // ─── Wins ─────────────────────────────────────────────────────────
  {
    id: "win_1",
    name: "First Victory",
    description: "Win your first race.",
    icon: "🥇",
    coinReward: 25,
    category: "placement",
    check: (s) => s.totalWins >= 1,
  },
  {
    id: "win_10",
    name: "Double Digits",
    description: "Win 10 races.",
    icon: "🔥",
    coinReward: 75,
    category: "placement",
    check: (s) => s.totalWins >= 10,
  },
  {
    id: "win_50",
    name: "Champion",
    description: "Win 50 races.",
    icon: "🏆",
    coinReward: 300,
    category: "placement",
    check: (s) => s.totalWins >= 50,
  },
  {
    id: "win_100",
    name: "Dominant Force",
    description: "Win 100 races.",
    icon: "💎",
    coinReward: 750,
    category: "placement",
    check: (s) => s.totalWins >= 100,
  },
  {
    id: "win_250",
    name: "Elite Racer",
    description: "Win 250 races.",
    icon: "⭐",
    coinReward: 1500,
    category: "placement",
    check: (s) => s.totalWins >= 250,
  },
  {
    id: "win_500",
    name: "Marble Master",
    description: "Win 500 races.",
    icon: "💫",
    coinReward: 3000,
    category: "placement",
    check: (s) => s.totalWins >= 500,
  },
  {
    id: "win_1000",
    name: "GOAT",
    description: "Win 1,000 races.",
    icon: "🐐",
    coinReward: 10000,
    category: "placement",
    check: (s) => s.totalWins >= 1000,
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
    coinReward: 50,
    category: "placement",
    check: (s) => s.totalTopThree >= 10,
  },
  {
    id: "podium_50",
    name: "Podium Master",
    description: "Finish top 3 in 50 races.",
    icon: "🏛️",
    coinReward: 200,
    category: "placement",
    check: (s) => s.totalTopThree >= 50,
  },
  {
    id: "podium_100",
    name: "Podium King",
    description: "Finish top 3 in 100 races.",
    icon: "👑",
    coinReward: 500,
    category: "placement",
    check: (s) => s.totalTopThree >= 100,
  },
  {
    id: "podium_250",
    name: "Podium Legend",
    description: "Finish top 3 in 250 races.",
    icon: "🌟",
    coinReward: 1000,
    category: "placement",
    check: (s) => s.totalTopThree >= 250,
  },
  {
    id: "podium_500",
    name: "Podium God",
    description: "Finish top 3 in 500 races.",
    icon: "💫",
    coinReward: 2500,
    category: "placement",
    check: (s) => s.totalTopThree >= 500,
  },
  {
    id: "podium_1000",
    name: "Podium Immortal",
    description: "Finish top 3 in 1,000 races.",
    icon: "🐐",
    coinReward: 5000,
    category: "placement",
    check: (s) => s.totalTopThree >= 1000,
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
    id: "weekly_50",
    name: "Dedicated Racer",
    description: "Race 50 times in one week.",
    icon: "📅",
    coinReward: 200,
    category: "milestone",
    check: (s) => s.racesThisWeek >= 50,
  },
  {
    id: "weekly_100",
    name: "Track Addict",
    description: "Race 100 times in one week.",
    icon: "🗓️",
    coinReward: 500,
    category: "milestone",
    check: (s) => s.racesThisWeek >= 100,
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
    id: "mystats_points_10000",
    name: "Point Overlord",
    description: "Earn 10,000 points across MyStats races.",
    icon: "💰",
    coinReward: 2000,
    category: "milestone",
    check: (s) => s.mystatsPointsEarned >= 10000,
  },
  {
    id: "mystats_races_500",
    name: "MyStats Veteran",
    description: "Race 500 times in MyStats streams.",
    icon: "🎬",
    coinReward: 1000,
    category: "milestone",
    check: (s) => s.mystatsRaceCount >= 500,
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
