import { useState, useCallback } from "react";
import type { TwitchUser, WalletConnection, UserAccount } from "../types/nft";

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
  loginWithTwitch: () => void;
  loginMock: (mockIndex?: number) => void;
  logout: () => void;
  addWallet: (wallet: WalletConnection) => void;
  removeWallet: (address: string) => void;
  setOwnedNfts: (nftIds: string[]) => void;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<UserAccount | null>(() => {
    // Restore from localStorage if available
    const saved = localStorage.getItem("camwow_user");
    if (saved) {
      try { return JSON.parse(saved); } catch { return null; }
    }
    return null;
  });

  const persist = useCallback((account: UserAccount | null) => {
    if (account) {
      localStorage.setItem("camwow_user", JSON.stringify(account));
    } else {
      localStorage.removeItem("camwow_user");
    }
    setUser(account);
  }, []);

  const loginWithTwitch = useCallback(() => {
    // In production: redirect to Twitch OAuth
    // For now, uses mock
    window.location.href = getTwitchAuthUrl();
  }, []);

  const loginMock = useCallback((mockIndex: number = 0) => {
    const twitchUser = MOCK_USERS[mockIndex % MOCK_USERS.length];
    const account: UserAccount = {
      twitchUser,
      wallets: [
        // Start with a demo wallet
        {
          address: `demo-wallet-${twitchUser.id}`,
          label: "Demo Wallet",
        },
      ],
      // In demo mode, assign some NFTs based on the user
      ownedNftIds: mockIndex === 0
        ? ["cam-001", "cam-002", "cam-003", "cam-004"]
        : mockIndex === 1
          ? ["cam-005", "cam-006"]
          : ["cam-007", "cam-008"],
    };
    persist(account);
  }, [persist]);

  const logout = useCallback(() => {
    persist(null);
  }, [persist]);

  const addWallet = useCallback((wallet: WalletConnection) => {
    setUser((prev) => {
      if (!prev) return prev;
      // Don't add duplicate addresses
      if (prev.wallets.some((w) => w.address === wallet.address)) return prev;
      const updated = {
        ...prev,
        wallets: [...prev.wallets, wallet],
      };
      localStorage.setItem("camwow_user", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removeWallet = useCallback((address: string) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        wallets: prev.wallets.filter((w) => w.address !== address),
      };
      localStorage.setItem("camwow_user", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const setOwnedNfts = useCallback((nftIds: string[]) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ownedNftIds: nftIds };
      localStorage.setItem("camwow_user", JSON.stringify(updated));
      return updated;
    });
  }, []);

  return {
    user,
    isLoggedIn: user !== null,
    loginWithTwitch,
    loginMock,
    logout,
    addWallet,
    removeWallet,
    setOwnedNfts,
  };
}
