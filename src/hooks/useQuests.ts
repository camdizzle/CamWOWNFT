import { useState, useCallback } from "react";
import {
  getDailyQuests,
  getWeeklyQuests,
  getActiveMilestones,
  evaluateQuest,
  nextMidnightUTC,
  nextMondayUTC,
  getISOWeekKey,
  ALL_QUEST_MAP,
} from "../engines/quests";
import type { QuestState, QuestProgress, QuestDefinition } from "../engines/quests";
import { questApi } from "../api/client";

// ── Local cache ──────────────────────────────────────────────────────────

const CACHE_QUESTS = "camwow_quests";
const CACHE_PERIOD_STATS = "camwow_quest_period_stats";

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

// ── Types ────────────────────────────────────────────────────────────────

export interface UseQuestsResult {
  questState: QuestState;
  /** Period stats for current daily period (today). */
  dailyStats: Record<string, number>;
  /** Period stats for current weekly period. */
  weeklyStats: Record<string, number>;
  /** Refresh quest selection (handles daily/weekly resets). */
  refreshQuests: () => void;
  /** Increment a period stat after a game event (race, battle, etc.). */
  incrementQuestStat: (statKey: string, amount?: number) => void;
  /** Claim a completed quest's coin reward. Returns coins earned or 0. */
  claimQuest: (questId: string) => number;
  /** Load quest state from server. */
  loadFromServer: (userId: string) => Promise<void>;
  /** Get the quest definition for a progress entry. */
  getQuestDef: (questId: string) => QuestDefinition | undefined;
}

// ── Hook ─────────────────────────────────────────────────────────────────

