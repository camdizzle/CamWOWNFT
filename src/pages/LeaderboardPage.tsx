import type { NFTCharacter, SeasonEntry } from "../types/nft";
import { Leaderboard } from "../components/Leaderboard";

interface LeaderboardPageProps {
  characters: NFTCharacter[];
  leaderboard: SeasonEntry[];
}

export function LeaderboardPage({ characters, leaderboard }: LeaderboardPageProps) {
  return (
    <div className="page leaderboard-page">
      <div className="page-header">
        <h1>🏆 Season 1 Leaderboard</h1>
        <p className="subtitle">
          CamWOW Series 1 — Rankings updated after each race and battle
        </p>
      </div>
      <Leaderboard entries={leaderboard} characters={characters} />
    </div>
  );
}
