// ── Core NFT & Stat Types ──────────────────────────────────────────────

export interface Stats {
  speed: number;
  toughness: number;
  charisma: number;
  luck: number;
  stamina: number;
  agility: number;
}

export type StatKey = keyof Stats;

export const STAT_KEYS: StatKey[] = [
  "speed",
  "toughness",
  "charisma",
  "luck",
  "stamina",
  "agility",
];

export interface NFTTrait {
  trait_type: string;
  value: string;
}

export interface NFTCharacter {
  id: string;
  name: string;
  image: string;
  traits: NFTTrait[];
  stats: Stats;
  totalPower: number;
}

// ── Race Types ─────────────────────────────────────────────────────────

export type RaceStatus = "upcoming" | "in_progress" | "finished";

export interface RaceEntry {
  characterId: string;
  position: number; // 0-100 progress
  finishTime?: number;
  placement?: number;
}

export interface Race {
  id: string;
  name: string;
  status: RaceStatus;
  startTime: number; // epoch ms
  entries: RaceEntry[];
  results?: RaceResult[];
}

export interface RaceResult {
  characterId: string;
  placement: number;
  timeMs: number;
  pointsEarned: number;
}

// ── Battle Types ───────────────────────────────────────────────────────

export interface BattleAction {
  round: number;
  attackerId: string;
  defenderId: string;
  damage: number;
  critical: boolean;
  description: string;
}

export interface BattleResult {
  winnerId: string;
  loserId: string;
  rounds: BattleAction[];
  totalRounds: number;
}

export interface Battle {
  id: string;
  challenger: NFTCharacter;
  opponent: NFTCharacter;
  result?: BattleResult;
  timestamp: number;
}

// ── Auth & Wallet Types ────────────────────────────────────────────────

export interface TwitchUser {
  id: string;
  login: string;
  displayName: string;
  profileImageUrl: string;
}

export interface WalletConnection {
  address: string;
  label?: string; // user-friendly name like "Main Wallet"
}

export interface UserAccount {
  twitchUser: TwitchUser;
  wallets: WalletConnection[];
  ownedNftIds: string[]; // aggregated across all wallets
}

// ── Race Mode & Lobby Types ────────────────────────────────────────────

export type RaceMode = "free" | "premium";
export type LobbyStatus = "waiting" | "countdown" | "racing" | "finished";

export interface LobbyEntry {
  characterId: string;
  userId: string; // twitch user ID — for enforcing per-user limits
  readyAt: number;
}

export interface RaceLobby {
  id: string;
  scheduledTime: number; // the original 4-hour slot
  deadlineTime: number; // extends if < 6 racers
  status: LobbyStatus;
  entries: LobbyEntry[];
  minEntries: number; // 6 (normal), 3 (after extensions)
  maxPerUser: number; // 2
  mode: RaceMode; // "free" or "premium"
  entryFeePBP: number; // 0 for free, 50 for premium
  prizePool: number; // accumulated PBP from entry fees
}

// ── Premium Race Economy ──────────────────────────────────────────────

export const TREASURY_WALLET = "HtPe6EYLgmT3UzyZeBCLg5vX5JjsxpoggtXkRYYx6oN5";
export const PREMIUM_ENTRY_FEE_PBP = 50;

// Prize distribution for premium races (% of total prize pool)
export const PREMIUM_PRIZE_SPLIT = {
  first: 0.40,  // 40% to 1st place
  second: 0.15, // 15% to 2nd place
  third: 0.10,  // 10% to 3rd place
  treasury: 0.35, // 35% stays in treasury → season prize pool
} as const;

export interface SeasonPrizePool {
  seasonId: string;
  totalPBP: number; // accumulated from 35% of premium race fees
  totalRaces: number; // how many premium races contributed
}

export interface PremiumRaceResult {
  characterId: string;
  userId: string;
  placement: number;
  pbpPrize: number; // PBP won from the pool
}

// ── Season & Leaderboard ───────────────────────────────────────────────

export interface SeasonEntry {
  characterId: string;
  points: number;
  wins: number;
  races: number;
  battles: number;
  battleWins: number;
}

export interface Season {
  id: string;
  name: string;
  startDate: number;
  endDate: number;
  leaderboard: SeasonEntry[];
  isActive: boolean;
}
