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

export const RACE_DISTANCE = 2500; // finish line (~5 min at 100ms ticks)
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
// Below the knee, stats scale 1:1.  Above it, returns follow sqrt curve
// with a 1.0 multiplier — aggressive flattening so legendaries only get
// a ~10% edge in races rather than dominating.
// Examples (knee=6): 5→5, 6→6, 7→7, 10→8, 13→8.6, 21→9.9

const SOFT_CAP_KNEE = 6;

function softCap(raw: number): number {
  if (raw <= SOFT_CAP_KNEE) return raw;
  const excess = raw - SOFT_CAP_KNEE;
  return SOFT_CAP_KNEE + Math.sqrt(excess);
}

// ── Buff-aware movement calculation ────────────────────────────────────

interface TickContext {
  rand: () => number;
  entry: RaceEntry;
  char: NFTCharacter;
  buffs: ActiveBuff[];       // this character's buffs
  allBuffs: ActiveBuff[];    // all buffs in the race (for global effects like spotlight_curse)
  allEntries: RaceEntry[];
  currentTick: number;
}

// ── Terrain Zones ─────────────────────────────────────────────────────
// Each zone spans 20% of the track and amplifies one stat family.
// The active zone stat gets a 2.0× bonus; other proc-based stats are
// dampened to 0.3× so the favoured stat genuinely swings the race.

interface TerrainZone {
  name: string;
  start: number;       // fraction 0-1
  end: number;
  boost: string;       // stat key that gets amplified
}

const TERRAIN_ZONES: TerrainZone[] = [
  { name: "Sprint Start",       start: 0.00, end: 0.20, boost: "speed" },
  { name: "Obstacle Course",    start: 0.20, end: 0.40, boost: "agility" },
  { name: "Endurance Stretch",  start: 0.40, end: 0.60, boost: "stamina" },
  { name: "Lucky Gauntlet",     start: 0.60, end: 0.80, boost: "luck" },
  { name: "Final Stretch",      start: 0.80, end: 1.00, boost: "charisma" },
];

function getTerrainMultiplier(position: number, stat: string): number {
  const pct = position / RACE_DISTANCE;
  for (const zone of TERRAIN_ZONES) {
    if (pct >= zone.start && pct < zone.end) {
      return stat === zone.boost ? 2.0 : 0.3;
    }
  }
  return 1.0; // at finish line
}

