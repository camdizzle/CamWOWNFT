import type { NFTCharacter, RaceResult, RaceMode } from "../types/nft";
import type { AuthState } from "../hooks/useAuth";
import type { UseProgressionResult } from "../hooks/useProgression";
import type { UseEconomyResult } from "../hooks/useEconomy";
import { RaceLobbyComponent } from "../components/RaceLobby";

interface RacePageProps {
  characters: NFTCharacter[];
  auth: AuthState;
  progression: UseProgressionResult;
  economy: UseEconomyResult;
  onUpdateLeaderboard: (results: RaceResult[]) => void;
}

export function RacePage({ characters, auth, progression, economy, onUpdateLeaderboard }: RacePageProps) {
  // Apply progression to get effective characters for racing
  const effectiveCharacters = characters.map((c) => progression.getEffectiveCharacter(c));

  function handleRaceComplete(results: RaceResult[], _racerIds: string[], _mode: RaceMode) {
    // Apply stat progression for each racer
    for (const result of results) {
      const baseChar = characters.find((c) => c.id === result.characterId);
      if (baseChar) {
        const gains = progression.applyRaceResult(
          result.characterId,
          baseChar.stats,
          result.placement
        );
        if (gains.some((g) => g.leveledUp)) {
          console.log(
            `${baseChar.name} leveled up!`,
            gains.filter((g) => g.leveledUp)
          );
        }
      }
    }

    // Process coin rewards for the user's entries (both free and premium earn coins)
    const ownedIds = new Set(auth.user?.ownedNftIds ?? []);
    for (const result of results) {
      if (ownedIds.has(result.characterId)) {
        const reward = economy.processRaceReward(result.placement);
        if (reward.newAchievements.length > 0) {
          console.log(
            "New achievements!",
            reward.newAchievements.map((a) => a.achievement.name)
          );
        }
      }
    }

    onUpdateLeaderboard(results);
  }

  return (
    <div className="page race-page">
      <div className="page-header">
        <h1>Marble Racing League</h1>
        <p className="subtitle">
          Free races earn coins | Premium races cost 50 PBP with prize pool payouts
        </p>
      </div>

      <RaceLobbyComponent
        characters={effectiveCharacters}
        auth={auth}
        economy={economy}
        onRaceComplete={handleRaceComplete}
      />
    </div>
  );
}
