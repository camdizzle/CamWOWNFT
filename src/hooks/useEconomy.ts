import { useState, useCallback } from "react";
import type { BuffInventoryItem } from "../engines/buffs";
import { BUFF_MAP } from "../engines/buffs";
import {
  evaluateAchievements,
  RACE_COIN_REWARDS,
  PARTICIPATION_COINS,
} from "../engines/achievements";
import type { PlayerStats, AchievementUnlock } from "../engines/achievements";

const STORAGE_KEY_COINS = "camwow_coins";
const STORAGE_KEY_INVENTORY = "camwow_buff_inventory";
const STORAGE_KEY_ACHIEVEMENTS = "camwow_achievements";
const STORAGE_KEY_STATS = "camwow_player_stats";

function loadJson<T>(key: string, fallback: T): T {
  const saved = localStorage.getItem(key);
  if (saved) {
    try { return JSON.parse(saved); } catch { return fallback; }
  }
  return fallback;
}

export interface UseEconomyResult {
  coins: number;
  inventory: BuffInventoryItem[];
  unlockedAchievements: string[];
  playerStats: PlayerStats;
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  buyBuff: (buffId: string) => { ok: boolean; reason?: string };
  consumeBuff: (buffId: string) => boolean;
  processRaceReward: (placement: number) => {
    coinsEarned: number;
    newAchievements: AchievementUnlock[];
  };
  updateMyStatsData: (data: {
    raceCount: number;
    streamersPlayed: string[];
    pointsEarned: number;
  }) => AchievementUnlock[];
  checkAchievements: () => AchievementUnlock[];
  getBuffCount: (buffId: string) => number;
  incrementStat: (key: keyof PlayerStats, value?: number) => void;
}

