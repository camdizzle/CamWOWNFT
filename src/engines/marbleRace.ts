import type { NFTCharacter, Race, RaceEntry, RaceResult } from "../types/nft";
import type { ActiveBuff } from "./buffs";

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

// ── Soft cap: diminishing returns above SOFT_CAP_KNEE ─────────────────
// Below the knee, stats scale 1:1.  Above it, returns follow sqrt curve.
// Examples (knee=10): 5→5, 10→10, 15→13.4, 20→14.7, 32→17.0

const SOFT_CAP_KNEE = 10;

function softCap(raw: number): number {
  if (raw <= SOFT_CAP_KNEE) return raw;
  const excess = raw - SOFT_CAP_KNEE;
  return SOFT_CAP_KNEE + Math.sqrt(excess) * 1.5;
}

// ── Buff-aware movement calculation ────────────────────────────────────

interface TickContext {
  rand: () => number;
  entry: RaceEntry;
  char: NFTCharacter;
  buffs: ActiveBuff[];
  allEntries: RaceEntry[];
  currentTick: number;
}

function calculateMove(ctx: TickContext): number {
  const { rand, entry, char, buffs, allEntries, currentTick } = ctx;

  // Apply soft cap to all stats used in race formulas
  const speed = softCap(char.stats.speed);
  const agility = softCap(char.stats.agility);
  const stamina = softCap(char.stats.stamina);
  const luck = softCap(char.stats.luck);
  const toughness = softCap(char.stats.toughness);
  const charisma = softCap(char.stats.charisma);

  const hasBuffs = (id: string) => buffs.some((b) => b.buffId === id);

  // ── Base speed ───────────────────────────────────────────────────
  let effectiveSpeed = speed;
  if (hasBuffs("turbo_charger")) effectiveSpeed *= 1.15;

  let move = 0.3 + (effectiveSpeed / 30) * 1.2;

  // ── Head Start (applied on tick 1) ───────────────────────────────
  if (currentTick === 1 && hasBuffs("head_start")) {
    entry.position = 5;
  }

  // ── Stamina / Fatigue ────────────────────────────────────────────
  let fatiguePoint = 60 + stamina * 0.8;
  if (hasBuffs("energy_drink")) fatiguePoint += 15; // delayed fatigue

  if (entry.position > fatiguePoint) {
    const fatigueFactor = 1 - ((entry.position - fatiguePoint) / (RACE_DISTANCE - fatiguePoint)) * 0.4;
    move *= Math.max(0.5, fatigueFactor + stamina * 0.01);
  }

  // ── Agility: shortcut chance ─────────────────────────────────────
  let agilityChance = agility * 0.008;
  if (hasBuffs("clone_sprint")) agilityChance *= 3;

  if (rand() < agilityChance) move += 1.5;

  // ── Luck: burst chance ───────────────────────────────────────────
  let luckStat = luck;
  if (hasBuffs("double_luck") || hasBuffs("lucky_penny")) luckStat *= 2;

  if (rand() < luckStat * 0.006) move += 2.0;

  // ── Collision / Toughness ────────────────────────────────────────
  const ghostActive = hasBuffs("ghost_mode") && entry.position < 40;
  const shieldActive = hasBuffs("shield_wall");

  if (rand() < 0.08 && !ghostActive && !shieldActive) {
    let penalty = Math.max(0.1, 1.2 - toughness * 0.06);
    if (hasBuffs("rubber_bumpers")) penalty *= 0.25;
    move -= penalty;
  }

  // ── Charisma: crowd boost ────────────────────────────────────────
  const crowdThreshold = hasBuffs("crowd_frenzy") ? 40 : 70;
  if (entry.position > crowdThreshold && rand() < charisma * 0.005) {
    move += 1.0;
  }

  // ── Nitro Boost (one-time, random trigger between 20-80%) ────────
  const nitroBuff = buffs.find((b) => b.buffId === "nitro_boost" && !b.triggered);
  if (nitroBuff && entry.position >= 20 && entry.position <= 80 && rand() < 0.06) {
    move *= 1.3;
    nitroBuff.triggered = true;
    nitroBuff.triggerTick = currentTick;
  }

  // ── Slipstream (final 20%, if 2nd-4th) ───────────────────────────
  if (hasBuffs("slipstream") && entry.position > 80) {
    const sorted = [...allEntries]
      .filter((e) => e.finishTime == null)
      .sort((a, b) => b.position - a.position);
    const rank = sorted.findIndex((e) => e.characterId === entry.characterId);
    if (rank >= 1 && rank <= 3) {
      move += 1.2;
    }
  }

  // ── Rubber-band: trailing racers get a small catch-up nudge ──────
  const sorted = [...allEntries]
    .filter((e) => e.finishTime == null)
    .sort((a, b) => b.position - a.position);
  const leaderPos = sorted[0]?.position ?? 0;
  const gap = leaderPos - entry.position;
  if (gap > 5) {
    move += Math.min(0.35, (gap - 5) * 0.03);
  }

  // ── Random variance ──────────────────────────────────────────────
  move += (rand() - 0.5) * 0.9;
  move = Math.max(0.05, move);

  return move;
}

// ── Apply global buffs (affect all racers) ─────────────────────────────

interface GlobalBuffEvent {
  buffId: string;
  triggerPosition: number;
  triggered: boolean;
}

