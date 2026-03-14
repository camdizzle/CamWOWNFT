import { useState, useCallback } from "react";
import type { SeasonEntry, RaceResult, BattleResult } from "./types/nft";
import { SAMPLE_COLLECTION } from "./data/sampleCollection";
import { useAuth } from "./hooks/useAuth";
import { useProgression } from "./hooks/useProgression";
import { AuthBar } from "./components/AuthBar";
import { CollectionPage } from "./pages/CollectionPage";
import { RacePage } from "./pages/RacePage";
import { BattlePage } from "./pages/BattlePage";
import { LeaderboardPage } from "./pages/LeaderboardPage";
import "./App.css";

type Page = "collection" | "race" | "battle" | "leaderboard";

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
        </div>
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
      </main>

      <footer className="app-footer">
        <span>CamWOW Series 1 | LaunchMyNFT</span>
        <span>Season 1 Active</span>
      </footer>
    </div>
  );
}

export default App;
