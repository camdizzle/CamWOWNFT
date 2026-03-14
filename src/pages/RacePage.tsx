import type { NFTCharacter, RaceResult } from "../types/nft";
import type { AuthState } from "../hooks/useAuth";
import type { UseProgressionResult } from "../hooks/useProgression";
import { RaceLobbyComponent } from "../components/RaceLobby";

interface RacePageProps {
  characters: NFTCharacter[];
  auth: AuthState;
  progression: UseProgressionResult;
  onUpdateLeaderboard: (results: RaceResult[]) => void;
}

export function RacePage({ characters, auth, progression, onUpdateLeaderboard }: RacePageProps) {
  // Apply progression to get effective characters for racing
  const effectiveCharacters = characters.map((c) => progression.getEffectiveCharacter(c));

  function handleRaceComplete(results: RaceResult[], _racerIds: string[]) {
    // Apply stat progression for each racer
    for (const result of results) {
      const baseChar = characters.find((c) => c.id === result.characterId);
      if (baseChar) {
        const gains = progression.applyRaceResult(
          result.characterId,
          baseChar.stats, // use BASE stats, not effective
          result.placement
        );
        // Could show a toast/notification for level-ups here
        if (gains.some((g) => g.leveledUp)) {
          console.log(
            `${baseChar.name} leveled up!`,
            gains.filter((g) => g.leveledUp)
          );
        }
      }
    }

    onUpdateLeaderboard(results);
  }

  return (
    <div className="page race-page">
      <div className="page-header">
        <h1>🏁 Marble Racing League</h1>
        <p className="subtitle">
          Races every 4 hours — minimum 6 racers to start — max 2 NFTs per user
        </p>
      </div>

      <RaceLobbyComponent
        characters={effectiveCharacters}
        auth={auth}
        onRaceComplete={handleRaceComplete}
      />
    </div>
  );
}
