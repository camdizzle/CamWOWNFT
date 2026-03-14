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

// ── Persistence key ────────────────────────────────────────────────────
const STORAGE_KEY = "camwow_progression";

function loadProgressions(): Record<string, CharacterProgression> {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try { return JSON.parse(saved); } catch { return {}; }
  }
  return {};
}

function saveProgressions(data: Record<string, CharacterProgression>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ── Hook ───────────────────────────────────────────────────────────────

export interface UseProgressionResult {
  getProgression: (characterId: string) => CharacterProgression;
  applyRaceResult: (characterId: string, baseStats: Stats, placement: number) => ProgressionGain[];
  getEffectiveCharacter: (character: NFTCharacter) => NFTCharacter;
  progressions: Record<string, CharacterProgression>;
}

export function useProgression(): UseProgressionResult {
  const [progressions, setProgressions] = useState<Record<string, CharacterProgression>>(
    loadProgressions
  );

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
      saveProgressions(updated);

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
  };
}

export { MAX_PROGRESSION_BONUS, totalXpForLevel };
