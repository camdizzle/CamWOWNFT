import type { RaceLobby, LobbyStatus, RaceMode } from "../types/nft";

// ── Race Lobby Engine ──────────────────────────────────────────────────
// Races scheduled every 4 hours. Minimum 6 entries to start normally.
// If < 6 at scheduled time, timer extends in 15-min increments up to 2 hours.
// After 2 hours of extensions, race starts with 3+ racers (no cancellation).
// No maximum racer cap — unlimited entries allowed.
// Two modes: "free" (earn coins) and "premium" (50 PBP entry fee with prize pool).

const RACE_INTERVAL_MS = 4 * 60 * 60 * 1000; // 4 hours
const EXTENSION_MS = 15 * 60 * 1000; // 15-min extensions
const MAX_EXTENSIONS = 8; // max 2 hours of extensions
const MIN_ENTRIES = 6; // normal minimum to start
const MIN_ENTRIES_EXTENDED = 3; // minimum after max extensions
const MAX_PER_USER = 2;
const COUNTDOWN_DURATION_MS = 30 * 1000; // 30-second countdown once min met

export function createLobby(scheduledTime: number, mode: RaceMode = "free"): RaceLobby {
  return {
    id: `lobby-${scheduledTime}-${mode}`,
    scheduledTime,
    deadlineTime: scheduledTime,
    status: "waiting",
    entries: [],
    minEntries: MIN_ENTRIES,
    maxPerUser: MAX_PER_USER,
    mode,
    entryFeePBP: mode === "premium" ? 50 : 0,
    prizePool: 0,
  };
}

// ── Join Lobby ─────────────────────────────────────────────────────────

export type JoinResult =
  | { ok: true }
  | { ok: false; reason: string };

export function joinLobby(
  lobby: RaceLobby,
  characterId: string,
  userId: string
): JoinResult {
  if (lobby.status === "racing" || lobby.status === "finished") {
    return { ok: false, reason: "Race has already started or finished." };
  }

  // No max cap — unlimited entries

  // Check per-user limit
  const userEntries = lobby.entries.filter((e) => e.userId === userId);
  if (userEntries.length >= lobby.maxPerUser) {
    return {
      ok: false,
      reason: `You can only enter ${lobby.maxPerUser} NFTs per race.`,
    };
  }

  // Check duplicate NFT
  if (lobby.entries.some((e) => e.characterId === characterId)) {
    return { ok: false, reason: "This NFT is already entered." };
  }

  lobby.entries.push({
    characterId,
    userId,
    readyAt: Date.now(),
  });

  // For premium races, add to prize pool
  if (lobby.mode === "premium") {
    lobby.prizePool += lobby.entryFeePBP;
  }

  return { ok: true };
}

// ── Leave Lobby ────────────────────────────────────────────────────────

export function leaveLobby(lobby: RaceLobby, characterId: string): boolean {
  if (lobby.status !== "waiting") return false;
  const idx = lobby.entries.findIndex((e) => e.characterId === characterId);
  if (idx === -1) return false;
  lobby.entries.splice(idx, 1);

  // For premium races, refund from prize pool
  if (lobby.mode === "premium") {
    lobby.prizePool = Math.max(0, lobby.prizePool - lobby.entryFeePBP);
  }

  return true;
}

// ── Tick Lobby (called on interval) ────────────────────────────────────
// Returns the new status after evaluating the lobby state.

export function tickLobby(lobby: RaceLobby, now: number = Date.now()): LobbyStatus {
  if (lobby.status === "racing" || lobby.status === "finished") {
    return lobby.status;
  }

  // Not yet at scheduled/deadline time
  if (now < lobby.deadlineTime && lobby.entries.length < lobby.minEntries) {
    return "waiting";
  }

  // At or past deadline
  if (now >= lobby.deadlineTime) {
    if (lobby.entries.length >= lobby.minEntries) {
      // Enough racers — start countdown
      lobby.status = "countdown";
      return "countdown";
    }

    // Not enough racers — extend or lower threshold
    const extensions = Math.floor(
      (lobby.deadlineTime - lobby.scheduledTime) / EXTENSION_MS
    );
    if (extensions < MAX_EXTENSIONS) {
      lobby.deadlineTime += EXTENSION_MS;
      return "waiting"; // extended, keep waiting
    }

    // Max extensions reached — lower minimum to 3 and start if possible
    if (lobby.entries.length >= MIN_ENTRIES_EXTENDED) {
      lobby.minEntries = MIN_ENTRIES_EXTENDED;
      lobby.status = "countdown";
      return "countdown";
    }

    // Still not enough even for extended minimum — keep waiting
    // (no cancellation — race stays open until 3+ join)
    lobby.minEntries = MIN_ENTRIES_EXTENDED;
    lobby.deadlineTime += EXTENSION_MS; // keep extending
    return "waiting";
  }

  // We have enough entries before the deadline
  if (lobby.entries.length >= lobby.minEntries) {
    // If past the original scheduled time, start countdown
    if (now >= lobby.scheduledTime) {
      lobby.status = "countdown";
      return "countdown";
    }
  }

  return "waiting";
}

// ── Premium Race Prize Calculation ─────────────────────────────────────

export interface PremiumPrizeBreakdown {
  first: number;
  second: number;
  third: number;
  treasury: number; // goes to season prize pool
  totalPool: number;
}

export function calculatePremiumPrizes(prizePool: number): PremiumPrizeBreakdown {
  return {
    first: Math.floor(prizePool * 0.40),
    second: Math.floor(prizePool * 0.15),
    third: Math.floor(prizePool * 0.10),
    treasury: Math.floor(prizePool * 0.35),
    totalPool: prizePool,
  };
}

// ── Helpers ────────────────────────────────────────────────────────────

export function getUserEntryCount(lobby: RaceLobby, userId: string): number {
  return lobby.entries.filter((e) => e.userId === userId).length;
}

export function getTimeUntilDeadline(lobby: RaceLobby, now: number = Date.now()): number {
  return Math.max(0, lobby.deadlineTime - now);
}

export function getNextLobbyScheduledTime(now: number = Date.now()): number {
  const msIntoDay = now % (24 * 60 * 60 * 1000);
  const raceSlot = Math.ceil(msIntoDay / RACE_INTERVAL_MS) * RACE_INTERVAL_MS;
  const startOfDay = now - msIntoDay;
  return startOfDay + raceSlot;
}

export function getLobbySchedule(count: number, from: number = Date.now()): number[] {
  const schedule: number[] = [];
  let next = getNextLobbyScheduledTime(from);
  for (let i = 0; i < count; i++) {
    schedule.push(next);
    next += RACE_INTERVAL_MS;
  }
  return schedule;
}

export { MIN_ENTRIES, MIN_ENTRIES_EXTENDED, MAX_PER_USER, COUNTDOWN_DURATION_MS, EXTENSION_MS };
