import { useState, useEffect, useRef } from "react";
import type { NFTCharacter, RaceLobby as RaceLobbyType, RaceResult } from "../types/nft";
import {
  createLobby,
  joinLobby,
  leaveLobby,
  tickLobby,
  getUserEntryCount,
  getTimeUntilDeadline,
  getLobbySchedule,
  MIN_ENTRIES,
  MAX_PER_USER,
  COUNTDOWN_DURATION_MS,
} from "../engines/raceLobby";
import { createRace, createRaceSimulator } from "../engines/marbleRace";
import type { AuthState } from "../hooks/useAuth";

interface RaceLobbyProps {
  characters: NFTCharacter[];
  auth: AuthState;
  onRaceComplete: (results: RaceResult[], racerIds: string[]) => void;
}

const MARBLE_COLORS = [
  "#ff6b6b", "#4ecdc4", "#ffe66d", "#a29bfe",
  "#55efc4", "#fd79a8", "#74b9ff", "#ffeaa7",
  "#e17055", "#00cec9", "#fdcb6e", "#6c5ce7",
  "#fab1a0", "#81ecec", "#ffd93d", "#a29bfe",
];

export function RaceLobbyComponent({ characters, auth, onRaceComplete }: RaceLobbyProps) {
  const [lobby, setLobby] = useState<RaceLobbyType>(() =>
    createLobby(getLobbySchedule(1)[0])
  );
  const [timeLeft, setTimeLeft] = useState("");
  const [countdownSec, setCountdownSec] = useState<number | null>(null);
  const [racing, setRacing] = useState(false);
  const [positions, setPositions] = useState<{ characterId: string; position: number; finished: boolean }[]>([]);
  const [results, setResults] = useState<RaceResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<number | null>(null);
  const raceIntervalRef = useRef<number | null>(null);

  const userId = auth.user?.twitchUser.id ?? "";
  const ownedIds = new Set(auth.user?.ownedNftIds ?? []);
  const ownedCharacters = characters.filter((c) => ownedIds.has(c.id));
  const charMap = new Map(characters.map((c) => [c.id, c]));

  // Timer tick
  useEffect(() => {
    intervalRef.current = window.setInterval(() => {
      const newLobby = { ...lobby, entries: [...lobby.entries] };
      const status = tickLobby(newLobby, Date.now());

      if (status === "countdown" && lobby.status === "waiting") {
        setLobby(newLobby);
        startCountdown(newLobby);
        return;
      }

      // Update timer display
      const ms = getTimeUntilDeadline(newLobby);
      if (ms > 0) {
        const mins = Math.floor(ms / 60000);
        const secs = Math.floor((ms % 60000) / 1000);
        setTimeLeft(`${mins}:${secs.toString().padStart(2, "0")}`);
      } else if (newLobby.entries.length < MIN_ENTRIES) {
        setTimeLeft("Waiting for racers...");
      } else {
        setTimeLeft("Starting soon...");
      }

      setLobby(newLobby);
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [lobby]);

  function startCountdown(lobbyState: RaceLobbyType) {
    let sec = Math.ceil(COUNTDOWN_DURATION_MS / 1000);
    setCountdownSec(sec);
    const cdInterval = window.setInterval(() => {
      sec--;
      if (sec <= 0) {
        clearInterval(cdInterval);
        setCountdownSec(null);
        startRace(lobbyState);
      } else {
        setCountdownSec(sec);
      }
    }, 1000);
  }

  function startRace(lobbyState: RaceLobbyType) {
    const racerIds = lobbyState.entries.map((e) => e.characterId);
    const racers = racerIds.map((id) => charMap.get(id)).filter(Boolean) as NFTCharacter[];

    if (racers.length < MIN_ENTRIES) return;

    const race = createRace("league-race", "League Race", racers, Date.now());
    const simulator = createRaceSimulator(race, racers);

    setRacing(true);
    setPositions(racers.map((c) => ({ characterId: c.id, position: 0, finished: false })));

    raceIntervalRef.current = window.setInterval(() => {
      const entries = simulator.tick();
      setPositions(
        entries.map((e) => ({
          characterId: e.characterId,
          position: e.position,
          finished: e.finishTime != null,
        }))
      );

      if (simulator.isFinished()) {
        clearInterval(raceIntervalRef.current!);
        setRacing(false);
        const raceResults = simulator.getResults();
        setResults(raceResults);
        onRaceComplete(raceResults, racerIds);

        // Reset lobby for next race
        setTimeout(() => {
          setLobby(createLobby(getLobbySchedule(1)[0]));
        }, 10000);
      }
    }, 50);
  }

  useEffect(() => {
    return () => {
      if (raceIntervalRef.current) clearInterval(raceIntervalRef.current);
    };
  }, []);

  function handleJoin(characterId: string) {
    setError(null);
    const newLobby = { ...lobby, entries: [...lobby.entries] };
    const result = joinLobby(newLobby, characterId, userId);
    if (!result.ok) {
      setError(result.reason);
      return;
    }
    setLobby(newLobby);
  }

  function handleLeave(characterId: string) {
    setError(null);
    const newLobby = { ...lobby, entries: [...lobby.entries] };
    leaveLobby(newLobby, characterId);
    setLobby(newLobby);
  }

  const userEntryCount = getUserEntryCount(lobby, userId);
  const myEnteredIds = new Set(
    lobby.entries.filter((e) => e.userId === userId).map((e) => e.characterId)
  );

  // ── Render ─────────────────────────────────────────────────────────

  if (!auth.isLoggedIn) {
    return (
      <div className="race-lobby">
        <div className="lobby-header">
          <h2>🏁 Marble Racing League</h2>
          <p className="subtitle">Login with Twitch to enter races</p>
        </div>
      </div>
    );
  }

  return (
    <div className="race-lobby">
      <div className="lobby-header">
        <h2>🏁 Marble Racing League</h2>
        <div className="lobby-status-bar">
          <span className={`lobby-status ${lobby.status}`}>
            {lobby.status === "waiting" && "Waiting for Racers"}
            {lobby.status === "countdown" && "Race Starting!"}
            {lobby.status === "racing" && "Race in Progress"}
            {lobby.status === "finished" && "Race Complete"}
          </span>
          <span className="lobby-count">
            {lobby.entries.length} / {MIN_ENTRIES} min
          </span>
          <span className="lobby-timer">{timeLeft}</span>
        </div>
      </div>

      {countdownSec !== null && (
        <div className="countdown-overlay">
          <span className="countdown-number">{countdownSec}</span>
        </div>
      )}

      {error && <div className="lobby-error">{error}</div>}

      {/* Race Animation */}
      {(racing || results) && (
        <div className="race-track-container">
          <div className="race-lanes">
            {positions.map((pos, idx) => {
              const char = charMap.get(pos.characterId);
              const color = MARBLE_COLORS[idx % MARBLE_COLORS.length];
              return (
                <div key={pos.characterId} className="race-lane">
                  <div className="lane-label">
                    {char?.name.split("—")[1] || char?.name || pos.characterId}
                  </div>
                  <div className="lane-track">
                    <div
                      className={`marble ${pos.finished ? "finished" : ""}`}
                      style={{ left: `${pos.position}%`, backgroundColor: color }}
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
                  const isMine = myEnteredIds.has(r.characterId);
                  return (
                    <div key={r.characterId} className={`result-row ${isMine ? "result-mine" : ""}`}>
                      <span className="result-place">
                        {r.placement === 1 ? "🥇" : r.placement === 2 ? "🥈" : r.placement === 3 ? "🥉" : `#${r.placement}`}
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
      )}

      {/* Entry Selection (only when not racing) */}
      {!racing && !results && (
        <>
          <div className="lobby-rules">
            <span>Max {MAX_PER_USER} NFTs per user per race</span>
            <span>•</span>
            <span>Min {MIN_ENTRIES} racers to start</span>
            <span>•</span>
            <span>Your entries: {userEntryCount} / {MAX_PER_USER}</span>
          </div>

          {/* Lobby Entries */}
          <div className="lobby-entries">
            <h3>Entered ({lobby.entries.length})</h3>
            <div className="lobby-entry-list">
              {lobby.entries.map((entry) => {
                const char = charMap.get(entry.characterId);
                const isMine = entry.userId === userId;
                return (
                  <div key={entry.characterId} className={`lobby-entry-card ${isMine ? "mine" : ""}`}>
                    <span className="entry-name">{char?.name.split("—")[1] || entry.characterId}</span>
                    <span className="entry-power">⚔️ {char?.totalPower}</span>
                    {isMine && (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleLeave(entry.characterId)}
                      >
                        Withdraw
                      </button>
                    )}
                  </div>
                );
              })}
              {lobby.entries.length === 0 && (
                <p className="lobby-empty">No entries yet. Be the first!</p>
              )}
            </div>
          </div>

          {/* NFT Selection */}
          <div className="lobby-select">
            <h3>Your NFTs</h3>
            <div className="lobby-nft-grid">
              {ownedCharacters.map((char) => {
                const entered = myEnteredIds.has(char.id);
                const canEnter = !entered && userEntryCount < MAX_PER_USER && lobby.status === "waiting";

                return (
                  <div
                    key={char.id}
                    className={`lobby-nft-card ${entered ? "entered" : ""} ${canEnter ? "available" : ""}`}
                    onClick={() => canEnter && handleJoin(char.id)}
                    role={canEnter ? "button" : undefined}
                    tabIndex={canEnter ? 0 : undefined}
                  >
                    <div className="lobby-nft-avatar">🎨</div>
                    <span className="lobby-nft-name">{char.name.split("—")[1] || char.name}</span>
                    <span className="lobby-nft-power">⚔️ {char.totalPower}</span>
                    {entered && <span className="lobby-nft-badge">ENTERED</span>}
                  </div>
                );
              })}
              {ownedCharacters.length === 0 && (
                <p className="lobby-empty">You don't own any CamWOW NFTs.</p>
              )}
            </div>
          </div>
        </>
      )}

      {/* Schedule */}
      <div className="lobby-schedule">
        <h3>📅 Upcoming Races (every 4 hours)</h3>
        <div className="schedule-list">
          {getLobbySchedule(6).map((time, idx) => {
            const date = new Date(time);
            const diff = time - Date.now();
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            return (
              <div key={time} className={`schedule-item ${idx === 0 ? "next-race" : ""}`}>
                <span className="schedule-time">
                  {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
                <span className="schedule-date">
                  {date.toLocaleDateString([], { month: "short", day: "numeric" })}
                </span>
                {diff > 0 && (
                  <span className="schedule-countdown">
                    {idx === 0 ? "🔴 NEXT — " : ""}{hours}h {mins}m
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