export function useEconomy(): UseEconomyResult {
  const [coins, setCoins] = useState<number>(() => loadJson(STORAGE_KEY_COINS, 0));
  const [inventory, setInventory] = useState<BuffInventoryItem[]>(() =>
    loadJson(STORAGE_KEY_INVENTORY, [])
  );
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>(() =>
    loadJson(STORAGE_KEY_ACHIEVEMENTS, [])
  );
  const [playerStats, setPlayerStats] = useState<PlayerStats>(() =>
    loadJson(STORAGE_KEY_STATS, {
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
    })
  );

  // ── Persistence helpers ────────────────────────────────────────────

  function saveCoins(val: number) {
    localStorage.setItem(STORAGE_KEY_COINS, JSON.stringify(val));
  }
  function saveInventory(val: BuffInventoryItem[]) {
    localStorage.setItem(STORAGE_KEY_INVENTORY, JSON.stringify(val));
  }
  function saveAchievements(val: string[]) {
    localStorage.setItem(STORAGE_KEY_ACHIEVEMENTS, JSON.stringify(val));
  }
  function saveStats(val: PlayerStats) {
    localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(val));
  }

  // ── Coins ──────────────────────────────────────────────────────────

  const addCoins = useCallback((amount: number) => {
    setCoins((prev) => {
      const next = prev + amount;
      saveCoins(next);
      return next;
    });
  }, []);

  const spendCoins = useCallback((amount: number): boolean => {
    let success = false;
    setCoins((prev) => {
      if (prev >= amount) {
        const next = prev - amount;
        saveCoins(next);
        success = true;
        return next;
      }
      return prev;
    });
    return success;
  }, []);

  // ── Buff Shop ──────────────────────────────────────────────────────

  const buyBuff = useCallback((buffId: string): { ok: boolean; reason?: string } => {
    const def = BUFF_MAP.get(buffId);
    if (!def) return { ok: false, reason: "Unknown buff." };

    let purchaseOk = false;
    setCoins((prevCoins) => {
      if (prevCoins < def.cost) return prevCoins;
      purchaseOk = true;
      const next = prevCoins - def.cost;
      saveCoins(next);
      return next;
    });

    if (!purchaseOk) return { ok: false, reason: `Not enough coins (need ${def.cost}).` };

    setInventory((prev) => {
      const existing = prev.find((i) => i.buffId === buffId);
      let next: BuffInventoryItem[];
      if (existing) {
        next = prev.map((i) =>
          i.buffId === buffId ? { ...i, quantity: i.quantity + 1 } : i
        );
      } else {
        next = [...prev, { buffId, quantity: 1 }];
      }
      saveInventory(next);
      return next;
    });

    return { ok: true };
  }, []);

  const consumeBuff = useCallback((buffId: string): boolean => {
    let consumed = false;
    setInventory((prev) => {
      const existing = prev.find((i) => i.buffId === buffId);
      if (!existing || existing.quantity <= 0) return prev;
      consumed = true;
      const next = prev
        .map((i) =>
          i.buffId === buffId ? { ...i, quantity: i.quantity - 1 } : i
        )
        .filter((i) => i.quantity > 0);
      saveInventory(next);
      return next;
    });
    return consumed;
  }, []);

  const getBuffCount = useCallback(
    (buffId: string): number => {
      return inventory.find((i) => i.buffId === buffId)?.quantity ?? 0;
    },
    [inventory]
  );

  // ── Race Rewards ───────────────────────────────────────────────────

  const processRaceReward = useCallback(
    (placement: number) => {
      const placeCoins = RACE_COIN_REWARDS[placement] ?? 0;
      const totalEarned = placeCoins + PARTICIPATION_COINS;

      // Add coins
      setCoins((prev) => {
        const next = prev + totalEarned;
        saveCoins(next);
        return next;
      });

      // Update stats
      const newStats = { ...playerStats };
      newStats.totalRaces += 1;
      newStats.racesThisWeek += 1;
      newStats.racesThisSeason += 1;
      newStats.totalCoinsEarned += totalEarned;

      if (placement === 1) {
        newStats.totalWins += 1;
        newStats.currentWinStreak += 1;
        if (newStats.currentWinStreak > newStats.longestWinStreak) {
          newStats.longestWinStreak = newStats.currentWinStreak;
        }
      } else {
        newStats.currentWinStreak = 0;
      }

      if (placement === 2) newStats.totalSecondPlace += 1;
      if (placement === 3) newStats.totalThirdPlace += 1;
      if (placement <= 3) newStats.totalTopThree += 1;

      setPlayerStats(newStats);
      saveStats(newStats);

      // Check achievements
      const unlocked = new Set(unlockedAchievements);
      const results = evaluateAchievements(newStats, unlocked);
      const newUnlocks = results.filter((r) => r.isNew);

      if (newUnlocks.length > 0) {
        const newIds = [...unlockedAchievements, ...newUnlocks.map((u) => u.achievement.id)];
        setUnlockedAchievements(newIds);
        saveAchievements(newIds);

        // Award achievement coins
        const achCoins = newUnlocks.reduce((sum, u) => sum + u.achievement.coinReward, 0);
        if (achCoins > 0) {
          setCoins((prev) => {
            const next = prev + achCoins;
            saveCoins(next);
            return next;
          });
        }
      }

      return { coinsEarned: totalEarned, newAchievements: newUnlocks };
    },
    [playerStats, unlockedAchievements]
  );

  // ── MyStats Data Sync ──────────────────────────────────────────────

  const updateMyStatsData = useCallback(
    (data: { raceCount: number; streamersPlayed: string[]; pointsEarned: number }) => {
      const newStats = { ...playerStats };
      newStats.mystatsRaceCount = data.raceCount;
      newStats.mystatsStreamersPlayed = data.streamersPlayed;
      newStats.mystatsPointsEarned = data.pointsEarned;

      setPlayerStats(newStats);
      saveStats(newStats);

      // Re-check achievements with updated MyStats data
      const unlocked = new Set(unlockedAchievements);
      const results = evaluateAchievements(newStats, unlocked);
      const newUnlocks = results.filter((r) => r.isNew);

      if (newUnlocks.length > 0) {
        const newIds = [...unlockedAchievements, ...newUnlocks.map((u) => u.achievement.id)];
        setUnlockedAchievements(newIds);
        saveAchievements(newIds);

        const achCoins = newUnlocks.reduce((sum, u) => sum + u.achievement.coinReward, 0);
        if (achCoins > 0) {
          setCoins((prev) => {
            const next = prev + achCoins;
            saveCoins(next);
            return next;
          });
        }
      }

      return newUnlocks;
    },
    [playerStats, unlockedAchievements]
  );

  // ── General achievement check ──────────────────────────────────────

  const checkAchievements = useCallback(() => {
    const unlocked = new Set(unlockedAchievements);
    return evaluateAchievements(playerStats, unlocked);
  }, [playerStats, unlockedAchievements]);

  // ── Increment a stat directly ──────────────────────────────────────

  const incrementStat = useCallback(
    (key: keyof PlayerStats, value: number = 1) => {
      const newStats = { ...playerStats };
      const current = newStats[key];
      if (typeof current === "number") {
        (newStats[key] as number) = current + value;
      }
      setPlayerStats(newStats);
      saveStats(newStats);
    },
    [playerStats]
  );

  return {
    coins,
    inventory,
    unlockedAchievements,
    playerStats,
    addCoins,
    spendCoins,
    buyBuff,
    consumeBuff,
    processRaceReward,
    updateMyStatsData,
    checkAchievements,
    getBuffCount,
    incrementStat,
  };
}
