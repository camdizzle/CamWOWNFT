import type { RaceLobby, LobbyStatus } from "../types/nft";

// ── Race Lobby Engine ──────────────────────────────────────────────────
// Races scheduled every 4 hours. Minimum 6 entries to start.
// If < 6 at scheduled time, timer extends in 15-min increments.
// Max 2 NFTs per Twitch user per race. Max 16 entries per race.

const RACE_INTERVAL_MS = 4 * 60 * 60 * 1000; // 4 hours
const EXTENSION_MS = 15 * 60 * 1000; // 15-min extensions
const MAX_EXTENSIONS = 8; // max 2 hours of extensions before cancellation
const MIN_ENTRIES = 6;
const MAX_ENTRIES = 16;
const MAX_PER_USER = 2;
const COUNTDOWN_DURATION_MS = 30 * 1000; // 30-second countdown once min met

export function createLobby(scheduledTime: number): RaceLobby {
  return {
    id: `lobby-${scheduledTime}`,
    scheduledTime,
    deadlineTime: scheduledTime,
    status: "waiting",
    entries: [],
    minEntries: MIN_ENTRIES,
    maxEntries: MAX_ENTRIES,
    maxPerUser: MAX_PER_USER,
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

  if (lobby.entries.length >= lobby.maxEntries) {
    return { ok: false, reason: `Race is full (${lobby.maxEntries} max).` };
  }

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

  return { ok: true };
}

// ── Leave Lobby ────────────────────────────────────────────────────────

export function leaveLobby(lobby: RaceLobby, characterId: string): boolean {
  if (lobby.status !== "waiting") return false;
  const idx = lobby.entries.findIndex((e) => e.characterId === characterId);
  if (idx === -1) return false;
  lobby.entries.splice(idx, 1);
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
      // Enough racers — start countdown (or go straight to racing)
      lobby.status = "countdown";
      return "countdown";
    }

    // Not enough racers — extend or give up
    const extensions = Math.floor(
      (lobby.deadlineTime - lobby.scheduledTime) / EXTENSION_MS
    );
    if (extensions < MAX_EXTENSIONS) {
      lobby.deadlineTime += EXTENSION_MS;
      return "waiting"; // extended, keep waiting
    }

    // Max extensions reached — cancel this race
    lobby.status = "finished";
    return "finished";
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

export { MIN_ENTRIES, MAX_ENTRIES, MAX_PER_USER, COUNTDOWN_DURATION_MS, EXTENSION_MS };
