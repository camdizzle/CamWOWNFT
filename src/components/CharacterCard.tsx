import type { NFTCharacter } from "../types/nft";
import { STAT_KEYS } from "../types/nft";
import type { CharacterProgression } from "../engines/progression";
import { StatBar } from "./StatBar";
import { ProgressionDisplay } from "./ProgressionDisplay";

interface CharacterCardProps {
  character: NFTCharacter;
  progression?: CharacterProgression;
  selected?: boolean;
  onClick?: () => void;
  compact?: boolean;
  showProgression?: boolean;
}

export function CharacterCard({
  character,
  progression,
  selected,
  onClick,
  compact,
  showProgression,
}: CharacterCardProps) {
  return (
    <div
      className={`character-card ${selected ? "selected" : ""} ${compact ? "compact" : ""}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="card-image">
        <div className="card-image-placeholder">
          <span className="placeholder-emoji">🎨</span>
          <span className="placeholder-id">{character.id}</span>
        </div>
        <div className="power-badge">⚔️ {character.totalPower}</div>
        {progression && progression.level > 0 && (
          <div className="level-badge">Lv.{progression.level}</div>
        )}
      </div>

      <div className="card-body">
        <h3 className="card-name">{character.name}</h3>

        {!compact && (
          <>
            <div className="card-traits">
              {character.traits.map((t) => (
                <span key={t.trait_type} className="trait-tag">
                  {t.value}
                </span>
              ))}
            </div>

            <div className="card-stats">
              {STAT_KEYS.map((key) => (
                <StatBar key={key} stat={key} value={character.stats[key]} />
              ))}
            </div>

            {showProgression && progression && (
              <ProgressionDisplay character={character} progression={progression} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
