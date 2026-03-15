import { useMemo } from "react";
import { ACHIEVEMENTS } from "../engines/achievements";
import type { UseEconomyResult } from "../hooks/useEconomy";

interface AchievementsPanelProps {
  economy: UseEconomyResult;
}

export function AchievementsPanel({ economy }: AchievementsPanelProps) {
  const unlocked = new Set(economy.unlockedAchievements);

  const grouped = useMemo(() => {
    const groups: Record<string, typeof ACHIEVEMENTS> = {};
    for (const ach of ACHIEVEMENTS) {
      if (!groups[ach.category]) groups[ach.category] = [];
      groups[ach.category].push(ach);
    }
    return groups;
  }, []);

  const totalUnlocked = economy.unlockedAchievements.length;
  const totalCoinsFromAch = ACHIEVEMENTS.filter((a) => unlocked.has(a.id)).reduce(
    (sum, a) => sum + a.coinReward,
    0
  );

  const CATEGORY_LABELS: Record<string, string> = {
    streamer: "Streamer Participation",
    race: "Race Count",
    placement: "Wins & Placement",
    streak: "Win Streaks",
    milestone: "Milestones",
  };

  return (
    <div className="achievements-panel">
      <div className="ach-header">
        <h3>Achievements</h3>
        <div className="ach-summary">
          <span className="ach-count">
            {totalUnlocked} / {ACHIEVEMENTS.length} unlocked
          </span>
          <span className="ach-coins-earned">🪙 {totalCoinsFromAch} earned</span>
        </div>
      </div>

      <div className="ach-progress-bar">
        <div
          className="ach-progress-fill"
          style={{ width: `${(totalUnlocked / ACHIEVEMENTS.length) * 100}%` }}
        />
      </div>

      {Object.entries(grouped).map(([category, achievements]) => {
        const catUnlocked = achievements.filter((a) => unlocked.has(a.id)).length;
        return (
          <div key={category} className="ach-category">
            <div className="ach-category-header">
              <h4>{CATEGORY_LABELS[category] ?? category}</h4>
              <span className="ach-category-count">
                {catUnlocked} / {achievements.length}
              </span>
            </div>
            <div className="ach-list">
              {achievements.map((ach) => {
                const isUnlocked = unlocked.has(ach.id);
                return (
                  <div
                    key={ach.id}
                    className={`ach-card ${isUnlocked ? "unlocked" : "locked"}`}
                  >
                    <span className="ach-icon">{ach.icon}</span>
                    <div className="ach-info">
                      <span className="ach-name">{ach.name}</span>
                      <span className="ach-desc">{ach.description}</span>
                    </div>
                    <div className="ach-reward">
                      <span className="ach-reward-amount">🪙 {ach.coinReward}</span>
                      {isUnlocked && <span className="ach-check">&#10003;</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
