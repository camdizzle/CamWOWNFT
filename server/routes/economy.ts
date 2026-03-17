import { Router } from "express";
import pool from "../db.js";

const router = Router();

const TREASURY_WALLET = "HtPe6EYLgmT3UzyZeBCLg5vX5JjsxpoggtXkRYYx6oN5";

// ── Get user economy state ──────────────────────────────────────────────

router.get("/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    // Coins
    const [coinRows] = await pool.execute(
      "SELECT balance, total_earned FROM user_coins WHERE user_id = ?",
      [userId]
    );
    const coins = (coinRows as any[])[0] ?? { balance: 0, total_earned: 0 };

    // Buff inventory
    const [buffRows] = await pool.execute(
      "SELECT buff_id, quantity FROM buff_inventory WHERE user_id = ? AND quantity > 0",
      [userId]
    );

    // Achievements
    const [achRows] = await pool.execute(
      "SELECT achievement_id FROM user_achievements WHERE user_id = ?",
      [userId]
    );

    // Player stats
    const [statRows] = await pool.execute(
      "SELECT * FROM player_stats WHERE user_id = ?",
      [userId]
    );

    // MyStats streamers
    const [streamerRows] = await pool.execute(
      "SELECT streamer_id FROM mystats_streamers_played WHERE user_id = ?",
      [userId]
    );

    const stats = (statRows as any[])[0];
    const streamers = (streamerRows as any[]).map((r: any) => r.streamer_id);

    res.json({
      coins: coins.balance,
      totalEarned: coins.total_earned,
      inventory: buffRows,
      achievements: (achRows as any[]).map((r: any) => r.achievement_id),
      playerStats: stats
        ? {
            mystatsRaceCount: stats.mystats_race_count,
            mystatsStreamersPlayed: streamers,
            mystatsPointsEarned: stats.mystats_points_earned,
            totalRaces: stats.total_races,
            totalWins: stats.total_wins,
            totalSecondPlace: stats.total_second_place,
            totalThirdPlace: stats.total_third_place,
            totalTopThree: stats.total_top_three,
            totalCoinsEarned: stats.total_coins_earned,
            currentWinStreak: stats.current_win_streak,
            longestWinStreak: stats.longest_win_streak,
            racesThisWeek: stats.races_this_week,
            racesThisSeason: stats.races_this_season,
            uniqueNftsRaced: stats.unique_nfts_raced,
            buffsUsed: stats.buffs_used,
          }
        : null,
    });
  } catch (err) {
    console.error("Get economy error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// ── Add coins ───────────────────────────────────────────────────────────

router.post("/:userId/coins/add", async (req, res) => {
  const { userId } = req.params;
  const { amount } = req.body;

  if (typeof amount !== "number" || amount <= 0) {
    res.status(400).json({ error: "Valid positive amount required" });
    return;
  }

  try {
    await pool.execute(
      `INSERT INTO user_coins (user_id, balance, total_earned)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE
         balance = balance + VALUES(balance),
         total_earned = total_earned + VALUES(total_earned)`,
      [userId, amount, amount]
    );
    res.json({ message: "Coins added" });
  } catch (err) {
    console.error("Add coins error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// ── Buy buff (with coins) ──────────────────────────────────────────────

router.post("/:userId/buffs/buy", async (req, res) => {
  const { userId } = req.params;
  const { buffId, cost } = req.body;

  if (!buffId || typeof cost !== "number") {
    res.status(400).json({ error: "buffId and cost required" });
    return;
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Check balance
    const [coinRows] = await conn.execute(
      "SELECT balance FROM user_coins WHERE user_id = ? FOR UPDATE",
      [userId]
    );
    const balance = (coinRows as any[])[0]?.balance ?? 0;

    if (balance < cost) {
      await conn.rollback();
      res.status(400).json({ error: "Not enough coins" });
      return;
    }

    // Deduct coins
    await conn.execute(
      "UPDATE user_coins SET balance = balance - ? WHERE user_id = ?",
      [cost, userId]
    );

    // Add to inventory
    await conn.execute(
      `INSERT INTO buff_inventory (user_id, buff_id, quantity)
       VALUES (?, ?, 1)
       ON DUPLICATE KEY UPDATE quantity = quantity + 1`,
      [userId, buffId]
    );

    await conn.commit();
    res.json({ message: "Buff purchased", currency: "coins" });
  } catch (err) {
    await conn.rollback();
    console.error("Buy buff error:", err);
    res.status(500).json({ error: "Database error" });
  } finally {
    conn.release();
  }
});

// ── Buy buff (with PBP token) ──────────────────────────────────────────
// In production: validate the PBP token transaction signature on-chain
// before crediting the buff. For now, records the purchase and credits inventory.

router.post("/:userId/buffs/buy-pbp", async (req, res) => {
  const { userId } = req.params;
  const { buffId, pbpPrice, txSignature } = req.body;

  if (!buffId || typeof pbpPrice !== "number") {
    res.status(400).json({ error: "buffId and pbpPrice required" });
    return;
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Record PBP purchase (audit trail)
    await conn.execute(
      `INSERT INTO pbp_purchases (user_id, item_type, item_id, pbp_amount, treasury_wallet, tx_signature)
       VALUES (?, 'buff', ?, ?, ?, ?)`,
      [userId, buffId, pbpPrice, TREASURY_WALLET, txSignature || null]
    );

    // Add to inventory
    await conn.execute(
      `INSERT INTO buff_inventory (user_id, buff_id, quantity)
       VALUES (?, ?, 1)
       ON DUPLICATE KEY UPDATE quantity = quantity + 1`,
      [userId, buffId]
    );

    await conn.commit();
    res.json({ message: "Buff purchased with PBP", currency: "pbp", treasuryWallet: TREASURY_WALLET });
  } catch (err) {
    await conn.rollback();
    console.error("Buy buff PBP error:", err);
    res.status(500).json({ error: "Database error" });
  } finally {
    conn.release();
  }
});

// ── Consume buff ────────────────────────────────────────────────────────

router.post("/:userId/buffs/consume", async (req, res) => {
  const { userId } = req.params;
  const { buffId } = req.body;

  if (!buffId) {
    res.status(400).json({ error: "buffId required" });
    return;
  }

  try {
    const [result] = await pool.execute(
      `UPDATE buff_inventory SET quantity = quantity - 1
       WHERE user_id = ? AND buff_id = ? AND quantity > 0`,
      [userId, buffId]
    );
    const affected = (result as any).affectedRows;
    if (affected === 0) {
      res.status(400).json({ error: "No buff to consume" });
      return;
    }
    res.json({ message: "Buff consumed" });
  } catch (err) {
    console.error("Consume buff error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// ── Unlock achievement ──────────────────────────────────────────────────

router.post("/:userId/achievements/unlock", async (req, res) => {
  const { userId } = req.params;
  const { achievementId, coinReward } = req.body;

  if (!achievementId) {
    res.status(400).json({ error: "achievementId required" });
    return;
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.execute(
      `INSERT IGNORE INTO user_achievements (user_id, achievement_id) VALUES (?, ?)`,
      [userId, achievementId]
    );

    if (typeof coinReward === "number" && coinReward > 0) {
      await conn.execute(
        `INSERT INTO user_coins (user_id, balance, total_earned)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE
           balance = balance + VALUES(balance),
           total_earned = total_earned + VALUES(total_earned)`,
        [userId, coinReward, coinReward]
      );
    }

    await conn.commit();
    res.json({ message: "Achievement unlocked" });
  } catch (err) {
    await conn.rollback();
    console.error("Unlock achievement error:", err);
    res.status(500).json({ error: "Database error" });
  } finally {
    conn.release();
  }
});

// ── Update player stats ─────────────────────────────────────────────────

router.post("/:userId/stats", async (req, res) => {
  const { userId } = req.params;
  const stats = req.body;

  try {
    await pool.execute(
      `INSERT INTO player_stats (user_id, total_races, total_wins, total_second_place,
        total_third_place, total_top_three, total_coins_earned, current_win_streak,
        longest_win_streak, races_this_week, races_this_season, unique_nfts_raced,
        buffs_used, mystats_race_count, mystats_points_earned)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         total_races = VALUES(total_races),
         total_wins = VALUES(total_wins),
         total_second_place = VALUES(total_second_place),
         total_third_place = VALUES(total_third_place),
         total_top_three = VALUES(total_top_three),
         total_coins_earned = VALUES(total_coins_earned),
         current_win_streak = VALUES(current_win_streak),
         longest_win_streak = VALUES(longest_win_streak),
         races_this_week = VALUES(races_this_week),
         races_this_season = VALUES(races_this_season),
         unique_nfts_raced = VALUES(unique_nfts_raced),
         buffs_used = VALUES(buffs_used),
         mystats_race_count = VALUES(mystats_race_count),
         mystats_points_earned = VALUES(mystats_points_earned)`,
      [
        userId,
        stats.totalRaces ?? 0,
        stats.totalWins ?? 0,
        stats.totalSecondPlace ?? 0,
        stats.totalThirdPlace ?? 0,
        stats.totalTopThree ?? 0,
        stats.totalCoinsEarned ?? 0,
        stats.currentWinStreak ?? 0,
        stats.longestWinStreak ?? 0,
        stats.racesThisWeek ?? 0,
        stats.racesThisSeason ?? 0,
        stats.uniqueNftsRaced ?? 0,
        stats.buffsUsed ?? 0,
        stats.mystatsRaceCount ?? 0,
        stats.mystatsPointsEarned ?? 0,
      ]
    );

    // Update streamers played
    if (Array.isArray(stats.mystatsStreamersPlayed)) {
      for (const streamerId of stats.mystatsStreamersPlayed) {
        await pool.execute(
          `INSERT IGNORE INTO mystats_streamers_played (user_id, streamer_id) VALUES (?, ?)`,
          [userId, streamerId]
        );
      }
    }

    res.json({ message: "Stats updated" });
  } catch (err) {
    console.error("Update stats error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

export default router;
