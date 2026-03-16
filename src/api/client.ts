// ── API Client ─────────────────────────────────────────────────────────
// Connects frontend to the Express + MySQL backend.
// Falls back gracefully to localStorage when API is unreachable.

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `API error: ${res.status}`);
  }

  return res.json();
}

// ── Auth ───────────────────────────────────────────────────────────────

export const authApi = {
  login: (twitchUser: { id: string; login: string; displayName: string; profileImageUrl: string }) =>
    apiFetch<{ user: any }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(twitchUser),
    }),

  getUser: (userId: string) =>
    apiFetch<any>(`/auth/user/${userId}`),
};

// ── Wallets ────────────────────────────────────────────────────────────

export const walletApi = {
  add: (userId: string, address: string, label?: string) =>
    apiFetch<{ message: string }>("/wallets", {
      method: "POST",
      body: JSON.stringify({ userId, address, label }),
    }),

  remove: (address: string, userId: string) =>
    apiFetch<{ message: string }>(`/wallets/${address}`, {
      method: "DELETE",
      body: JSON.stringify({ userId }),
    }),

  list: (userId: string) =>
    apiFetch<any[]>(`/wallets/user/${userId}`),
};

// ── NFTs ───────────────────────────────────────────────────────────────

export const nftApi = {
  getAll: () => apiFetch<any[]>("/nfts"),
  getByUser: (userId: string) => apiFetch<any[]>(`/nfts/user/${userId}`),
};

// ── Progression ────────────────────────────────────────────────────────

export const progressionApi = {
  get: (nftId: string) =>
    apiFetch<{ nftId: string; statProgress: any }>(`/progression/${nftId}`),

  getBatch: (nftIds: string[]) =>
    apiFetch<Record<string, any>>("/progression/batch", {
      method: "POST",
      body: JSON.stringify({ nftIds }),
    }),

  update: (nftId: string, statProgress: any) =>
    apiFetch<{ message: string }>(`/progression/${nftId}`, {
      method: "PUT",
      body: JSON.stringify({ statProgress }),
    }),
};

// ── Races ──────────────────────────────────────────────────────────────

export const raceApi = {
  getCurrentLobby: () => apiFetch<any | null>("/races/lobby/current"),

  joinLobby: (userId: string, characterId: string, raceId: number, mode?: string) =>
    apiFetch<{ message: string; entryFeePaid?: number }>("/races/lobby/join", {
      method: "POST",
      body: JSON.stringify({ userId, characterId, raceId, mode }),
    }),

  leaveLobby: (userId: string, characterId: string, raceId: number, mode?: string) =>
    apiFetch<{ message: string }>("/races/lobby/leave", {
      method: "POST",
      body: JSON.stringify({ userId, characterId, raceId, mode }),
    }),

  saveResults: (raceId: number, results: any[], mode?: string, prizePool?: number) =>
    apiFetch<{ message: string; premiumPrizes?: Record<number, number> }>("/races/results", {
      method: "POST",
      body: JSON.stringify({ raceId, results, mode, prizePool }),
    }),

  getSeasonPool: () =>
    apiFetch<{ seasonId: number; seasonName: string; totalPBP: number; totalRaces: number; treasuryWallet: string }>("/races/season-pool"),

  getHistory: (limit?: number) =>
    apiFetch<any[]>(`/races/history?limit=${limit || 20}`),

  getLeaderboard: () => apiFetch<any[]>("/races/leaderboard"),
};

// ── Economy ─────────────────────────────────────────────────────────────

export const economyApi = {
  get: (userId: string) =>
    apiFetch<any>(`/economy/${userId}`),

  addCoins: (userId: string, amount: number) =>
    apiFetch<{ message: string }>(`/economy/${userId}/coins/add`, {
      method: "POST",
      body: JSON.stringify({ amount }),
    }),

  buyBuff: (userId: string, buffId: string, cost: number) =>
    apiFetch<{ message: string }>(`/economy/${userId}/buffs/buy`, {
      method: "POST",
      body: JSON.stringify({ buffId, cost }),
    }),

  buyBuffWithSol: (userId: string, buffId: string, solPrice: number, txSignature?: string) =>
    apiFetch<{ message: string; treasuryWallet: string }>(`/economy/${userId}/buffs/buy-sol`, {
      method: "POST",
      body: JSON.stringify({ buffId, solPrice, txSignature }),
    }),

  consumeBuff: (userId: string, buffId: string) =>
    apiFetch<{ message: string }>(`/economy/${userId}/buffs/consume`, {
      method: "POST",
      body: JSON.stringify({ buffId }),
    }),

  unlockAchievement: (userId: string, achievementId: string, coinReward: number) =>
    apiFetch<{ message: string }>(`/economy/${userId}/achievements/unlock`, {
      method: "POST",
      body: JSON.stringify({ achievementId, coinReward }),
    }),

  updateStats: (userId: string, stats: any) =>
    apiFetch<{ message: string }>(`/economy/${userId}/stats`, {
      method: "POST",
      body: JSON.stringify(stats),
    }),
};
