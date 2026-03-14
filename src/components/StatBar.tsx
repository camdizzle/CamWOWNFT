import type { StatKey } from "../types/nft";
import { STAT_COLORS, STAT_ICONS } from "../data/traitStatMap";

interface StatBarProps {
  stat: StatKey;
  value: number;
  maxValue?: number;
}

export function StatBar({ stat, value, maxValue = 30 }: StatBarProps) {
  const pct = Math.min(100, (value / maxValue) * 100);
  const color = STAT_COLORS[stat];
  const icon = STAT_ICONS[stat];

  return (
    <div className="stat-bar">
      <span className="stat-label">
        {icon} {stat}
      </span>
      <div className="stat-track">
        <div
          className="stat-fill"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="stat-value">{value}</span>
    </div>
  );
}
