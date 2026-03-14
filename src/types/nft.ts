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
