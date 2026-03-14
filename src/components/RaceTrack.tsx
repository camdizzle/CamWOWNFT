import { useEffect, useRef, useState } from "react";
import type { NFTCharacter, RaceResult } from "../types/nft";
import { createRace, createRaceSimulator } from "../engines/marbleRace";

interface RaceTrackProps {
  characters: NFTCharacter[];
  onRaceComplete?: (results: RaceResult[]) => void;
}

interface MarblePosition {
  characterId: string;
  position: number;
  finished: boolean;
}

const MARBLE_COLORS = [
  "#ff6b6b",
  "#4ecdc4",
  "#ffe66d",
  "#a29bfe",
  "#55efc4",
  "#fd79a8",
  "#74b9ff",
  "#ffeaa7",
];

export function RaceTrack({ characters, onRaceComplete }: RaceTrackProps) {
  const [positions, setPositions] = useState<MarblePosition[]>([]);
  const [racing, setRacing] = useState(false);
  const [results, setResults] = useState<RaceResult[] | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  function startRace() {
    setResults(null);
    setCountdown(3);

    let count = 3;
    const cdInterval = window.setInterval(() => {
      count--;
      if (count <= 0) {
        clearInterval(cdInterval);
        setCountdown(null);
        runRace();
      } else {
        setCountdown(count);
      }
    }, 800);
  }

  function runRace() {
    const race = createRace("race-live", "Live Race", characters, Date.now());
    const simulator = createRaceSimulator(race, characters);

    setRacing(true);
    setPositions(
      characters.map((c) => ({ characterId: c.id, position: 0, finished: false }))
    );

    intervalRef.current = window.setInterval(() => {
      const entries = simulator.tick();
      setPositions(
        entries.map((e) => ({
          characterId: e.characterId,
          position: e.position,
          finished: e.finishTime != null,
        }))
      );

      if (simulator.isFinished()) {
        clearInterval(intervalRef.current!);
        setRacing(false);
        const raceResults = simulator.getResults();
        setResults(raceResults);
        onRaceComplete?.(raceResults);
      }
    }, 50);
  }

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const charMap = new Map(characters.map((c) => [c.id, c]));

  return (
    <div className="race-track-container">
      <div className="race-header">
        <h2>🏁 Marble Race</h2>
        {!racing && (
          <button className="btn btn-primary" onClick={startRace}>
            {results ? "Race Again" : "Start Race"}
          </button>
        )}
      </div>

      {countdown !== null && (
        <div className="countdown-overlay">
          <span className="countdown-number">{countdown}</span>
        </div>
      )}

      <div className="race-lanes">
        {characters.map((char, idx) => {
          const pos = positions.find((p) => p.characterId === char.id);
          const pct = pos ? pos.position : 0;
          const color = MARBLE_COLORS[idx % MARBLE_COLORS.length];

          return (
            <div key={char.id} className="race-lane">
              <div className="lane-label">{char.name.split("—")[1] || char.name}</div>
              <div className="lane-track">
                <div
                  className={`marble ${pos?.finished ? "finished" : ""}`}
                  style={{
                    left: `${pct}%`,
                    backgroundColor: color,
                  }}
                />
                <div className="finish-line" />
              </div>
            </div>
          );
        })}
      </div>

      {results && (
        <div className="race-results">
          <h3>Results</h3>
          <div className="results-list">
            {results.map((r) => {
              const char = charMap.get(r.characterId);
              return (
                <div key={r.characterId} className="result-row">
                  <span className="result-place">
                    {r.placement === 1
                      ? "🥇"
                      : r.placement === 2
                        ? "🥈"
                        : r.placement === 3
                          ? "🥉"
                          : `#${r.placement}`}
                  </span>
                  <span className="result-name">{char?.name ?? r.characterId}</span>
                  <span className="result-time">{(r.timeMs / 1000).toFixed(1)}s</span>
                  <span className="result-points">+{r.pointsEarned}pts</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