function processGlobalBuffs(
  allBuffs: ActiveBuff[],
  allEntries: RaceEntry[],
  rand: () => number
): GlobalBuffEvent[] {
  const events: GlobalBuffEvent[] = [];

  // Banana Peel: random opponent gets slowed
  const bananaPeels = allBuffs.filter((b) => b.buffId === "banana_peel" && !b.triggered);
  for (const bp of bananaPeels) {
    const owner = allEntries.find((e) => e.characterId === bp.characterId);
    if (owner && owner.position > 30 && owner.position < 70 && rand() < 0.04) {
      // Slow a random OTHER racer
      const others = allEntries.filter(
        (e) => e.characterId !== bp.characterId && e.finishTime == null
      );
      if (others.length > 0) {
        const victim = others[Math.floor(rand() * others.length)];
        victim.position = Math.max(0, victim.position - 3);
        bp.triggered = true;
      }
    }
  }

  // Earthquake: at 50% mark, slow everyone
  const earthquakes = allBuffs.filter((b) => b.buffId === "earthquake" && !b.triggered);
  for (const eq of earthquakes) {
    const owner = allEntries.find((e) => e.characterId === eq.characterId);
    if (owner && owner.position >= 48 && owner.position <= 52) {
      for (const entry of allEntries) {
        if (entry.finishTime == null) {
          const penalty = 2 + rand() * 4; // 2-6 position penalty
          entry.position = Math.max(0, entry.position - penalty);
        }
      }
      eq.triggered = true;
    }
  }

  // Time Warp: at 60% mark, swap with racer ahead
  const timeWarps = allBuffs.filter((b) => b.buffId === "time_warp" && !b.triggered);
  for (const tw of timeWarps) {
    const owner = allEntries.find((e) => e.characterId === tw.characterId);
    if (owner && owner.position >= 58 && owner.position <= 62 && owner.finishTime == null) {
      const sorted = [...allEntries]
        .filter((e) => e.finishTime == null)
        .sort((a, b) => b.position - a.position);
      const myIdx = sorted.findIndex((e) => e.characterId === tw.characterId);
      if (myIdx > 0) {
        // Swap positions with the racer ahead
        const ahead = sorted[myIdx - 1];
        const tempPos = owner.position;
        owner.position = ahead.position;
        ahead.position = tempPos;
        tw.triggered = true;
      }
    }
  }

  return events;
}

// ── Buff-aware Race Simulator ──────────────────────────────────────────

export interface RaceSimulator {
  tick: () => RaceEntry[];
  isFinished: () => boolean;
  getResults: () => RaceResult[];
  getEntries: () => RaceEntry[];
  getBuffEvents: () => ActiveBuff[];
}

export function createRaceSimulator(
  race: Race,
  characters: NFTCharacter[],
  seed?: number,
  raceBuffs?: ActiveBuff[]
): RaceSimulator {
  const rand = seededRandom(seed ?? Date.now());
  const charMap = new Map(characters.map((c) => [c.id, c]));
  const entries: RaceEntry[] = race.entries.map((e) => ({ ...e, position: 0 }));
  const finishOrder: { characterId: string; tick: number }[] = [];
  let currentTick = 0;

  // Deep copy buffs so we can mutate triggered state
  const activeBuffs: ActiveBuff[] = (raceBuffs ?? []).map((b) => ({ ...b }));

  function tick(): RaceEntry[] {
    if (finishOrder.length >= entries.length) return entries;
    currentTick++;

    // Process global buffs first
    processGlobalBuffs(activeBuffs, entries, rand);

    for (const entry of entries) {
      if (entry.finishTime != null) continue;
      const char = charMap.get(entry.characterId);
      if (!char) continue;

      const charBuffs = activeBuffs.filter((b) => b.characterId === entry.characterId);

      const move = calculateMove({
        rand,
        entry,
        char,
        buffs: charBuffs,
        allEntries: entries,
        currentTick,
      });

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

    // Check for Photo Finish buff
    const winnerTick = sorted.length > 0 ? sorted[0].tick : 0;
    const photoFinishCharIds = new Set(
      activeBuffs
        .filter((b) => b.buffId === "photo_finish")
        .map((b) => b.characterId)
    );

    return sorted.map((fo, idx) => {
      const entry = entries.find((e) => e.characterId === fo.characterId)!;
      entry.placement = idx + 1;

      let pointsEarned = POINTS_BY_PLACE[idx] ?? 3;

      // Photo Finish: if within 0.5s of winner and has the buff, get 1st place points
      if (
        idx > 0 &&
        photoFinishCharIds.has(fo.characterId) &&
        (fo.tick - winnerTick) * TICK_INTERVAL_MS <= 500
      ) {
        pointsEarned = POINTS_BY_PLACE[0]; // 1st place points
      }

      return {
        characterId: fo.characterId,
        placement: idx + 1,
        timeMs: fo.tick * TICK_INTERVAL_MS,
        pointsEarned,
      };
    });
  }

  return {
    tick,
    isFinished,
    getResults,
    getEntries: () => entries,
    getBuffEvents: () => activeBuffs,
  };
}

// ── Legacy createRace (unchanged) ──────────────────────────────────────

export function simulateRace(
  race: Race,
  characters: NFTCharacter[],
  seed?: number
): Race {
  const sim = createRaceSimulator(race, characters, seed);
  while (!sim.isFinished()) sim.tick();
  return {
    ...race,
    status: "finished",
    entries: sim.getEntries(),
    results: sim.getResults(),
  };
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