function calculateMove(ctx: TickContext): number {
  const { rand, entry, char, buffs, allBuffs, allEntries, currentTick } = ctx;

  // Apply soft cap to all stats used in race formulas
  const speed = softCap(char.stats.speed);
  const agility = softCap(char.stats.agility);
  const stamina = softCap(char.stats.stamina);
  const luck = softCap(char.stats.luck);
  const toughness = softCap(char.stats.toughness);
  const charisma = softCap(char.stats.charisma);

  // Terrain zone multipliers — active zone stat is amplified
  const tm = (stat: string) => getTerrainMultiplier(entry.position, stat);

  const hasBuffs = (id: string) => buffs.some((b) => b.buffId === id);

  // ── Base speed ───────────────────────────────────────────────────
  // High floor (0.6) + small stat bonus (0.3) = stats matter through
  // procs & terrain, not raw per-tick domination over long races.
  let effectiveSpeed = speed;
  if (hasBuffs("turbo_charger")) effectiveSpeed *= 1.15;

  const speedBonus = (effectiveSpeed / 30) * 0.3 * tm("speed");
  let move = 0.6 + speedBonus;

  // ── Head Start (applied on tick 1) ───────────────────────────────
  if (currentTick === 1 && hasBuffs("head_start")) {
    entry.position = RACE_DISTANCE * 0.05;
  }

  // ── Stamina / Fatigue ────────────────────────────────────────────
  let fatiguePoint = RACE_DISTANCE * (0.60 + stamina * 0.008 * tm("stamina"));
  if (hasBuffs("energy_drink")) fatiguePoint += RACE_DISTANCE * 0.15; // delayed fatigue

  if (entry.position > fatiguePoint) {
    const fatigueFactor = 1 - ((entry.position - fatiguePoint) / (RACE_DISTANCE - fatiguePoint)) * 0.4;
    move *= Math.max(0.5, fatigueFactor + stamina * 0.01);
  }

  // ── Agility: shortcut chance ─────────────────────────────────────
  let agilityChance = agility * 0.005 * tm("agility");
  if (hasBuffs("clone_sprint")) agilityChance *= 3;

  if (rand() < agilityChance) move += 1.5;

  // ── Luck: burst chance ───────────────────────────────────────────
  let luckStat = luck;
  if (hasBuffs("double_luck") || hasBuffs("lucky_penny")) luckStat *= 2;

  if (rand() < luckStat * 0.004 * tm("luck")) move += 2.0;

  // ── Collision / Toughness ────────────────────────────────────────
  const ghostActive = hasBuffs("ghost_mode") && entry.position < RACE_DISTANCE * 0.40;
  const shieldActive = hasBuffs("shield_wall");

  // Spotlight Curse: if another racer equipped this buff and this entry is
  // in 1st during the 40-80% stretch, collision rate triples + speed penalty.
  // Only affects non-owners — the buyer is never penalized by their own curse.
  const racePct = entry.position / RACE_DISTANCE;
  const isLeader = allEntries
    .filter((e) => e.finishTime == null)
    .every((e) => e.position <= entry.position);
  const spotlightPenalty = isLeader && racePct >= 0.40 && racePct <= 0.80 &&
    allBuffs.some((b) => b.buffId === "spotlight_curse" && b.characterId !== entry.characterId);
  if (spotlightPenalty) move -= 0.15; // speed tax on 1st place
  const collisionRate = spotlightPenalty ? 0.24 : 0.08;

  if (rand() < collisionRate && !ghostActive && !shieldActive) {
    let penalty = Math.max(0.1, 1.2 - toughness * 0.06 * tm("toughness"));
    if (hasBuffs("rubber_bumpers")) penalty *= 0.25;
    move -= penalty;
  }

  // ── Charisma: crowd boost ────────────────────────────────────────
  const crowdThreshold = RACE_DISTANCE * (hasBuffs("crowd_frenzy") ? 0.40 : 0.70);
  if (entry.position > crowdThreshold && rand() < charisma * 0.003 * tm("charisma")) {
    move += 1.0;
  }

  // ── Tailwind: +1.2 speed during 25-65% if NOT in 1st place ──────
  if (hasBuffs("tailwind") && racePct >= 0.25 && racePct <= 0.65 && !isLeader) {
    move += 1.2;
  }

  // ── Nitro Boost (one-time, random trigger between 20-80%) ────────
  const nitroBuff = buffs.find((b) => b.buffId === "nitro_boost" && !b.triggered);
  if (nitroBuff && entry.position >= RACE_DISTANCE * 0.20 && entry.position <= RACE_DISTANCE * 0.80 && rand() < 0.06) {
    move *= 1.3;
    nitroBuff.triggered = true;
    nitroBuff.triggerTick = currentTick;
  }

  // ── Slipstream (final 20%, if 2nd-4th) ───────────────────────────
  if (hasBuffs("slipstream") && entry.position > RACE_DISTANCE * 0.80) {
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
  const rubberBandThreshold = RACE_DISTANCE * 0.02;
  if (gap > rubberBandThreshold) {
    move += Math.min(0.35, (gap - rubberBandThreshold) * 0.005);
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
    if (owner && owner.position > RACE_DISTANCE * 0.30 && owner.position < RACE_DISTANCE * 0.70 && rand() < 0.04) {
      // Slow a random OTHER racer
      const others = allEntries.filter(
        (e) => e.characterId !== bp.characterId && e.finishTime == null
      );
      if (others.length > 0) {
        const victim = others[Math.floor(rand() * others.length)];
        victim.position = Math.max(0, victim.position - RACE_DISTANCE * 0.03);
        bp.triggered = true;
      }
    }
  }

  // Earthquake: at 50% mark, slow everyone
  const earthquakes = allBuffs.filter((b) => b.buffId === "earthquake" && !b.triggered);
  for (const eq of earthquakes) {
    const owner = allEntries.find((e) => e.characterId === eq.characterId);
    if (owner && owner.position >= RACE_DISTANCE * 0.48 && owner.position <= RACE_DISTANCE * 0.52) {
      for (const entry of allEntries) {
        if (entry.finishTime == null) {
          const penalty = RACE_DISTANCE * (0.02 + rand() * 0.04); // 2-6% position penalty
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
    if (owner && owner.position >= RACE_DISTANCE * 0.58 && owner.position <= RACE_DISTANCE * 0.62 && owner.finishTime == null) {
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

  // Blue Shell: when LEADER reaches 65%, they get hit with 6% penalty
  // Triggers based on leader's position, not the buff owner's position
  const blueShells = allBuffs.filter((b) => b.buffId === "blue_shell" && !b.triggered);
  if (blueShells.length > 0) {
    const active = allEntries.filter((e) => e.finishTime == null);
    if (active.length > 1) {
      const leader = active.reduce((a, b) => (a.position > b.position ? a : b));
      const leaderPct = leader.position / RACE_DISTANCE;
      if (leaderPct >= 0.60 && leaderPct <= 0.70) {
        for (const bs of blueShells) {
          // Only fire if the owner isn't the leader
          if (leader.characterId !== bs.characterId) {
            leader.position = Math.max(0, leader.position - RACE_DISTANCE * 0.06);
            bs.triggered = true;
            break; // only one shell fires per tick
          }
        }
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

  // Track which chaos event thresholds have fired
  const chaosTriggered = new Set<number>();

  function tick(): RaceEntry[] {
    if (finishOrder.length >= entries.length) return entries;
    currentTick++;

    // Process global buffs first
    processGlobalBuffs(activeBuffs, entries, rand);

    // ── Chaos Events: dramatic moments every ~10% of the race ──────
    const active = entries.filter((e) => e.finishTime == null);
    if (active.length > 1) {
      const leader = active.reduce((a, b) => (a.position > b.position ? a : b));
      const leaderPct = leader.position / RACE_DISTANCE;

      for (const threshold of [0.10, 0.20, 0.30, 0.40, 0.50, 0.60, 0.70, 0.80, 0.90]) {
        if (leaderPct >= threshold && !chaosTriggered.has(threshold)) {
          chaosTriggered.add(threshold);
          const roll = rand();

          if (roll < 0.30) {
            // Wind Gust: random racer gets a surge (+2-4% of race distance)
            const lucky = active[Math.floor(rand() * active.length)];
            lucky.position += RACE_DISTANCE * (0.02 + rand() * 0.02);
          } else if (roll < 0.55) {
            // Rockslide: leader stumbles, loses 2-4% of distance
            const penalty = RACE_DISTANCE * (0.02 + rand() * 0.02);
            leader.position = Math.max(0, leader.position - penalty);
          } else if (roll < 0.80) {
            // Pack Shuffle: compress field — everyone moves toward the average
            const avg = active.reduce((s, e) => s + e.position, 0) / active.length;
            for (const e of active) {
              e.position = e.position + (avg - e.position) * 0.5;
            }
          } else {
            // Position Swap: two random racers swap positions
            if (active.length >= 2) {
              const i1 = Math.floor(rand() * active.length);
              let i2 = Math.floor(rand() * (active.length - 1));
              if (i2 >= i1) i2++;
              const temp = active[i1].position;
              active[i1].position = active[i2].position;
              active[i2].position = temp;
            }
          }
        }
      }
    }

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
        allBuffs: activeBuffs,
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
