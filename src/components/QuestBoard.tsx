import { useEffect } from "react";
import type { UseQuestsResult } from "../hooks/useQuests";
import type { QuestProgress } from "../engines/quests";

interface QuestBoardProps {
  quests: UseQuestsResult;
  onCoinsEarned?: (amount: number) => void;
}

function formatTimeLeft(resetAt: number): string {
  const diff = resetAt - Date.now();
  if (diff <= 0) return "Resetting...";
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function QuestCard({
  qp,
  quests,
  onClaim,
}: {
  qp: QuestProgress;
  quests: UseQuestsResult;
  onClaim: (questId: string) => void;
}) {
  const def = quests.getQuestDef(qp.questId);
  if (!def) return null;

  const pct = Math.min((qp.progress / def.target) * 100, 100);

  return (
    <div className={`quest-card ${qp.completed ? "quest-complete" : ""} ${qp.claimed ? "quest-claimed" : ""}`}>
      <span className="quest-icon">{def.icon}</span>
      <div className="quest-info">
        <span className="quest-name">
          {def.name}
          {def.tier && <span className="quest-tier">{def.tier}</span>}
        </span>
        <span className="quest-desc">{def.description}</span>
        <div className="quest-progress-bar">
          <div className="quest-progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <span className="quest-progress-text">
          {qp.progress} / {def.target}
        </span>
      </div>
      <div className="quest-reward">
        <span className="quest-reward-amount">🪙 {def.coinReward}</span>
        {qp.completed && !qp.claimed && (
          <button className="quest-claim-btn" onClick={() => onClaim(qp.questId)}>
            Claim
          </button>
        )}
        {qp.claimed && <span className="quest-check">&#10003;</span>}
      </div>
    </div>
  );
}

export function QuestBoard({ quests, onCoinsEarned }: QuestBoardProps) {
  const { questState, refreshQuests, claimQuest } = quests;

  // Check for resets on mount and periodically
  useEffect(() => {
    refreshQuests();
    const interval = setInterval(refreshQuests, 60000); // check every minute
    return () => clearInterval(interval);
  }, [refreshQuests]);

  const handleClaim = (questId: string) => {
    const coins = claimQuest(questId);
    if (coins > 0 && onCoinsEarned) {
      onCoinsEarned(coins);
    }
  };

  const dailyCompleted = questState.daily.filter((q) => q.claimed).length;
  const weeklyCompleted = questState.weekly.filter((q) => q.claimed).length;

  return (
    <div className="quest-board">
      <div className="quest-header">
        <h3>Quests</h3>
      </div>

      {/* Daily Quests */}
      <div className="quest-section">
        <div className="quest-section-header">
          <h4>Daily Quests</h4>
          <div className="quest-section-meta">
            <span className="quest-section-count">{dailyCompleted} / {questState.daily.length}</span>
            <span className="quest-timer">Resets in {formatTimeLeft(questState.dailyResetAt)}</span>
          </div>
        </div>
        <div className="quest-list">
          {questState.daily.map((qp) => (
            <QuestCard key={qp.questId} qp={qp} quests={quests} onClaim={handleClaim} />
          ))}
        </div>
      </div>

      {/* Weekly Quests */}
      <div className="quest-section">
        <div className="quest-section-header">
          <h4>Weekly Quests</h4>
          <div className="quest-section-meta">
            <span className="quest-section-count">{weeklyCompleted} / {questState.weekly.length}</span>
            <span className="quest-timer">Resets in {formatTimeLeft(questState.weeklyResetAt)}</span>
          </div>
        </div>
        <div className="quest-list">
          {questState.weekly.map((qp) => (
            <QuestCard key={qp.questId} qp={qp} quests={quests} onClaim={handleClaim} />
          ))}
        </div>
      </div>

      {/* Milestone Quests */}
      {questState.milestone.length > 0 && (
        <div className="quest-section">
          <div className="quest-section-header">
            <h4>Milestones</h4>
            <span className="quest-section-count">
              {questState.milestone.filter((q) => q.claimed).length} / {questState.milestone.length}
            </span>
          </div>
          <div className="quest-list">
            {questState.milestone.map((qp) => (
              <QuestCard key={qp.questId} qp={qp} quests={quests} onClaim={handleClaim} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
