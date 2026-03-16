import { useState, useCallback } from "react";
import type { Stats, StatKey, NFTCharacter } from "../types/nft";
import {
  createEmptyProgression,
  applyRaceProgression,
  applyBattleProgression,
  getEffectiveStats,
  totalXpForLevel,
  MAX_PROGRESSION_BONUS,
  MAX_NFT_LEVEL,
} from "../engines/progression";
import type { CharacterProgression, ProgressionGain, LevelUpEvent } from "../engines/progression";
import { totalPower } from "../data/traitStatMap";
import { progressionApi } from "../api/client";

// ── Local cache ────────────────────────────────────────────────────────
const CACHE_KEY = "camwow_progression";

function loadCache(): Record<string, CharacterProgression> {
  const saved = localStorage.getItem(CACHE_KEY);
  if (saved) {
    try { return JSON.parse(saved); } catch { return {}; }
  }
  return {};
}

function saveCache(data: Record<string, CharacterProgression>) {
  localStorage.setItem(CACHE_KEY, JSON.stringify(data));
}

// ── Hook ───────────────────────────────────────────────────────────────

export interface ProgressionResult {
  statGains: ProgressionGain[];
  levelUp: LevelUpEvent | null;
}

export interface UseProgressionResult {
  getProgression: (characterId: string) => CharacterProgression;
  applyRaceResult: (characterId: string, baseStats: Stats, placement: number) => ProgressionResult;
  applyBattleResult: (characterId: string, baseStats: Stats, won: boolean) => ProgressionResult;
  getEffectiveCharacter: (character: NFTCharacter) => NFTCharacter;
  progressions: Record<string, CharacterProgression>;
  loadFromServer: (nftIds: string[]) => Promise<void>;
}

export function useProgression(): UseProgressionResult {
  const [progressions, setProgressions] = useState<Record<string, CharacterProgression>>(
    loadCache
  );

  // ── Load from server ─────────────────────────────────────────────

  const loadFromServer = useCallback(async (nftIds: string[]) => {
    if (nftIds.length === 0) return;
    try {
      const serverData = await progressionApi.getBatch(nftIds);
      const merged = { ...progressions };

      for (const nftId of nftIds) {
        const serverProg = serverData[nftId];
        if (serverProg) {
          const existing = merged[nftId] ?? createEmptyProgression(nftId);
          merged[nftId] = {
            ...existing,
            characterId: nftId,
            statProgress: { ...existing.statProgress },
            xp: serverProg.xp ?? existing.xp,
            level: serverProg.level ?? existing.level,
            totalRaces: serverProg.totalRaces ?? existing.totalRaces,
            totalWins: serverProg.totalWins ?? existing.totalWins,
            totalBattles: serverProg.totalBattles ?? existing.totalBattles,
            totalBattleWins: serverProg.totalBattleWins ?? existing.totalBattleWins,
            lastRaceTime: serverProg.lastRaceTime ?? existing.lastRaceTime,
            lastBattleTime: serverProg.lastBattleTime ?? existing.lastBattleTime,
          };
          const statProgress = serverProg.statProgress ?? serverProg;
          for (const key of Object.keys(existing.statProgress) as StatKey[]) {
            if (statProgress[key]) {
              merged[nftId].statProgress[key] = {
                xp: statProgress[key].xp,
                level: statProgress[key].level,
              };
            }
          }
        }
      }

      setProgressions(merged);
      saveCache(merged);
    } catch {
      // Server unreachable — use cached data
    }
  }, [progressions]);

  const getProgression = useCallback(
    (characterId: string): CharacterProgression => {
      return progressions[characterId] ?? createEmptyProgression(characterId);
    },
    [progressions]
  );

  const deepCopyProg = useCallback((characterId: string): CharacterProgression => {
    const prog = progressions[characterId]
      ? { ...progressions[characterId], statProgress: { ...progressions[characterId].statProgress } }
      : createEmptyProgression(characterId);
    for (const key of Object.keys(prog.statProgress) as StatKey[]) {
      prog.statProgress[key] = { ...prog.statProgress[key] };
    }
    return prog;
  }, [progressions]);

  const saveProg = useCallback((characterId: string, prog: CharacterProgression) => {
    const updated = { ...progressions, [characterId]: prog };
    setProgressions(updated);
    saveCache(updated);
    progressionApi.update(characterId, {
      statProgress: prog.statProgress,
      xp: prog.xp,
      level: prog.level,
      totalRaces: prog.totalRaces,
      totalWins: prog.totalWins,
      totalBattles: prog.totalBattles,
      totalBattleWins: prog.totalBattleWins,
      lastRaceTime: prog.lastRaceTime,
      lastBattleTime: prog.lastBattleTime,
    }).catch(() => {});
  }, [progressions]);

  const applyRaceResult = useCallback(
    (characterId: string, baseStats: Stats, placement: number): ProgressionResult => {
      const prog = deepCopyProg(characterId);
      const { statGains, levelUp } = applyRaceProgression(prog, baseStats, placement);
      saveProg(characterId, prog);
      return { statGains, levelUp };
    },
    [deepCopyProg, saveProg]
  );

  const applyBattleResult = useCallback(
    (characterId: string, baseStats: Stats, won: boolean): ProgressionResult => {
      const prog = deepCopyProg(characterId);
      const { statGains, levelUp } = applyBattleProgression(prog, baseStats, won);
      saveProg(characterId, prog);
      return { statGains, levelUp };
    },
    [deepCopyProg, saveProg]
  );

  const getEffectiveCharacter = useCallback(
    (character: NFTCharacter): NFTCharacter => {
      const prog = progressions[character.id];
      if (!prog) return character;

      const effectiveStats = getEffectiveStats(character.stats, prog);
      return {
        ...character,
        stats: effectiveStats,
        totalPower: totalPower(effectiveStats),
      };
    },
    [progressions]
  );

  return {
    getProgression,
    applyRaceResult,
    applyBattleResult,
    getEffectiveCharacter,
    progressions,
    loadFromServer,
  };
}

export { MAX_PROGRESSION_BONUS, MAX_NFT_LEVEL, totalXpForLevel };
