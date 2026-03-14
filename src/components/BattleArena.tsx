import { useState, useEffect, useRef } from "react";
import type { NFTCharacter, BattleAction, BattleResult } from "../types/nft";
import { simulateBattle } from "../engines/battle";

interface BattleArenaProps {
  challenger: NFTCharacter;
  opponent: NFTCharacter;
  onBattleComplete?: (result: BattleResult) => void;
}

export function BattleArena({
  challenger,
  opponent,
  onBattleComplete,
}: BattleArenaProps) {
  const [battleLog, setBattleLog] = useState<BattleAction[]>([]);
  const [currentAction, setCurrentAction] = useState(0);
  const [result, setResult] = useState<BattleResult | null>(null);
  const [fighting, setFighting] = useState(false);
  const [challengerHp, setChallengerHp] = useState(100);
  const [opponentHp, setOpponentHp] = useState(100);
  const logRef = useRef<HTMLDivElement>(null);

  function startBattle() {
    const battleResult = simulateBattle(challenger, opponent);
    setResult(battleResult);
    setBattleLog(battleResult.rounds);
    setCurrentAction(0);
    setFighting(true);
    setChallengerHp(100);
    setOpponentHp(100);
  }

  useEffect(() => {
    if (!fighting || !result) return;
    if (currentAction >= battleLog.length) {
      setFighting(false);
      onBattleComplete?.(result);
      return;
    }

    const timer = setTimeout(() => {
      const _action = battleLog[currentAction];
      void _action; // used to advance animation frame

      // Calculate HP percentages
      const chalMaxHp = 50 + challenger.stats.toughness * 3 + challenger.stats.stamina * 2;
      const oppMaxHp = 50 + opponent.stats.toughness * 3 + opponent.stats.stamina * 2;

      // Sum damage dealt to each fighter so far
      const actionsToNow = battleLog.slice(0, currentAction + 1);
      const chalDamageTaken = actionsToNow
        .filter((a) => a.defenderId === challenger.id)
        .reduce((sum, a) => sum + a.damage, 0);
      const oppDamageTaken = actionsToNow
        .filter((a) => a.defenderId === opponent.id)
        .reduce((sum, a) => sum + a.damage, 0);

      setChallengerHp(Math.max(0, ((chalMaxHp - chalDamageTaken) / chalMaxHp) * 100));
      setOpponentHp(Math.max(0, ((oppMaxHp - oppDamageTaken) / oppMaxHp) * 100));

      setCurrentAction((prev) => prev + 1);

      if (logRef.current) {
        logRef.current.scrollTop = logRef.current.scrollHeight;
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [fighting, currentAction, battleLog, result, challenger, opponent, onBattleComplete]);

  const winner = result
    ? result.winnerId === challenger.id
      ? challenger
      : opponent
    : null;

  return (
    <div className="battle-arena">
      <div className="battle-header">
        <h2>⚔️ VS Battle</h2>
      </div>

      <div className="battle-fighters">
        <div className={`fighter ${result && result.winnerId === challenger.id ? "winner" : ""}`}>
          <div className="fighter-avatar">🎨</div>
          <h3>{challenger.name.split("—")[1] || challenger.name}</h3>
          <div className="hp-bar">
            <div
              className="hp-fill"
              style={{
                width: `${challengerHp}%`,
                backgroundColor: challengerHp > 50 ? "#55efc4" : challengerHp > 25 ? "#ffeaa7" : "#ff6b6b",
              }}
            />
          </div>
          <span className="hp-text">{Math.round(challengerHp)}%</span>
          <span className="power-label">⚔️ {challenger.totalPower}</span>
        </div>

        <div className="vs-badge">VS</div>

        <div className={`fighter ${result && result.winnerId === opponent.id ? "winner" : ""}`}>
          <div className="fighter-avatar">🎨</div>
          <h3>{opponent.name.split("—")[1] || opponent.name}</h3>
          <div className="hp-bar">
            <div
              className="hp-fill"
              style={{
                width: `${opponentHp}%`,
                backgroundColor: opponentHp > 50 ? "#55efc4" : opponentHp > 25 ? "#ffeaa7" : "#ff6b6b",
              }}
            />
          </div>
          <span className="hp-text">{Math.round(opponentHp)}%</span>
          <span className="power-label">⚔️ {opponent.totalPower}</span>
        </div>
      </div>

      {!fighting && !result && (
        <button className="btn btn-primary" onClick={startBattle}>
          Fight!
        </button>
      )}

      {battleLog.length > 0 && (
        <div className="battle-log" ref={logRef}>
          {battleLog.slice(0, currentAction).map((action, idx) => (
            <div
              key={idx}
              className={`log-entry ${action.critical ? "critical" : ""} ${action.damage === 0 ? "dodge" : ""}`}
            >
              <span className="log-round">R{action.round}</span>
              <span className="log-text">{action.description}</span>
            </div>
          ))}
        </div>
      )}

      {result && !fighting && (
        <div className="battle-result">
          <h3>🏆 {winner?.name} Wins!</h3>
          <p>Battle lasted {result.totalRounds} rounds</p>
          <button className="btn btn-secondary" onClick={startBattle}>
            Rematch
          </button>
        </div>
      )}
    </div>
  );
}
