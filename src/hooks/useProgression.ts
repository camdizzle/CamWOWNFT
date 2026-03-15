import { useState, useCallback } from "react";
import type { Stats, StatKey, NFTCharacter } from "../types/nft";
import {
  createEmptyProgression,
  applyRaceProgression,
  getEffectiveStats,
  totalXpForLevel,
  MAX_PROGRESSION_BONUS,
} from "../engines/progression";
import type { CharacterProgression, ProgressionGain } from "../engines/progression";
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

export interface UseProgressionResult {
  getProgression: (characterId: string) => CharacterProgression;
  applyRaceResult: (characterId: string, baseStats: Stats, placement: number) => ProgressionGain[];
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
          };
          for (const key of Object.keys(serverProg) as StatKey[]) {
            merged[nftId].statProgress[key] = {
              xp: serverProg[key].xp,
              level: serverProg[key].level,
            };
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

  const applyRaceResult = useCallback(
    (characterId: string, baseStats: Stats, placement: number): ProgressionGain[] => {
      const prog = progressions[characterId]
        ? { ...progressions[characterId], statProgress: { ...progressions[characterId].statProgress } }
        : createEmptyProgression(characterId);

      // Deep copy statProgress entries
      for (const key of Object.keys(prog.statProgress) as StatKey[]) {
        prog.statProgress[key] = { ...prog.statProgress[key] };
      }

      const gains = applyRaceProgression(prog, baseStats, placement);

      const updated = { ...progressions, [characterId]: prog };
      setProgressions(updated);
      saveCache(updated);

      // Server sync: save updated progression
      progressionApi.update(characterId, prog.statProgress).catch(() => {});

      return gains;
    },
    [progressions]
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
    getEffectiveCharacter,
    progressions,
    loadFromServer,
  };
}

export { MAX_PROGRESSION_BONUS, totalXpForLevel };
