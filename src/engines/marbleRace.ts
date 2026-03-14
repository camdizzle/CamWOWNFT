import type { NFTCharacter, Race, RaceEntry, RaceResult } from "../types/nft";

// ── Marble Racing Engine ───────────────────────────────────────────────
// Stat influence on racing:
//   speed    → base movement per tick
//   agility  → chance to dodge obstacles / take shortcuts
//   stamina  → sustain speed over distance (less slowdown)
//   luck     → random bonus bursts
//   toughness → recover from collisions
//   charisma  → crowd boost (small random bonus)

const RACE_DISTANCE = 100; // finish line
const TICK_INTERVAL_MS = 100;
const POINTS_BY_PLACE = [100, 70, 50, 35, 25, 15, 10, 5];

export function createRace(
  id: string,
  name: string,
  characters: NFTCharacter[],
  startTime: number
): Race {
  return {
    id,
    name,
    status: "upcoming",
    startTime,
    entries: characters.map((c) => ({
      characterId: c.id,
      position: 0,
    })),
  };
}

// ── Deterministic seeded random (for replays) ──────────────────────────

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

// ── Simulate a full race instantly ─────────────────────────────────────

export function simulateRace(
  race: Race,
  characters: NFTCharacter[],
  seed?: number
): Race {
  const rand = seededRandom(seed ?? Date.now());
  const charMap = new Map(characters.map((c) => [c.id, c]));

  const entries: RaceEntry[] = race.entries.map((e) => ({ ...e, position: 0 }));
  const finishOrder: { characterId: string; tick: number }[] = [];

  let tick = 0;
  const maxTicks = 2000; // safety cap

  while (finishOrder.length < entries.length && tick < maxTicks) {
    tick++;
    for (const entry of entries) {
      if (entry.finishTime != null) continue; // already finished

      const char = charMap.get(entry.characterId);
      if (!char) continue;
      const { speed, agility, stamina, luck, toughness, charisma } = char.stats;

      // Base movement from speed
      let move = 0.3 + (speed / 30) * 1.2;

      // Stamina: less slowdown as race progresses
      const fatiguePoint = 50 + stamina * 2;
      if (entry.position > fatiguePoint) {
        const fatigueFactor = 1 - ((entry.position - fatiguePoint) / (RACE_DISTANCE - fatiguePoint)) * 0.4;
        move *= Math.max(0.5, fatigueFactor + stamina * 0.01);
      }

      // Agility: shortcut chance
      if (rand() < agility * 0.008) {
        move += 1.5;
      }

      // Luck: burst chance
      if (rand() < luck * 0.006) {
        move += 2.0;
      }

      // Toughness: collision recovery (random slowdowns are smaller)
      if (rand() < 0.08) {
        const collisionPenalty = Math.max(0.1, 1.2 - toughness * 0.06);
        move -= collisionPenalty;
      }

      // Charisma: crowd boost near end
      if (entry.position > 70 && rand() < charisma * 0.005) {
        move += 1.0;
      }

      // Random variance
      move += (rand() - 0.5) * 0.6;
      move = Math.max(0.05, move);

      entry.position = Math.min(RACE_DISTANCE, entry.position + move);

      if (entry.position >= RACE_DISTANCE && entry.finishTime == null) {
        entry.finishTime = tick * TICK_INTERVAL_MS;
        finishOrder.push({ characterId: entry.characterId, tick });
      }
    }
  }

  // Assign placements
  finishOrder.sort((a, b) => a.tick - b.tick);
  const results: RaceResult[] = finishOrder.map((fo, idx) => {
    const entry = entries.find((e) => e.characterId === fo.characterId)!;
    entry.placement = idx + 1;
    return {
      characterId: fo.characterId,
      placement: idx + 1,
      timeMs: fo.tick * TICK_INTERVAL_MS,
      pointsEarned: POINTS_BY_PLACE[idx] ?? 3,
    };
  });

  return {
    ...race,
    status: "finished",
    entries,
    results,
  };
}

// ── Tick-based simulation for animation ────────────────────────────────

export interface RaceSimulator {
  tick: () => RaceEntry[];
  isFinished: () => boolean;
  getResults: () => RaceResult[];
  getEntries: () => RaceEntry[];
}

export function createRaceSimulator(
  race: Race,
  characters: NFTCharacter[],
  seed?: number
): RaceSimulator {
  const rand = seededRandom(seed ?? Date.now());
  const charMap = new Map(characters.map((c) => [c.id, c]));
  const entries: RaceEntry[] = race.entries.map((e) => ({ ...e, position: 0 }));
  const finishOrder: { characterId: string; tick: number }[] = [];
  let currentTick = 0;

  function tick(): RaceEntry[] {
    if (finishOrder.length >= entries.length) return entries;
    currentTick++;

    for (const entry of entries) {
      if (entry.finishTime != null) continue;
      const char = charMap.get(entry.characterId);
      if (!char) continue;
      const { speed, agility, stamina, luck, toughness, charisma } = char.stats;

      let move = 0.3 + (speed / 30) * 1.2;

      const fatiguePoint = 50 + stamina * 2;
      if (entry.position > fatiguePoint) {
        const fatigueFactor = 1 - ((entry.position - fatiguePoint) / (RACE_DISTANCE - fatiguePoint)) * 0.4;
        move *= Math.max(0.5, fatigueFactor + stamina * 0.01);
      }

      if (rand() < agility * 0.008) move += 1.5;
      if (rand() < luck * 0.006) move += 2.0;
      if (rand() < 0.08) move -= Math.max(0.1, 1.2 - toughness * 0.06);
      if (entry.position > 70 && rand() < charisma * 0.005) move += 1.0;
      move += (rand() - 0.5) * 0.6;
      move = Math.max(0.05, move);

      entry.position = Math.min(RACE_DISTANCE, entry.position + move);

      if (entry.position >= RACE_DISTANCE && entry.finishTime == null) {
        entry.finishTime = currentTick * TICK_INTERVAL_MS;
        finishOrder.push({ characterId: entry.characterId, tick: currentTick });
      }
    }
    return entries;
  }

  function isFinished(): boolean {
    return finishOrder.length >= entries.length;
  }

  function getResults(): RaceResult[] {
    const sorted = [...finishOrder].sort((a, b) => a.tick - b.tick);
    return sorted.map((fo, idx) => {
      const entry = entries.find((e) => e.characterId === fo.characterId)!;
      entry.placement = idx + 1;
      return {
        characterId: fo.characterId,
        placement: idx + 1,
        timeMs: fo.tick * TICK_INTERVAL_MS,
        pointsEarned: POINTS_BY_PLACE[idx] ?? 3,
      };
    });
  }

  return { tick, isFinished, getResults, getEntries: () => entries };
}

// ── Schedule helpers ───────────────────────────────────────────────────

const RACE_INTERVAL_MS = 4 * 60 * 60 * 1000; // 4 hours

export function getNextRaceTime(now: number = Date.now()): number {
  const msIntoDay = now % (24 * 60 * 60 * 1000);
  const raceSlot = Math.ceil(msIntoDay / RACE_INTERVAL_MS) * RACE_INTERVAL_MS;
  const startOfDay = now - msIntoDay;
  return startOfDay + raceSlot;
}

export function getRaceSchedule(count: number, from: number = Date.now()): number[] {
  const schedule: number[] = [];
  let next = getNextRaceTime(from);
  for (let i = 0; i < count; i++) {
    schedule.push(next);
    next += RACE_INTERVAL_MS;
  }
  return schedule;
}
