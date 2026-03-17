import { useState, useCallback } from "react";
import type { BuffInventoryItem } from "../engines/buffs";
import { BUFF_MAP } from "../engines/buffs";
import {
  evaluateAchievements,
  RACE_COIN_REWARDS,
  PARTICIPATION_COINS,
} from "../engines/achievements";
import type { PlayerStats, AchievementUnlock } from "../engines/achievements";
import { economyApi } from "../api/client";

// ── Local cache keys ───────────────────────────────────────────────────

const CACHE_COINS = "camwow_coins";
const CACHE_INVENTORY = "camwow_buff_inventory";
const CACHE_ACHIEVEMENTS = "camwow_achievements";
const CACHE_STATS = "camwow_player_stats";

function loadCache<T>(key: string, fallback: T): T {
  const saved = localStorage.getItem(key);
  if (saved) {
    try { return JSON.parse(saved); } catch { return fallback; }
  }
  return fallback;
}

function saveCache(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

const EMPTY_STATS: PlayerStats = {
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

// ── Hook ───────────────────────────────────────────────────────────────

export interface UseEconomyResult {
  coins: number;
  inventory: BuffInventoryItem[];
  unlockedAchievements: string[];
  playerStats: PlayerStats;
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  buyBuff: (buffId: string) => { ok: boolean; reason?: string };
  buyBuffWithPbp: (buffId: string, pbpPrice: number) => { ok: boolean; reason?: string };
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
  loadFromServer: (userId: string) => Promise<void>;
}

export function useEconomy(): UseEconomyResult {
  const [coins, setCoins] = useState<number>(() => loadCache(CACHE_COINS, 0));
  const [inventory, setInventory] = useState<BuffInventoryItem[]>(() =>
    loadCache(CACHE_INVENTORY, [])
  );
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>(() =>
    loadCache(CACHE_ACHIEVEMENTS, [])
  );
  const [playerStats, setPlayerStats] = useState<PlayerStats>(() =>
    loadCache(CACHE_STATS, { ...EMPTY_STATS })
  );

  // Track current user ID for API calls
  const [userId, setUserId] = useState<string | null>(null);

  // ── Load from server ─────────────────────────────────────────────

  const loadFromServer = useCallback(async (uid: string) => {
    setUserId(uid);
    try {
      const data = await economyApi.get(uid);
      const serverCoins = data.coins ?? 0;
      const serverInventory: BuffInventoryItem[] = (data.inventory ?? []).map(
        (r: any) => ({ buffId: r.buff_id ?? r.buffId, quantity: r.quantity })
      );
      const serverAchievements: string[] = data.achievements ?? [];
      const serverStats: PlayerStats = data.playerStats ?? { ...EMPTY_STATS };

      setCoins(serverCoins);
      setInventory(serverInventory);
      setUnlockedAchievements(serverAchievements);
      setPlayerStats(serverStats);

      saveCache(CACHE_COINS, serverCoins);
      saveCache(CACHE_INVENTORY, serverInventory);
      saveCache(CACHE_ACHIEVEMENTS, serverAchievements);
      saveCache(CACHE_STATS, serverStats);
    } catch {
      // Server unreachable — use cached data
    }
  }, []);

  // ── Coins ────────────────────────────────────────────────────────

  const addCoins = useCallback((amount: number) => {
    setCoins((prev) => {
      const next = prev + amount;
      saveCache(CACHE_COINS, next);
      return next;
    });
    // Fire-and-forget server sync
    if (userId) {
      economyApi.addCoins(userId, amount).catch(() => {});
    }
  }, [userId]);

  const spendCoins = useCallback((amount: number): boolean => {
    let success = false;
    setCoins((prev) => {
      if (prev >= amount) {
        const next = prev - amount;
        saveCache(CACHE_COINS, next);
        success = true;
        return next;
      }
      return prev;
    });
    return success;
  }, []);

  // ── Buff Shop (Coins) ─────────────────────────────────────────────

  const buyBuff = useCallback((buffId: string): { ok: boolean; reason?: string } => {
    const def = BUFF_MAP.get(buffId);
    if (!def) return { ok: false, reason: "Unknown buff." };
    if (def.premiumOnly) return { ok: false, reason: "This buff can only be purchased with PBP." };

    let purchaseOk = false;
    setCoins((prevCoins) => {
      if (prevCoins < def.cost) return prevCoins;
      purchaseOk = true;
      const next = prevCoins - def.cost;
      saveCache(CACHE_COINS, next);
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
      saveCache(CACHE_INVENTORY, next);
      return next;
    });

    // Server sync
    if (userId) {
      economyApi.buyBuff(userId, buffId, def.cost).catch(() => {});
    }

    return { ok: true };
  }, [userId]);

  // ── Buff Shop (PBP Token) ──────────────────────────────────────────

  const buyBuffWithPbp = useCallback((buffId: string, pbpPrice: number): { ok: boolean; reason?: string } => {
    const def = BUFF_MAP.get(buffId);
    if (!def) return { ok: false, reason: "Unknown buff." };
    if (def.pbpPrice <= 0) return { ok: false, reason: "This buff cannot be purchased with PBP." };

    // In production, this would trigger a PBP token transfer:
    // 1. Create SPL transfer instruction to TREASURY_WALLET
    // 2. User signs with their connected wallet (Phantom, etc.)
    // 3. On confirmation, server validates the tx and credits the buff
    //
    // For now, we optimistically add to inventory and sync with server.
    // The server endpoint will verify the transaction signature.

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
      saveCache(CACHE_INVENTORY, next);
      return next;
    });

    // Server sync — passes PBP transaction details
    if (userId) {
      economyApi.buyBuffWithPbp(userId, buffId, pbpPrice).catch(() => {});
    }

    return { ok: true };
  }, [userId]);

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
      saveCache(CACHE_INVENTORY, next);
      return next;
    });

    if (consumed && userId) {
      economyApi.consumeBuff(userId, buffId).catch(() => {});
    }

    return consumed;
  }, [userId]);

  const getBuffCount = useCallback(
    (buffId: string): number => {
      return inventory.find((i) => i.buffId === buffId)?.quantity ?? 0;
    },
    [inventory]
  );

  // ── Race Rewards ─────────────────────────────────────────────────

  const processRaceReward = useCallback(
    (placement: number) => {
      const placeCoins = RACE_COIN_REWARDS[placement] ?? 0;
      const totalEarned = placeCoins + PARTICIPATION_COINS;

      // Update coins
      setCoins((prev) => {
        const next = prev + totalEarned;
        saveCache(CACHE_COINS, next);
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
      saveCache(CACHE_STATS, newStats);

      // Check achievements
      const unlocked = new Set(unlockedAchievements);
      const results = evaluateAchievements(newStats, unlocked);
      const newUnlocks = results.filter((r) => r.isNew);

      if (newUnlocks.length > 0) {
        const newIds = [...unlockedAchievements, ...newUnlocks.map((u) => u.achievement.id)];
        setUnlockedAchievements(newIds);
        saveCache(CACHE_ACHIEVEMENTS, newIds);

        // Award achievement coins
        const achCoins = newUnlocks.reduce((sum, u) => sum + u.achievement.coinReward, 0);
        if (achCoins > 0) {
          setCoins((prev) => {
            const next = prev + achCoins;
            saveCache(CACHE_COINS, next);
            return next;
          });
        }

        // Server sync for each new achievement
        if (userId) {
          for (const unlock of newUnlocks) {
            economyApi.unlockAchievement(
              userId,
              unlock.achievement.id,
              unlock.achievement.coinReward
            ).catch(() => {});
          }
        }
      }

      // Server sync: coins + stats
      if (userId) {
        economyApi.addCoins(userId, totalEarned).catch(() => {});
        economyApi.updateStats(userId, newStats).catch(() => {});
      }

      return { coinsEarned: totalEarned, newAchievements: newUnlocks };
    },
    [playerStats, unlockedAchievements, userId]
  );

  // ── MyStats Data Sync ────────────────────────────────────────────

  const updateMyStatsData = useCallback(
    (data: { raceCount: number; streamersPlayed: string[]; pointsEarned: number }) => {
      const newStats = { ...playerStats };
      newStats.mystatsRaceCount = data.raceCount;
      newStats.mystatsStreamersPlayed = data.streamersPlayed;
      newStats.mystatsPointsEarned = data.pointsEarned;

      setPlayerStats(newStats);
      saveCache(CACHE_STATS, newStats);

      // Re-check achievements
      const unlocked = new Set(unlockedAchievements);
      const results = evaluateAchievements(newStats, unlocked);
      const newUnlocks = results.filter((r) => r.isNew);

      if (newUnlocks.length > 0) {
        const newIds = [...unlockedAchievements, ...newUnlocks.map((u) => u.achievement.id)];
        setUnlockedAchievements(newIds);
        saveCache(CACHE_ACHIEVEMENTS, newIds);

        const achCoins = newUnlocks.reduce((sum, u) => sum + u.achievement.coinReward, 0);
        if (achCoins > 0) {
          setCoins((prev) => {
            const next = prev + achCoins;
            saveCache(CACHE_COINS, next);
            return next;
          });
        }

        if (userId) {
          for (const unlock of newUnlocks) {
            economyApi.unlockAchievement(
              userId,
              unlock.achievement.id,
              unlock.achievement.coinReward
            ).catch(() => {});
          }
        }
      }

      // Server sync stats
      if (userId) {
        economyApi.updateStats(userId, newStats).catch(() => {});
      }

      return newUnlocks;
    },
    [playerStats, unlockedAchievements, userId]
  );

  // ── General achievement check ────────────────────────────────────

  const checkAchievements = useCallback(() => {
    const unlocked = new Set(unlockedAchievements);
    return evaluateAchievements(playerStats, unlocked);
  }, [playerStats, unlockedAchievements]);

  // ── Increment a stat directly ────────────────────────────────────

  const incrementStat = useCallback(
    (key: keyof PlayerStats, value: number = 1) => {
      const newStats = { ...playerStats };
      const current = newStats[key];
      if (typeof current === "number") {
        (newStats[key] as number) = current + value;
      }
      setPlayerStats(newStats);
      saveCache(CACHE_STATS, newStats);

      if (userId) {
        economyApi.updateStats(userId, newStats).catch(() => {});
      }
    },
    [playerStats, userId]
  );

  return {
    coins,
    inventory,
    unlockedAchievements,
    playerStats,
    addCoins,
    spendCoins,
    buyBuff,
    buyBuffWithPbp,
    consumeBuff,
    processRaceReward,
    updateMyStatsData,
    checkAchievements,
    getBuffCount,
    incrementStat,
    loadFromServer,
  };
}
