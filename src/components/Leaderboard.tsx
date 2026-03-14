import type { NFTCharacter, SeasonEntry } from "../types/nft";

interface LeaderboardProps {
  entries: SeasonEntry[];
  characters: NFTCharacter[];
  title?: string;
}

export function Leaderboard({
  entries,
  characters,
  title = "Season Leaderboard",
}: LeaderboardProps) {
  const charMap = new Map(characters.map((c) => [c.id, c]));
  const sorted = [...entries].sort((a, b) => b.points - a.points);

  return (
    <div className="leaderboard">
      <h2>🏆 {title}</h2>
      <div className="leaderboard-table">
        <div className="lb-header">
          <span className="lb-rank">#</span>
          <span className="lb-name">Character</span>
          <span className="lb-points">Points</span>
          <span className="lb-races">Races</span>
          <span className="lb-wins">Race Wins</span>
          <span className="lb-battles">Battles</span>
          <span className="lb-bwins">Battle W</span>
        </div>
        {sorted.map((entry, idx) => {
          const char = charMap.get(entry.characterId);
          return (
            <div
              key={entry.characterId}
              className={`lb-row ${idx < 3 ? `top-${idx + 1}` : ""}`}
            >
              <span className="lb-rank">
                {idx === 0
                  ? "🥇"
                  : idx === 1
                    ? "🥈"
                    : idx === 2
                      ? "🥉"
                      : idx + 1}
              </span>
              <span className="lb-name">
                {char?.name.split("—")[1] || char?.name || entry.characterId}
              </span>
              <span className="lb-points">{entry.points}</span>
              <span className="lb-races">{entry.races}</span>
              <span className="lb-wins">{entry.wins}</span>
              <span className="lb-battles">{entry.battles}</span>
              <span className="lb-bwins">{entry.battleWins}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