export function useQuests(): UseQuestsResult {
  const [questState, setQuestState] = useState<QuestState>(() => {
    const cached = loadCache<QuestState | null>(CACHE_QUESTS, null);
    if (cached) return cached;
    return buildFreshState();
  });

  const [dailyStats, setDailyStats] = useState<Record<string, number>>(() =>
    loadCache(CACHE_PERIOD_STATS + "_daily", {})
  );
  const [weeklyStats, setWeeklyStats] = useState<Record<string, number>>(() =>
    loadCache(CACHE_PERIOD_STATS + "_weekly", {})
  );

  const [userId, setUserId] = useState<string | null>(null);

  // ── Build fresh quest state ──────────────────────────────────────────

  function buildFreshState(): QuestState {
    const now = Date.now();
    const daily = getDailyQuests();
    const weekly = getWeeklyQuests();

    return {
      daily: daily.map((q) => ({ questId: q.id, progress: 0, completed: false, claimed: false })),
      weekly: weekly.map((q) => ({ questId: q.id, progress: 0, completed: false, claimed: false })),
      milestone: [],
      dailyResetAt: nextMidnightUTC(now),
      weeklyResetAt: nextMondayUTC(now),
    };
  }

  // ── Reset check ────────────────────────────────────────────────────

  const refreshQuests = useCallback(() => {
    const now = Date.now();
    setQuestState((prev) => {
      let next = { ...prev };
      let changed = false;

      // Daily reset
      if (now >= prev.dailyResetAt) {
        const daily = getDailyQuests();
        next.daily = daily.map((q) => ({ questId: q.id, progress: 0, completed: false, claimed: false }));
        next.dailyResetAt = nextMidnightUTC(now);
        changed = true;

        // Reset daily period stats
        setDailyStats({});
        saveCache(CACHE_PERIOD_STATS + "_daily", {});
      }

      // Weekly reset
      if (now >= prev.weeklyResetAt) {
        const weekly = getWeeklyQuests();
        next.weekly = weekly.map((q) => ({ questId: q.id, progress: 0, completed: false, claimed: false }));
        next.weeklyResetAt = nextMondayUTC(now);
        changed = true;

        // Reset weekly period stats
        setWeeklyStats({});
        saveCache(CACHE_PERIOD_STATS + "_weekly", {});
      }

      if (changed) {
        saveCache(CACHE_QUESTS, next);
      }
      return changed ? next : prev;
    });
  }, []);

  // ── Increment stat ──────────────────────────────────────────────────

  const incrementQuestStat = useCallback(
    (statKey: string, amount: number = 1) => {
      // Update daily stats
      setDailyStats((prev) => {
        const next = { ...prev, [statKey]: (prev[statKey] ?? 0) + amount };
        saveCache(CACHE_PERIOD_STATS + "_daily", next);
        return next;
      });

      // Update weekly stats
      setWeeklyStats((prev) => {
        const next = { ...prev, [statKey]: (prev[statKey] ?? 0) + amount };
        saveCache(CACHE_PERIOD_STATS + "_weekly", next);
        return next;
      });

      // Re-evaluate all quests after stat update
      setTimeout(() => {
        setQuestState((prev) => {
          const newDailyStats = loadCache<Record<string, number>>(CACHE_PERIOD_STATS + "_daily", {});
          const newWeeklyStats = loadCache<Record<string, number>>(CACHE_PERIOD_STATS + "_weekly", {});

          const nextDaily = prev.daily.map((qp) => {
            if (qp.claimed) return qp;
            const def = ALL_QUEST_MAP.get(qp.questId);
            if (!def) return qp;
            const result = evaluateQuest(def, newDailyStats);
            return { ...qp, progress: result.progress, completed: result.completed };
          });

          const nextWeekly = prev.weekly.map((qp) => {
            if (qp.claimed) return qp;
            const def = ALL_QUEST_MAP.get(qp.questId);
            if (!def) return qp;
            const result = evaluateQuest(def, newWeeklyStats);
            return { ...qp, progress: result.progress, completed: result.completed };
          });

          const next = { ...prev, daily: nextDaily, weekly: nextWeekly };
          saveCache(CACHE_QUESTS, next);

          // Sync to server (fire-and-forget)
          if (userId) {
            const today = new Date().toISOString().slice(0, 10);
            const weekKey = getISOWeekKey();

            const batchQuests = [
              ...nextDaily.map((q) => ({
                questId: q.questId,
                frequency: "daily",
                periodKey: today,
                progress: q.progress,
                completed: q.completed,
              })),
              ...nextWeekly.map((q) => ({
                questId: q.questId,
                frequency: "weekly",
                periodKey: weekKey,
                progress: q.progress,
                completed: q.completed,
              })),
            ];
            questApi.batchUpdateProgress(userId, batchQuests).catch(() => {});
            questApi.updatePeriodStats(userId, today, newDailyStats).catch(() => {});
            questApi.updatePeriodStats(userId, weekKey, newWeeklyStats).catch(() => {});
          }

          return next;
        });
      }, 0);
    },
    [userId]
  );

  // ── Claim quest ─────────────────────────────────────────────────────

  const claimQuest = useCallback(
    (questId: string): number => {
      const def = ALL_QUEST_MAP.get(questId);
      if (!def) return 0;

      let reward = 0;
      setQuestState((prev) => {
        const updateList = (list: QuestProgress[]) =>
          list.map((qp) => {
            if (qp.questId === questId && qp.completed && !qp.claimed) {
              reward = def.coinReward;
              return { ...qp, claimed: true };
            }
            return qp;
          });

        const next = {
          ...prev,
          daily: updateList(prev.daily),
          weekly: updateList(prev.weekly),
          milestone: updateList(prev.milestone),
        };
        saveCache(CACHE_QUESTS, next);
        return next;
      });

      // Server sync
      if (reward > 0 && userId) {
        const periodKey =
          def.frequency === "daily"
            ? new Date().toISOString().slice(0, 10)
            : def.frequency === "weekly"
              ? getISOWeekKey()
              : "lifetime";
        questApi.claimReward(userId, questId, periodKey, reward).catch(() => {});
      }

      return reward;
    },
    [userId]
  );

  // ── Load from server ────────────────────────────────────────────────

  const loadFromServer = useCallback(async (uid: string) => {
    setUserId(uid);
    try {
      const data = await questApi.get(uid);
      // Merge server data with current quest selections
      // (Server stores progress, client determines which quests are active)
      const serverQuestMap = new Map<string, any>();
      for (const q of data.quests ?? []) {
        serverQuestMap.set(`${q.quest_id}:${q.period_key}`, q);
      }

      // Build period stats from server
      const serverPeriodStats = new Map<string, Record<string, number>>();
      for (const s of data.periodStats ?? []) {
        if (!serverPeriodStats.has(s.period_key)) {
          serverPeriodStats.set(s.period_key, {});
        }
        serverPeriodStats.get(s.period_key)![s.stat_key] = s.value;
      }

      const today = new Date().toISOString().slice(0, 10);
      const weekKey = getISOWeekKey();

      const serverDailyStats = serverPeriodStats.get(today) ?? {};
      const serverWeeklyStats = serverPeriodStats.get(weekKey) ?? {};

      setDailyStats(serverDailyStats);
      setWeeklyStats(serverWeeklyStats);
      saveCache(CACHE_PERIOD_STATS + "_daily", serverDailyStats);
      saveCache(CACHE_PERIOD_STATS + "_weekly", serverWeeklyStats);

      // Rebuild quest state with server progress
      setQuestState((prev) => {
        const mergeProgress = (list: QuestProgress[], periodKey: string, stats: Record<string, number>) =>
          list.map((qp) => {
            const serverRow = serverQuestMap.get(`${qp.questId}:${periodKey}`);
            if (serverRow) {
              return {
                ...qp,
                progress: serverRow.progress,
                completed: !!serverRow.completed,
                claimed: !!serverRow.claimed,
              };
            }
            // Re-evaluate from stats
            const def = ALL_QUEST_MAP.get(qp.questId);
            if (def) {
              const result = evaluateQuest(def, stats);
              return { ...qp, progress: result.progress, completed: result.completed };
            }
            return qp;
          });

        const next = {
          ...prev,
          daily: mergeProgress(prev.daily, today, serverDailyStats),
          weekly: mergeProgress(prev.weekly, weekKey, serverWeeklyStats),
        };
        saveCache(CACHE_QUESTS, next);
        return next;
      });
    } catch {
      // Server unreachable — use cached data
    }
  }, []);

  // ── Get quest definition ────────────────────────────────────────────

  const getQuestDef = useCallback(
    (questId: string) => ALL_QUEST_MAP.get(questId),
    []
  );

  return {
    questState,
    dailyStats,
    weeklyStats,
    refreshQuests,
    incrementQuestStat,
    claimQuest,
    loadFromServer,
    getQuestDef,
  };
}
