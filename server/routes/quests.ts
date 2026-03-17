import { Router } from "express";
import pool from "../db.js";

const router = Router();

// ── Get quest state for a user ───────────────────────────────────────────

router.get("/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    // Fetch all quest rows for this user (active periods + milestones)
    const [questRows] = await pool.execute(
      `SELECT quest_id, frequency, progress, completed, claimed, period_key
       FROM user_quests WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );

    // Fetch period stats
    const [statRows] = await pool.execute(
      `SELECT period_key, stat_key, value
       FROM quest_period_stats WHERE user_id = ?`,
      [userId]
    );

    res.json({ quests: questRows, periodStats: statRows });
  } catch (err: any) {
    console.error("GET /quests/:userId error:", err);
    res.status(500).json({ error: "Failed to load quests." });
  }
});

// ── Update quest progress (called after races / battles / purchases) ─────

router.post("/:userId/progress", async (req, res) => {
  const { userId } = req.params;
  const { questId, periodKey, progress, completed } = req.body;

  if (!questId || !periodKey) {
    return res.status(400).json({ error: "questId and periodKey are required." });
  }

  try {
    await pool.execute(
      `INSERT INTO user_quests (user_id, quest_id, frequency, progress, completed, period_key)
       VALUES (?, ?, (SELECT 'daily'), ?, ?, ?)
       ON DUPLICATE KEY UPDATE progress = VALUES(progress), completed = VALUES(completed)`,
      [userId, questId, progress ?? 0, completed ?? false, periodKey]
    );

    res.json({ message: "Quest progress updated." });
  } catch (err: any) {
    console.error("POST /quests/:userId/progress error:", err);
    res.status(500).json({ error: "Failed to update quest progress." });
  }
});

// ── Batch upsert quest progress (more efficient) ─────────────────────────

router.post("/:userId/progress/batch", async (req, res) => {
  const { userId } = req.params;
  const { quests } = req.body as {
    quests: Array<{
      questId: string;
      frequency: string;
      periodKey: string;
      progress: number;
      completed: boolean;
    }>;
  };

  if (!Array.isArray(quests) || quests.length === 0) {
    return res.status(400).json({ error: "quests array is required." });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    for (const q of quests) {
      await conn.execute(
        `INSERT INTO user_quests (user_id, quest_id, frequency, progress, completed, claimed, period_key)
         VALUES (?, ?, ?, ?, ?, FALSE, ?)
         ON DUPLICATE KEY UPDATE progress = VALUES(progress), completed = VALUES(completed)`,
        [userId, q.questId, q.frequency, q.progress, q.completed, q.periodKey]
      );
    }

    await conn.commit();
    res.json({ message: "Batch quest progress updated." });
  } catch (err: any) {
    await conn.rollback();
    console.error("POST /quests/:userId/progress/batch error:", err);
    res.status(500).json({ error: "Failed to batch update quest progress." });
  } finally {
    conn.release();
  }
});

// ── Claim quest reward ───────────────────────────────────────────────────

router.post("/:userId/claim", async (req, res) => {
  const { userId } = req.params;
  const { questId, periodKey, coinReward } = req.body;

  if (!questId || !periodKey || typeof coinReward !== "number") {
    return res.status(400).json({ error: "questId, periodKey, and coinReward are required." });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Verify quest is completed and not yet claimed
    const [rows] = await conn.execute(
      `SELECT completed, claimed FROM user_quests
       WHERE user_id = ? AND quest_id = ? AND period_key = ?`,
      [userId, questId, periodKey]
    );
    const row = (rows as any[])[0];
    if (!row) {
      await conn.rollback();
      return res.status(404).json({ error: "Quest not found." });
    }
    if (!row.completed) {
      await conn.rollback();
      return res.status(400).json({ error: "Quest not completed yet." });
    }
    if (row.claimed) {
      await conn.rollback();
      return res.status(400).json({ error: "Quest reward already claimed." });
    }

    // Mark as claimed
    await conn.execute(
      `UPDATE user_quests SET claimed = TRUE
       WHERE user_id = ? AND quest_id = ? AND period_key = ?`,
      [userId, questId, periodKey]
    );

    // Award coins
    await conn.execute(
      `INSERT INTO user_coins (user_id, balance, total_earned)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE balance = balance + ?, total_earned = total_earned + ?`,
      [userId, coinReward, coinReward, coinReward, coinReward]
    );

    await conn.commit();
    res.json({ message: "Quest reward claimed!", coinsAwarded: coinReward });
  } catch (err: any) {
    await conn.rollback();
    console.error("POST /quests/:userId/claim error:", err);
    res.status(500).json({ error: "Failed to claim quest reward." });
  } finally {
    conn.release();
  }
});

// ── Update period stats (called after races/battles to track within-period counts) ──

router.post("/:userId/period-stats", async (req, res) => {
  const { userId } = req.params;
  const { periodKey, stats } = req.body as {
    periodKey: string;
    stats: Record<string, number>;
  };

  if (!periodKey || !stats) {
    return res.status(400).json({ error: "periodKey and stats are required." });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    for (const [key, value] of Object.entries(stats)) {
      await conn.execute(
        `INSERT INTO quest_period_stats (user_id, period_key, stat_key, value)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE value = VALUES(value)`,
        [userId, periodKey, key, value]
      );
    }

    await conn.commit();
    res.json({ message: "Period stats updated." });
  } catch (err: any) {
    await conn.rollback();
    console.error("POST /quests/:userId/period-stats error:", err);
    res.status(500).json({ error: "Failed to update period stats." });
  } finally {
    conn.release();
  }
});

export default router;
