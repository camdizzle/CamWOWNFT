import type { NFTCharacter } from "../types/nft";
import { CharacterCard } from "../components/CharacterCard";

interface CollectionPageProps {
  characters: NFTCharacter[];
  onSelectCharacter?: (character: NFTCharacter) => void;
}

export function CollectionPage({ characters, onSelectCharacter }: CollectionPageProps) {
  return (
    <div className="page collection-page">
      <div className="page-header">
        <h1>🎨 My CamWOW Collection</h1>
        <p className="subtitle">
          {characters.length} characters — Select one to battle or enter races
        </p>
      </div>
      <div className="character-grid">
        {characters.map((char) => (
          <CharacterCard
            key={char.id}
            character={char}
            onClick={() => onSelectCharacter?.(char)}
          />
        ))}
      </div>
    </div>
  );
}
