import { useState, useEffect, useRef } from "react";
import type { NFTCharacter, RaceLobby as RaceLobbyType, RaceResult, RaceMode } from "../types/nft";
import { PREMIUM_ENTRY_FEE_PBP } from "../types/nft";
import type { ActiveBuff } from "../engines/buffs";
import { BUFF_CATALOG, RARITY_COLORS, MAX_BUFFS_PER_ENTRY } from "../engines/buffs";
import {
  createLobby,
  joinLobby,
  leaveLobby,
  tickLobby,
  getUserEntryCount,
  getTimeUntilDeadline,
  getLobbySchedule,
  calculatePremiumPrizes,
  MIN_ENTRIES,
  MIN_ENTRIES_EXTENDED,
  MAX_PER_USER,
  COUNTDOWN_DURATION_MS,
} from "../engines/raceLobby";
import { createRace, createRaceSimulator } from "../engines/marbleRace";
import { addToSeasonPool, getSeasonPool } from "../engines/seasonPool";
import { SeasonPoolGauge } from "./SeasonPoolGauge";
import type { AuthState } from "../hooks/useAuth";
import type { UseEconomyResult } from "../hooks/useEconomy";

interface RaceLobbyProps {
  characters: NFTCharacter[];
  auth: AuthState;
  economy?: UseEconomyResult;
  onRaceComplete: (results: RaceResult[], racerIds: string[], mode: RaceMode) => void;
}

const MARBLE_COLORS = [
  "#ff6b6b", "#4ecdc4", "#ffe66d", "#a29bfe",
  "#55efc4", "#fd79a8", "#74b9ff", "#ffeaa7",
  "#e17055", "#00cec9", "#fdcb6e", "#6c5ce7",
  "#fab1a0", "#81ecec", "#ffd93d", "#a29bfe",
];

