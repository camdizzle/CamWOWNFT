import type { NFTCharacter } from "../types/nft";
import { STAT_KEYS } from "../types/nft";
import { STAT_COLORS, STAT_ICONS } from "../data/traitStatMap";
import { getProgressionSummary, MAX_PROGRESSION_BONUS } from "../engines/progression";
import type { CharacterProgression } from "../engines/progression";

interface ProgressionDisplayProps {
  character: NFTCharacter;
  progression: CharacterProgression;
}

export function ProgressionDisplay({ progression }: ProgressionDisplayProps) {
  const summary = getProgressionSummary(progression);

  return (
    <div className="progression-display">
      <div className="progression-header">
        <h4>Progression</h4>
        <span className="progression-total">
          +{summary.totalBonusStats} bonus stats
        </span>
        <span className="progression-races">
          {progression.totalRaces} races | {progression.totalWins} wins
        </span>
      </div>

      <div className="progression-bars">
        {STAT_KEYS.map((key) => {
          const info = summary.statLevels[key];
          const icon = STAT_ICONS[key];
          const color = STAT_COLORS[key];
          const isMaxed = info.level >= MAX_PROGRESSION_BONUS;

          return (
            <div key={key} className="progression-stat">
              <span className="prog-label">
                {icon} {key}
              </span>
              <div className="prog-bar-container">
                {/* Level segments */}
                <div className="prog-level-bar">
                  <div
                    className="prog-level-fill"
                    style={{
                      width: `${(info.level / MAX_PROGRESSION_BONUS) * 100}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
                {/* XP progress to next level */}
                {!isMaxed && (
                  <div className="prog-xp-bar">
                    <div
                      className="prog-xp-fill"
                      style={{
                        width: `${info.pct}%`,
                        backgroundColor: color,
                        opacity: 0.5,
                      }}
                    />
                  </div>
                )}
              </div>
              <span className="prog-value">
                {isMaxed ? (
                  <span className="prog-maxed">MAX</span>
                ) : (
                  `+${info.level}`
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
