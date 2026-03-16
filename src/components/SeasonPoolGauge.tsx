import { useState, useEffect } from "react";
import { getSeasonPool, TREASURY_WALLET } from "../engines/seasonPool";
import type { SeasonPrizePool } from "../types/nft";

// Visual gauge showing the growing season prize pool from premium race fees.
// Updates on an interval to reflect new race contributions.

export function SeasonPoolGauge() {
  const [pool, setPool] = useState<SeasonPrizePool>(getSeasonPool);

  // Refresh pool state periodically
  useEffect(() => {
    const interval = window.setInterval(() => {
      setPool(getSeasonPool());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Gauge fill percentage — use a reasonable max for visual scaling
  // Adjusts as the pool grows; shows meaningful progress early
  const gaugeMax = Math.max(10000, Math.ceil(pool.totalPBP / 1000) * 1000 + 2000);
  const fillPct = Math.min(100, (pool.totalPBP / gaugeMax) * 100);

  return (
    <div className="season-pool-gauge">
      <div className="gauge-header">
        <h4>Season Prize Pool</h4>
        <span className="gauge-label">End-of-season PBP token prizes</span>
      </div>

      <div className="gauge-bar-container">
        <div className="gauge-bar">
          <div
            className="gauge-bar-fill"
            style={{ width: `${fillPct}%` }}
          />
        </div>
        <div className="gauge-value">
          <span className="gauge-amount">{pool.totalPBP.toLocaleString()}</span>
          <span className="gauge-unit"> PBP</span>
        </div>
      </div>

      <div className="gauge-details">
        <span className="gauge-races">
          {pool.totalRaces} premium race{pool.totalRaces !== 1 ? "s" : ""} contributed
        </span>
        <span className="gauge-treasury" title={TREASURY_WALLET}>
          Treasury: {TREASURY_WALLET.slice(0, 6)}...{TREASURY_WALLET.slice(-4)}
        </span>
      </div>
    </div>
  );
}
