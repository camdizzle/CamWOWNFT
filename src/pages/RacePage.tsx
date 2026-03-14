import { useState } from "react";
import type { NFTCharacter, RaceResult } from "../types/nft";
import { CharacterCard } from "../components/CharacterCard";
import { RaceTrack } from "../components/RaceTrack";
import { RaceSchedule } from "../components/RaceSchedule";

interface RacePageProps {
  characters: NFTCharacter[];
  onUpdateLeaderboard: (results: RaceResult[]) => void;
}

export function RacePage({ characters, onUpdateLeaderboard }: RacePageProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showRace, setShowRace] = useState(false);

  function toggleSelection(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < 8) {
        next.add(id);
      }
      return next;
    });
  }

  const selectedCharacters = characters.filter((c) => selectedIds.has(c.id));

  function handleRaceComplete(results: RaceResult[]) {
    onUpdateLeaderboard(results);
  }

  return (
    <div className="page race-page">
      <div className="page-header">
        <h1>🏁 Marble Racing</h1>
        <p className="subtitle">
          Select 2-8 characters to enter the race
        </p>
      </div>

      <RaceSchedule />

      {!showRace ? (
        <>
          <div className="selection-bar">
            <span>{selectedIds.size} / 8 selected</span>
            {selectedIds.size >= 2 && (
              <button className="btn btn-primary" onClick={() => setShowRace(true)}>
                Enter Race →
              </button>
            )}
          </div>

          <div className="character-grid compact-grid">
            {characters.map((char) => (
              <CharacterCard
                key={char.id}
                character={char}
                compact
                selected={selectedIds.has(char.id)}
                onClick={() => toggleSelection(char.id)}
              />
            ))}
          </div>
        </>
      ) : (
        <>
          <button className="btn btn-secondary" onClick={() => setShowRace(false)}>
            ← Back to Selection
          </button>
          <RaceTrack
            characters={selectedCharacters}
            onRaceComplete={handleRaceComplete}
          />
        </>
      )}
    </div>
  );
}
