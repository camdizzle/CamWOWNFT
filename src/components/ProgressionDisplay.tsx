import type { NFTCharacter } from "../types/nft";
import { STAT_KEYS } from "../types/nft";
import { STAT_COLORS, STAT_ICONS } from "../data/traitStatMap";
import { getProgressionSummary, MAX_PROGRESSION_BONUS, MAX_NFT_LEVEL } from "../engines/progression";
import type { CharacterProgression } from "../engines/progression";

interface ProgressionDisplayProps {
  character: NFTCharacter;
  progression: CharacterProgression;
}

export function ProgressionDisplay({ progression }: ProgressionDisplayProps) {
  const summary = getProgressionSummary(progression);

  return (
    <div className="progression-display">
      {/* Overall NFT Level */}
      <div className="nft-level-section">
        <div className="nft-level-header">
          <span className="nft-level-badge">Lv. {summary.nftLevel}</span>
          <span className="nft-level-label">
            {summary.isMaxLevel ? "MAX LEVEL" : `${summary.nftXp} / ${summary.nftXpToNext} XP`}
          </span>
        </div>
        <div className="nft-level-bar">
          <div
            className="nft-level-fill"
            style={{ width: `${summary.nftXpPct}%` }}
          />
        </div>
      </div>

      <div className="progression-header">
        <h4>Stat Progression</h4>
        <span className="progression-total">
          +{summary.totalBonusStats} bonus stats
        </span>
        <span className="progression-races">
          {summary.totalRaces} races | {summary.totalWins} wins
          {summary.totalBattles > 0 && ` | ${summary.totalBattles} battles`}
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
