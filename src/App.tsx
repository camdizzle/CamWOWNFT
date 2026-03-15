import { useState, useCallback, useEffect, useRef } from "react";
import type { SeasonEntry, RaceResult, BattleResult } from "./types/nft";
import { SAMPLE_COLLECTION } from "./data/sampleCollection";
import { useAuth } from "./hooks/useAuth";
import { useProgression } from "./hooks/useProgression";
import { useEconomy } from "./hooks/useEconomy";
import { AuthBar } from "./components/AuthBar";
import { Onboarding } from "./components/Onboarding";
import { CollectionPage } from "./pages/CollectionPage";
import { RacePage } from "./pages/RacePage";
import { BattlePage } from "./pages/BattlePage";
import { LeaderboardPage } from "./pages/LeaderboardPage";
import { ShopPage } from "./pages/ShopPage";
import "./App.css";

type Page = "collection" | "race" | "battle" | "leaderboard" | "shop";

function initLeaderboard(): SeasonEntry[] {
  return SAMPLE_COLLECTION.map((c) => ({
    characterId: c.id,
    points: 0,
    wins: 0,
    races: 0,
    battles: 0,
    battleWins: 0,
  }));
}

function App() {
  const [page, setPage] = useState<Page>("collection");
  const [leaderboard, setLeaderboard] = useState<SeasonEntry[]>(initLeaderboard);
  const auth = useAuth();
  const progression = useProgression();
  const economy = useEconomy();

  // Track the last user ID we loaded data for, to avoid re-loading
  const lastLoadedUserId = useRef<string | null>(null);

  // ── Load server data when user logs in ──────────────────────────
  useEffect(() => {
    const uid = auth.user?.twitchUser?.id;
    if (!uid || uid === lastLoadedUserId.current) return;
    lastLoadedUserId.current = uid;

    // Load economy data from server
    economy.loadFromServer(uid);

    // Load progression data for owned NFTs
    const ownedIds = auth.user?.ownedNftIds ?? [];
    if (ownedIds.length > 0) {
      progression.loadFromServer(ownedIds);
    }
  }, [auth.user?.twitchUser?.id, auth.user?.ownedNftIds]);

  const handleRaceResults = useCallback((results: RaceResult[]) => {
    setLeaderboard((prev) => {
      const next = [...prev];
      for (const result of results) {
        const entry = next.find((e) => e.characterId === result.characterId);
        if (entry) {
          entry.points += result.pointsEarned;
          entry.races += 1;
          if (result.placement === 1) entry.wins += 1;
        }
      }
      return next;
    });
  }, []);

  const handleBattleResult = useCallback((result: BattleResult) => {
    setLeaderboard((prev) => {
      const next = [...prev];
      const winner = next.find((e) => e.characterId === result.winnerId);
      const loser = next.find((e) => e.characterId === result.loserId);
      if (winner) {
        winner.points += 50;
        winner.battles += 1;
        winner.battleWins += 1;
      }
      if (loser) {
        loser.points += 10;
        loser.battles += 1;
      }
      return next;
    });
  }, []);

  // ── Onboarding gate: logged in but no wallet? ───────────────────
  if (auth.needsWallet) {
    return (
      <div className="app">
        <Onboarding auth={auth} />
      </div>
    );
  }

  return (
    <div className="app">
      <nav className="top-nav">
        <div className="nav-brand">
          <span className="brand-icon">🎮</span>
          <span className="brand-text">CamWOW Arena</span>
        </div>
        <div className="nav-links">
          <button
            className={`nav-link ${page === "collection" ? "active" : ""}`}
            onClick={() => setPage("collection")}
          >
            🎨 Collection
          </button>
          <button
            className={`nav-link ${page === "race" ? "active" : ""}`}
            onClick={() => setPage("race")}
          >
            🏁 Race
          </button>
          <button
            className={`nav-link ${page === "battle" ? "active" : ""}`}
            onClick={() => setPage("battle")}
          >
            ⚔️ Battle
          </button>
          <button
            className={`nav-link ${page === "leaderboard" ? "active" : ""}`}
            onClick={() => setPage("leaderboard")}
          >
            🏆 Leaderboard
          </button>
          <button
            className={`nav-link ${page === "shop" ? "active" : ""}`}
            onClick={() => setPage("shop")}
          >
            🛒 Shop
          </button>
        </div>
        {auth.isLoggedIn && (
          <div className="nav-coins">
            <span className="coin-icon">🪙</span>
            <span className="coin-amount">{economy.coins}</span>
          </div>
        )}
        <AuthBar auth={auth} />
      </nav>

      <main className="main-content">
        {page === "collection" && (
          <CollectionPage
            characters={SAMPLE_COLLECTION}
            auth={auth}
            progression={progression}
          />
        )}
        {page === "race" && (
          <RacePage
            characters={SAMPLE_COLLECTION}
            auth={auth}
            progression={progression}
            economy={economy}
            onUpdateLeaderboard={handleRaceResults}
          />
        )}
        {page === "battle" && (
          <BattlePage
            characters={SAMPLE_COLLECTION}
            onBattleComplete={handleBattleResult}
          />
        )}
        {page === "leaderboard" && (
          <LeaderboardPage characters={SAMPLE_COLLECTION} leaderboard={leaderboard} />
        )}
        {page === "shop" && <ShopPage economy={economy} />}
      </main>

      <footer className="app-footer">
        <span>CamWOW Series 1 | LaunchMyNFT</span>
        <span>Season 1 Active</span>
      </footer>
    </div>
  );
}

export default App;
