// ── Season Prize Pool Engine ───────────────────────────────────────────
// Tracks the cumulative PBP prize pool from premium race entry fees.
// 35% of each premium race's total entry fees go to the season pool.
// At end of season, pool is distributed as PBP token prizes.

import { PREMIUM_PRIZE_SPLIT, TREASURY_WALLET } from "../types/nft";
import type { SeasonPrizePool } from "../types/nft";

const CACHE_KEY = "camwow_season_pool";

function loadPool(): SeasonPrizePool {
  const saved = localStorage.getItem(CACHE_KEY);
  if (saved) {
    try { return JSON.parse(saved); } catch { /* fall through */ }
  }
  return { seasonId: "season-1", totalPBP: 0, totalRaces: 0 };
}

function savePool(pool: SeasonPrizePool) {
  localStorage.setItem(CACHE_KEY, JSON.stringify(pool));
}

// Add the treasury portion of a premium race's entry fees to the season pool
export function addToSeasonPool(totalEntryFees: number): SeasonPrizePool {
  const pool = loadPool();
  const treasuryShare = Math.floor(totalEntryFees * PREMIUM_PRIZE_SPLIT.treasury);
  pool.totalPBP += treasuryShare;
  pool.totalRaces += 1;
  savePool(pool);
  return pool;
}

// Get current season pool state
export function getSeasonPool(): SeasonPrizePool {
  return loadPool();
}

// Reset pool (called at season end after distribution)
export function resetSeasonPool(newSeasonId: string): SeasonPrizePool {
  const pool: SeasonPrizePool = { seasonId: newSeasonId, totalPBP: 0, totalRaces: 0 };
  savePool(pool);
  return pool;
}

// Calculate prize distribution for a single premium race
export function calculateRacePrizes(totalPool: number): {
  first: number;
  second: number;
  third: number;
  treasury: number;
} {
  return {
    first: Math.floor(totalPool * PREMIUM_PRIZE_SPLIT.first),
    second: Math.floor(totalPool * PREMIUM_PRIZE_SPLIT.second),
    third: Math.floor(totalPool * PREMIUM_PRIZE_SPLIT.third),
    treasury: Math.floor(totalPool * PREMIUM_PRIZE_SPLIT.treasury),
  };
}

export { TREASURY_WALLET };
