import { Router } from "express";
import pool from "../db.js";

const router = Router();

const STAT_KEYS = ["speed", "toughness", "charisma", "luck", "stamina", "agility"] as const;

// ── Get progression for an NFT ─────────────────────────────────────────

router.get("/:nftId", async (req, res) => {
  const { nftId } = req.params;

  try {
    const [statRows] = await pool.execute(
      "SELECT stat_key, xp, level FROM stat_progression WHERE nft_id = ?",
      [nftId]
    );

    const [levelRows] = await pool.execute(
      "SELECT xp, level, total_races, total_wins, total_battles, total_battle_wins, last_race_time, last_battle_time FROM nft_levels WHERE nft_id = ?",
      [nftId]
    );

    // Build full stat map (fill in missing stats with 0)
    const statProgress: Record<string, { xp: number; level: number }> = {};
    for (const key of STAT_KEYS) {
      statProgress[key] = { xp: 0, level: 0 };
    }
    for (const row of statRows as any[]) {
      statProgress[row.stat_key] = { xp: row.xp, level: row.level };
    }

    const levelData = (levelRows as any[])[0] ?? {
      xp: 0, level: 0, total_races: 0, total_wins: 0,
      total_battles: 0, total_battle_wins: 0,
      last_race_time: null, last_battle_time: null,
    };

    res.json({
      nftId,
      statProgress,
      xp: levelData.xp,
      level: levelData.level,
      totalRaces: levelData.total_races,
      totalWins: levelData.total_wins,
      totalBattles: levelData.total_battles,
      totalBattleWins: levelData.total_battle_wins,
      lastRaceTime: levelData.last_race_time ? new Date(levelData.last_race_time).getTime() : 0,
      lastBattleTime: levelData.last_battle_time ? new Date(levelData.last_battle_time).getTime() : 0,
    });
  } catch (err) {
    console.error("Get progression error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// ── Get all progressions (batch) ───────────────────────────────────────

router.post("/batch", async (req, res) => {
  const { nftIds } = req.body;

  if (!Array.isArray(nftIds) || nftIds.length === 0) {
    res.json({});
    return;
  }

  try {
    const placeholders = nftIds.map(() => "?").join(",");
    const [rows] = await pool.execute(
      `SELECT nft_id, stat_key, xp, level FROM stat_progression WHERE nft_id IN (${placeholders})`,
      nftIds
    );

    const result: Record<string, Record<string, { xp: number; level: number }>> = {};

    // Init all
    for (const id of nftIds) {
      result[id] = {};
      for (const key of STAT_KEYS) {
        result[id][key] = { xp: 0, level: 0 };
      }
    }

    // Fill from DB
    for (const row of rows as any[]) {
      if (result[row.nft_id]) {
        result[row.nft_id][row.stat_key] = { xp: row.xp, level: row.level };
      }
    }

    res.json(result);
  } catch (err) {
    console.error("Batch progression error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// ── Update progression (called after races and battles) ─────────────

router.put("/:nftId", async (req, res) => {
  const { nftId } = req.params;
  const { statProgress, xp, level, totalRaces, totalWins, totalBattles, totalBattleWins, lastRaceTime, lastBattleTime } = req.body;

  if (!statProgress) {
    res.status(400).json({ error: "statProgress required" });
    return;
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Update per-stat progression
    for (const key of STAT_KEYS) {
      const sp = statProgress[key];
      if (!sp) continue;

      await conn.execute(
        `INSERT INTO stat_progression (nft_id, stat_key, xp, level)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE xp = VALUES(xp), level = VALUES(level)`,
        [nftId, key, sp.xp, sp.level]
      );
    }

    // Update overall NFT level
    if (level !== undefined) {
      await conn.execute(
        `INSERT INTO nft_levels (nft_id, xp, level, total_races, total_wins, total_battles, total_battle_wins, last_race_time, last_battle_time)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           xp = VALUES(xp), level = VALUES(level),
           total_races = VALUES(total_races), total_wins = VALUES(total_wins),
           total_battles = VALUES(total_battles), total_battle_wins = VALUES(total_battle_wins),
           last_race_time = VALUES(last_race_time), last_battle_time = VALUES(last_battle_time)`,
        [
          nftId,
          xp ?? 0,
          level ?? 0,
          totalRaces ?? 0,
          totalWins ?? 0,
          totalBattles ?? 0,
          totalBattleWins ?? 0,
          lastRaceTime ? new Date(lastRaceTime) : null,
          lastBattleTime ? new Date(lastBattleTime) : null,
        ]
      );
    }

    await conn.commit();
    res.json({ message: "Progression updated" });
  } catch (err) {
    await conn.rollback();
    console.error("Update progression error:", err);
    res.status(500).json({ error: "Database error" });
  } finally {
    conn.release();
  }
});

export default router;
