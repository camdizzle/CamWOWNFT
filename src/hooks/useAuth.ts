import { useState, useCallback, useEffect } from "react";
import type { TwitchUser, WalletConnection, UserAccount } from "../types/nft";
import { authApi, walletApi } from "../api/client";

// ── Twitch OAuth Flow ──────────────────────────────────────────────────
// In production, replace with real Twitch OAuth2 implicit grant flow.
// Client ID would come from your Twitch developer application.

const TWITCH_CLIENT_ID = "YOUR_TWITCH_CLIENT_ID"; // Replace with real value
const TWITCH_REDIRECT_URI = typeof window !== "undefined"
  ? `${window.location.origin}/auth/twitch/callback`
  : "";

export function getTwitchAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: TWITCH_CLIENT_ID,
    redirect_uri: TWITCH_REDIRECT_URI,
    response_type: "token",
    scope: "user:read:email",
  });
  return `https://id.twitch.tv/oauth2/authorize?${params.toString()}`;
}

// ── Local cache helpers ────────────────────────────────────────────────

const CACHE_KEY = "camwow_user";

function cacheUser(account: UserAccount | null) {
  if (account) {
    localStorage.setItem(CACHE_KEY, JSON.stringify(account));
  } else {
    localStorage.removeItem(CACHE_KEY);
  }
}

function loadCachedUser(): UserAccount | null {
  const saved = localStorage.getItem(CACHE_KEY);
  if (saved) {
    try { return JSON.parse(saved); } catch { return null; }
  }
  return null;
}

// ── Demo/Mock Auth ─────────────────────────────────────────────────────
// For local development — simulates login with mock users

const MOCK_USERS: TwitchUser[] = [
  {
    id: "twitch-001",
    login: "camdizzle",
    displayName: "CamDizzle",
    profileImageUrl: "",
  },
  {
    id: "twitch-002",
    login: "player2",
    displayName: "Player2",
    profileImageUrl: "",
  },
  {
    id: "twitch-003",
    login: "nftcollector",
    displayName: "NFTCollector",
    profileImageUrl: "",
  },
];

// ── Auth Hook ──────────────────────────────────────────────────────────

export interface AuthState {
  user: UserAccount | null;
  isLoggedIn: boolean;
  needsWallet: boolean; // true when logged in but no wallets connected
  loading: boolean;
  loginWithTwitch: () => void;
  loginMock: (mockIndex?: number) => void;
  logout: () => void;
  addWallet: (wallet: WalletConnection) => Promise<void>;
  removeWallet: (address: string) => Promise<void>;
  setOwnedNfts: (nftIds: string[]) => void;
  refreshUser: () => Promise<void>;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<UserAccount | null>(loadCachedUser);
  const [loading, setLoading] = useState(false);

  // Determine if user needs wallet onboarding
  const needsWallet = user !== null && user.wallets.length === 0;

  // ── Server sync: load user data from server on mount if cached ────
  useEffect(() => {
    const cached = loadCachedUser();
    if (cached?.twitchUser?.id) {
      // Silently refresh from server to get latest data
      authApi.getUser(cached.twitchUser.id)
        .then((serverUser) => {
          const account: UserAccount = {
            twitchUser: serverUser.twitchUser,
            wallets: serverUser.wallets,
            ownedNftIds: serverUser.ownedNftIds,
          };
          setUser(account);
          cacheUser(account);
        })
        .catch(() => {
          // Server unreachable — use cache, which is fine
        });
    }
  }, []);

  const persist = useCallback((account: UserAccount | null) => {
    cacheUser(account);
    setUser(account);
  }, []);

  const loginWithTwitch = useCallback(() => {
    window.location.href = getTwitchAuthUrl();
  }, []);

  // ── Mock login: calls server to upsert, then loads full user ──────
  const loginMock = useCallback(async (mockIndex: number = 0) => {
    const twitchUser = MOCK_USERS[mockIndex % MOCK_USERS.length];
    setLoading(true);
    try {
      // Call server to upsert and get full account
      const response = await authApi.login(twitchUser);
      const account: UserAccount = {
        twitchUser: response.user.twitchUser,
        wallets: response.user.wallets ?? [],
        ownedNftIds: response.user.ownedNftIds ?? [],
      };
      persist(account);
    } catch {
      // Server unreachable — fall back to local-only mock
      const account: UserAccount = {
        twitchUser,
        wallets: [],
        ownedNftIds: [],
      };
      persist(account);
    } finally {
      setLoading(false);
    }
  }, [persist]);

  const logout = useCallback(() => {
    persist(null);
  }, [persist]);

  // ── Wallet management — server-first with local cache update ──────

  const addWallet = useCallback(async (wallet: WalletConnection) => {
    if (!user) return;
    // Optimistic local update
    const updated = {
      ...user,
      wallets: user.wallets.some((w) => w.address === wallet.address)
        ? user.wallets
        : [...user.wallets, wallet],
    };
    persist(updated);

    try {
      await walletApi.add(user.twitchUser.id, wallet.address, wallet.label);
      // Refresh full user from server to get updated NFT ownership
      const serverUser = await authApi.getUser(user.twitchUser.id);
      const synced: UserAccount = {
        twitchUser: serverUser.twitchUser,
        wallets: serverUser.wallets,
        ownedNftIds: serverUser.ownedNftIds,
      };
      persist(synced);
    } catch {
      // Server unreachable — keep optimistic update cached
    }
  }, [user, persist]);

  const removeWallet = useCallback(async (address: string) => {
    if (!user) return;
    const updated = {
      ...user,
      wallets: user.wallets.filter((w) => w.address !== address),
    };
    persist(updated);

    try {
      await walletApi.remove(address, user.twitchUser.id);
      const serverUser = await authApi.getUser(user.twitchUser.id);
      const synced: UserAccount = {
        twitchUser: serverUser.twitchUser,
        wallets: serverUser.wallets,
        ownedNftIds: serverUser.ownedNftIds,
      };
      persist(synced);
    } catch {
      // Server unreachable — keep optimistic update cached
    }
  }, [user, persist]);

  const setOwnedNfts = useCallback((nftIds: string[]) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ownedNftIds: nftIds };
      cacheUser(updated);
      return updated;
    });
  }, []);

  const refreshUser = useCallback(async () => {
    if (!user?.twitchUser?.id) return;
    setLoading(true);
    try {
      const serverUser = await authApi.getUser(user.twitchUser.id);
      const account: UserAccount = {
        twitchUser: serverUser.twitchUser,
        wallets: serverUser.wallets,
        ownedNftIds: serverUser.ownedNftIds,
      };
      persist(account);
    } catch {
      // Server unreachable — keep cached data
    } finally {
      setLoading(false);
    }
  }, [user, persist]);

  return {
    user,
    isLoggedIn: user !== null,
    needsWallet,
    loading,
    loginWithTwitch,
    loginMock,
    logout,
    addWallet,
    removeWallet,
    setOwnedNfts,
    refreshUser,
  };
}
