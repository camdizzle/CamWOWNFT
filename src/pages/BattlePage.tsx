import { useState } from "react";
import type { NFTCharacter, BattleResult } from "../types/nft";
import { CharacterCard } from "../components/CharacterCard";
import { BattleArena } from "../components/BattleArena";

interface BattlePageProps {
  characters: NFTCharacter[];
  onBattleComplete: (result: BattleResult) => void;
}

export function BattlePage({ characters, onBattleComplete }: BattlePageProps) {
  const [challenger, setChallenger] = useState<NFTCharacter | null>(null);
  const [opponent, setOpponent] = useState<NFTCharacter | null>(null);
  const [phase, setPhase] = useState<"pick-challenger" | "pick-opponent" | "battle">(
    "pick-challenger"
  );

  function selectChallenger(char: NFTCharacter) {
    setChallenger(char);
    setPhase("pick-opponent");
  }

  function selectOpponent(char: NFTCharacter) {
    setOpponent(char);
    setPhase("battle");
  }

  function reset() {
    setChallenger(null);
    setOpponent(null);
    setPhase("pick-challenger");
  }

  return (
    <div className="page battle-page">
      <div className="page-header">
        <h1>⚔️ VS Battle</h1>
        <p className="subtitle">
          {phase === "pick-challenger"
            ? "Select your challenger"
            : phase === "pick-opponent"
              ? "Now pick an opponent"
              : "Fight!"}
        </p>
        {phase !== "pick-challenger" && (
          <button className="btn btn-secondary" onClick={reset}>
            ← Start Over
          </button>
        )}
      </div>

      {phase === "battle" && challenger && opponent ? (
        <BattleArena
          challenger={challenger}
          opponent={opponent}
          onBattleComplete={onBattleComplete}
        />
      ) : (
        <div className="character-grid">
          {characters
            .filter((c) => (phase === "pick-opponent" ? c.id !== challenger?.id : true))
            .map((char) => (
              <CharacterCard
                key={char.id}
                character={char}
                selected={char.id === challenger?.id}
                onClick={() =>
                  phase === "pick-challenger"
                    ? selectChallenger(char)
                    : selectOpponent(char)
                }
              />
            ))}
        </div>
      )}
    </div>
  );
}