export function RaceLobbyComponent({ characters, auth, economy, onRaceComplete }: RaceLobbyProps) {
  const [raceMode, setRaceMode] = useState<RaceMode>("free");
  const [lobby, setLobby] = useState<RaceLobbyType>(() =>
    createLobby(getLobbySchedule(1)[0], "free")
  );
  const [timeLeft, setTimeLeft] = useState("");
  const [countdownSec, setCountdownSec] = useState<number | null>(null);
  const [racing, setRacing] = useState(false);
  const [positions, setPositions] = useState<{ characterId: string; position: number; finished: boolean }[]>([]);
  const [results, setResults] = useState<RaceResult[] | null>(null);
  const [premiumPrizes, setPremiumPrizes] = useState<{ first: number; second: number; third: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<number | null>(null);
  const raceIntervalRef = useRef<number | null>(null);

  // Buff selection: map characterId -> selected buff IDs (max 2)
  const [selectedBuffs, setSelectedBuffs] = useState<Record<string, string[]>>({});
  const [showBuffPicker, setShowBuffPicker] = useState<string | null>(null);

  const userId = auth.user?.twitchUser.id ?? "";
  const ownedIds = new Set(auth.user?.ownedNftIds ?? []);
  const ownedCharacters = characters.filter((c) => ownedIds.has(c.id));
  const charMap = new Map(characters.map((c) => [c.id, c]));

  // Switch race mode
  function handleModeSwitch(mode: RaceMode) {
    if (racing || results || lobby.entries.length > 0) return;
    setRaceMode(mode);
    setLobby(createLobby(getLobbySchedule(1)[0], mode));
    setError(null);
  }

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
      } else if (newLobby.entries.length < newLobby.minEntries) {
        const minNeeded = newLobby.minEntries;
        setTimeLeft(`Waiting for racers... (${newLobby.entries.length}/${minNeeded})`);
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

    const minNeeded = lobbyState.minEntries;
    if (racers.length < minNeeded) return;

    // Build ActiveBuff array from selected buffs and consume them
    const raceBuffs: ActiveBuff[] = [];
    for (const [charId, buffIds] of Object.entries(selectedBuffs)) {
      for (const buffId of buffIds) {
        if (economy?.consumeBuff(buffId)) {
          raceBuffs.push({ buffId, characterId: charId, triggered: false });
          economy.incrementStat("buffsUsed");
        }
      }
    }

    const race = createRace("league-race", "League Race", racers, Date.now());
    const simulator = createRaceSimulator(race, racers, undefined, raceBuffs);

    setRacing(true);
    setPositions(racers.map((c) => ({ characterId: c.id, position: 0, finished: false })));

    // Calculate premium prizes if applicable
    if (lobbyState.mode === "premium") {
      const prizes = calculatePremiumPrizes(lobbyState.prizePool);
      setPremiumPrizes({ first: prizes.first, second: prizes.second, third: prizes.third });
      // Add treasury share to season pool
      addToSeasonPool(lobbyState.prizePool);
    }

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
        onRaceComplete(raceResults, racerIds, lobbyState.mode);

        // Reset lobby for next race
        setTimeout(() => {
          setLobby(createLobby(getLobbySchedule(1)[0], raceMode));
          setSelectedBuffs({});
          setShowBuffPicker(null);
          setResults(null);
          setPremiumPrizes(null);
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
    // Clear selected buffs for this character
    setSelectedBuffs((prev) => {
      const next = { ...prev };
      delete next[characterId];
      return next;
    });
  }

  function toggleBuff(characterId: string, buffId: string) {
    setSelectedBuffs((prev) => {
      const current = prev[characterId] ?? [];
      if (current.includes(buffId)) {
        return { ...prev, [characterId]: current.filter((id) => id !== buffId) };
      }
      if (current.length >= MAX_BUFFS_PER_ENTRY) return prev;
      return { ...prev, [characterId]: [...current, buffId] };
    });
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
          <h2>Marble Racing League</h2>
          <p className="subtitle">Login with Twitch to enter races</p>
        </div>
      </div>
    );
  }

  return (
    <div className="race-lobby">
      <div className="lobby-header">
        <h2>Marble Racing League</h2>

        {/* Race Mode Toggle */}
        <div className="race-mode-toggle">
          <button
            className={`mode-btn ${raceMode === "free" ? "active mode-free" : ""}`}
            onClick={() => handleModeSwitch("free")}
            disabled={racing || results !== null || lobby.entries.length > 0}
          >
            Free Race
          </button>
          <button
            className={`mode-btn ${raceMode === "premium" ? "active mode-premium" : ""}`}
            onClick={() => handleModeSwitch("premium")}
            disabled={racing || results !== null || lobby.entries.length > 0}
          >
            Premium Race ({PREMIUM_ENTRY_FEE_PBP} PBP)
          </button>
        </div>

        <div className="lobby-status-bar">
          <span className={`lobby-status ${lobby.status}`}>
            {lobby.status === "waiting" && "Waiting for Racers"}
            {lobby.status === "countdown" && "Race Starting!"}
            {lobby.status === "racing" && "Race in Progress"}
            {lobby.status === "finished" && "Race Complete"}
          </span>
          <span className="lobby-count">
            {lobby.entries.length} / {lobby.minEntries} min
          </span>
          <span className="lobby-timer">{timeLeft}</span>
        </div>

        {/* Premium race info */}
        {raceMode === "premium" && (
          <div className="premium-race-info">
            <div className="premium-pool">
              Prize Pool: <strong>{lobby.prizePool} PBP</strong>
            </div>
            <div className="premium-split">
              1st: 40% | 2nd: 15% | 3rd: 10% | Season Pool: 35%
            </div>
          </div>
        )}
      </div>

      {/* Season Prize Pool Gauge */}
      <SeasonPoolGauge />

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
                  const pbpPrize = premiumPrizes && raceMode === "premium"
                    ? r.placement === 1 ? premiumPrizes.first
                    : r.placement === 2 ? premiumPrizes.second
                    : r.placement === 3 ? premiumPrizes.third
                    : 0
                    : 0;
                  return (
                    <div key={r.characterId} className={`result-row ${isMine ? "result-mine" : ""}`}>
                      <span className="result-place">
                        {r.placement === 1 ? "🥇" : r.placement === 2 ? "🥈" : r.placement === 3 ? "🥉" : `#${r.placement}`}
                      </span>
                      <span className="result-name">{char?.name ?? r.characterId}</span>
                      <span className="result-time">{(r.timeMs / 1000).toFixed(1)}s</span>
                      <span className="result-points">+{r.pointsEarned}pts</span>
                      {pbpPrize > 0 && (
                        <span className="result-pbp">+{pbpPrize} PBP</span>
                      )}
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
            <span>Min {lobby.minEntries} racers to start</span>
            {raceMode === "premium" && (
              <>
                <span>•</span>
                <span className="rule-premium">Entry: {PREMIUM_ENTRY_FEE_PBP} PBP per NFT</span>
              </>
            )}
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
                const charBuffs = selectedBuffs[entry.characterId] ?? [];
                return (
                  <div key={entry.characterId}>
                    <div className={`lobby-entry-card ${isMine ? "mine" : ""}`}>
                      <span className="entry-name">{char?.name.split("—")[1] || entry.characterId}</span>
                      <span className="entry-power">⚔️ {char?.totalPower}</span>
                      {isMine && charBuffs.length > 0 && (
                        <span className="entry-buffs">
                          {charBuffs.map((bId) => {
                            const def = BUFF_CATALOG.find((b) => b.id === bId);
                            return def ? <span key={bId} title={def.name}>{def.icon}</span> : null;
                          })}
                        </span>
                      )}
                      {isMine && economy && economy.inventory.length > 0 && (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setShowBuffPicker(
                            showBuffPicker === entry.characterId ? null : entry.characterId
                          )}
                        >
                          {charBuffs.length > 0 ? `Buffs (${charBuffs.length}/${MAX_BUFFS_PER_ENTRY})` : "Add Buffs"}
                        </button>
                      )}
                      {isMine && (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleLeave(entry.characterId)}
                        >
                          Withdraw
                        </button>
                      )}
                    </div>
                    {isMine && showBuffPicker === entry.characterId && economy && (
                      <div className="buff-picker">
                        <div className="buff-picker-label">
                          Select up to {MAX_BUFFS_PER_ENTRY} buffs (consumed on race start)
                        </div>
                        <div className="buff-picker-grid">
                          {economy.inventory.map((item) => {
                            const def = BUFF_CATALOG.find((b) => b.id === item.buffId);
                            if (!def) return null;
                            const isSelected = charBuffs.includes(item.buffId);
                            const atMax = charBuffs.length >= MAX_BUFFS_PER_ENTRY && !isSelected;
                            return (
                              <button
                                key={item.buffId}
                                className={`buff-pick-btn ${isSelected ? "selected" : ""}`}
                                style={{ borderColor: isSelected ? RARITY_COLORS[def.rarity] : undefined }}
                                disabled={atMax}
                                onClick={() => toggleBuff(entry.characterId, item.buffId)}
                              >
                                <span className="buff-pick-icon">{def.icon}</span>
                                <span className="buff-pick-name">{def.name}</span>
                                <span className="buff-pick-qty">x{item.quantity}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
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
                    {raceMode === "premium" && !entered && (
                      <span className="lobby-nft-fee">{PREMIUM_ENTRY_FEE_PBP} PBP</span>
                    )}
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
        <h3>Upcoming Races (every 4 hours)</h3>
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
                    {idx === 0 ? "NEXT — " : ""}{hours}h {mins}m
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
