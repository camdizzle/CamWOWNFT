import { useState } from "react";
import type { NFTCharacter } from "../types/nft";
import type { AuthState } from "../hooks/useAuth";
import type { UseProgressionResult } from "../hooks/useProgression";
import { CharacterCard } from "../components/CharacterCard";
import { WalletManager } from "../components/WalletManager";

interface CollectionPageProps {
  characters: NFTCharacter[];
  auth: AuthState;
  progression: UseProgressionResult;
}

export function CollectionPage({ characters, auth, progression }: CollectionPageProps) {
  const [filter, setFilter] = useState<"all" | "owned">("all");

  const ownedIds = new Set(auth.user?.ownedNftIds ?? []);
  const displayChars = filter === "owned"
    ? characters.filter((c) => ownedIds.has(c.id))
    : characters;

  // Apply progression for display
  const effectiveChars = displayChars.map((c) => progression.getEffectiveCharacter(c));

  return (
    <div className="page collection-page">
      <div className="page-header">
        <h1>🎨 CamWOW Collection</h1>
        <p className="subtitle">
          {characters.length} characters total
          {auth.isLoggedIn && ` — You own ${ownedIds.size}`}
        </p>
      </div>

      {auth.isLoggedIn && (
        <>
          <WalletManager auth={auth} />

          <div className="filter-bar">
            <button
              className={`btn btn-sm ${filter === "all" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setFilter("all")}
            >
              All NFTs
            </button>
            <button
              className={`btn btn-sm ${filter === "owned" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setFilter("owned")}
            >
              My NFTs ({ownedIds.size})
            </button>
          </div>
        </>
      )}

      <div className="character-grid">
        {effectiveChars.map((char) => (
          <CharacterCard
            key={char.id}
            character={char}
            progression={progression.getProgression(char.id)}
            showProgression={auth.isLoggedIn && ownedIds.has(char.id)}
          />
        ))}
      </div>
    </div>
  );
}
