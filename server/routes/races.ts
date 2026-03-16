import { Router } from "express";
import pool from "../db.js";

const router = Router();

const MAX_PER_USER = 2;
// MIN_ENTRIES and MIN_ENTRIES_EXTENDED are enforced in the frontend lobby engine
const PREMIUM_ENTRY_FEE_PBP = 50;
const TREASURY_WALLET = "HtPe6EYLgmT3UzyZeBCLg5vX5JjsxpoggtXkRYYx6oN5";

// Prize split percentages for premium races
const PRIZE_SPLIT = { first: 0.40, second: 0.15, third: 0.10, treasury: 0.35 };

// ── Get current lobby ──────────────────────────────────────────────────

router.get("/lobby/current", async (req, res) => {
  try {
    const [lobbies] = await pool.execute(
      `SELECT * FROM race_lobbies WHERE status IN ('waiting', 'countdown')
       ORDER BY scheduled_time ASC LIMIT 1`
    );

    const lobby = (lobbies as any[])[0];
    if (!lobby) {
      res.json(null);
      return;
    }

    const [entries] = await pool.execute(
      `SELECT re.nft_id AS characterId, re.user_id AS userId
       FROM race_entries re
       WHERE re.race_id = ?`,
      [lobby.race_id]
    );

    res.json({
      id: lobby.id,
      raceId: lobby.race_id,
      scheduledTime: new Date(lobby.scheduled_time).getTime(),
      deadlineTime: new Date(lobby.deadline_time).getTime(),
      status: lobby.status,
      entries: entries,
      minEntries: MIN_ENTRIES,
      maxPerUser: MAX_PER_USER,
      mode: lobby.mode || "free",
      entryFeePBP: lobby.entry_fee_pbp || 0,
      prizePool: lobby.prize_pool || 0,
    });
  } catch (err) {
    console.error("Get lobby error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// ── Join lobby ─────────────────────────────────────────────────────────

router.post("/lobby/join", async (req, res) => {
  const { userId, characterId, raceId, mode } = req.body;

  if (!userId || !characterId || !raceId) {
    res.status(400).json({ error: "userId, characterId, and raceId required" });
    return;
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Verify user owns this NFT
    const [nfts] = await conn.execute(
      "SELECT id FROM nfts WHERE id = ? AND owner_id = ?",
      [characterId, userId]
    );
    if ((nfts as any[]).length === 0) {
      await conn.rollback();
      res.status(403).json({ error: "You don't own this NFT" });
      return;
    }

    // Check per-user limit
    const [userEntries] = await conn.execute(
      "SELECT COUNT(*) as cnt FROM race_entries WHERE race_id = ? AND user_id = ?",
      [raceId, userId]
    );
    if ((userEntries as any[])[0].cnt >= MAX_PER_USER) {
      await conn.rollback();
      res.status(400).json({ error: `Max ${MAX_PER_USER} NFTs per user per race` });
      return;
    }

    // No max entry limit — unlimited racers allowed

    // Check duplicate
    const [existing] = await conn.execute(
      "SELECT id FROM race_entries WHERE race_id = ? AND nft_id = ?",
      [raceId, characterId]
    );
    if ((existing as any[]).length > 0) {
      await conn.rollback();
      res.status(400).json({ error: "NFT already entered" });
      return;
    }

    // For premium races, record entry fee payment
    const isPremium = mode === "premium";
    if (isPremium) {
      // Record PBP payment to treasury
      await conn.execute(
        `INSERT INTO premium_race_payments (race_id, user_id, nft_id, amount_pbp, treasury_wallet)
         VALUES (?, ?, ?, ?, ?)`,
        [raceId, userId, characterId, PREMIUM_ENTRY_FEE_PBP, TREASURY_WALLET]
      );

      // Update lobby prize pool
      await conn.execute(
        `UPDATE race_lobbies SET prize_pool = prize_pool + ? WHERE race_id = ?`,
        [PREMIUM_ENTRY_FEE_PBP, raceId]
      );
    }

    await conn.execute(
      "INSERT INTO race_entries (race_id, nft_id, user_id) VALUES (?, ?, ?)",
      [raceId, characterId, userId]
    );

    await conn.commit();
    res.json({ message: "Entered race", entryFeePaid: isPremium ? PREMIUM_ENTRY_FEE_PBP : 0 });
  } catch (err) {
    await conn.rollback();
    console.error("Join lobby error:", err);
    res.status(500).json({ error: "Database error" });
  } finally {
    conn.release();
  }
});

// ── Leave lobby ────────────────────────────────────────────────────────

router.post("/lobby/leave", async (req, res) => {
  const { userId, characterId, raceId, mode } = req.body;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.execute(
      "DELETE FROM race_entries WHERE race_id = ? AND nft_id = ? AND user_id = ?",
      [raceId, characterId, userId]
    );

    // For premium races, refund entry fee and reduce prize pool
    if (mode === "premium") {
      await conn.execute(
        `DELETE FROM premium_race_payments WHERE race_id = ? AND user_id = ? AND nft_id = ?`,
        [raceId, userId, characterId]
      );
      await conn.execute(
        `UPDATE race_lobbies SET prize_pool = GREATEST(0, prize_pool - ?) WHERE race_id = ?`,
        [PREMIUM_ENTRY_FEE_PBP, raceId]
      );
    }

    await conn.commit();
    res.json({ message: "Withdrew from race" });
  } catch (err) {
    await conn.rollback();
    console.error("Leave lobby error:", err);
    res.status(500).json({ error: "Database error" });
  } finally {
    conn.release();
  }
});

// ── Save race results ──────────────────────────────────────────────────

router.post("/results", async (req, res) => {
  const { raceId, results, mode, prizePool } = req.body;

  if (!raceId || !Array.isArray(results)) {
    res.status(400).json({ error: "raceId and results array required" });
    return;
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Update race status
    await conn.execute(
      "UPDATE races SET status = 'finished', finished_at = NOW() WHERE id = ?",
      [raceId]
    );

    // Update lobby status
    await conn.execute(
      "UPDATE race_lobbies SET status = 'finished' WHERE race_id = ?",
      [raceId]
    );

    // Calculate premium prizes if applicable
    let premiumPrizes: Record<number, number> = {};
    if (mode === "premium" && typeof prizePool === "number" && prizePool > 0) {
      premiumPrizes = {
        1: Math.floor(prizePool * PRIZE_SPLIT.first),
        2: Math.floor(prizePool * PRIZE_SPLIT.second),
        3: Math.floor(prizePool * PRIZE_SPLIT.third),
      };
      const treasuryShare = Math.floor(prizePool * PRIZE_SPLIT.treasury);

      // Record season pool contribution
      const [seasons] = await conn.execute(
        "SELECT id FROM seasons WHERE is_active = TRUE LIMIT 1"
      );
      const seasonId = (seasons as any[])[0]?.id;
      if (seasonId) {
        await conn.execute(
          `INSERT INTO season_prize_pool (season_id, race_id, amount_pbp)
           VALUES (?, ?, ?)`,
          [seasonId, raceId, treasuryShare]
        );
      }
    }

    // Update each entry with results
    for (const r of results) {
      await conn.execute(
        `UPDATE race_entries
         SET placement = ?, finish_time = ?, points = ?
         WHERE race_id = ? AND nft_id = ?`,
        [r.placement, r.timeMs, r.pointsEarned, raceId, r.characterId]
      );

      // Record premium prize payouts
      const pbpPrize = premiumPrizes[r.placement] ?? 0;
      if (pbpPrize > 0) {
        await conn.execute(
          `INSERT INTO premium_race_payouts (race_id, nft_id, user_id, placement, amount_pbp)
           VALUES (?, ?, ?, ?, ?)`,
          [raceId, r.characterId, r.userId ?? "", r.placement, pbpPrize]
        );
      }

      // Update leaderboard
      const [seasons] = await conn.execute(
        "SELECT id FROM seasons WHERE is_active = TRUE LIMIT 1"
      );
      const seasonId = (seasons as any[])[0]?.id;
      if (seasonId) {
        await conn.execute(
          `INSERT INTO leaderboard (season_id, nft_id, points, race_count, race_wins)
           VALUES (?, ?, ?, 1, ?)
           ON DUPLICATE KEY UPDATE
             points = points + VALUES(points),
             race_count = race_count + 1,
             race_wins = race_wins + VALUES(race_wins)`,
          [seasonId, r.characterId, r.pointsEarned, r.placement === 1 ? 1 : 0]
        );
      }
    }

    await conn.commit();
    res.json({ message: "Results saved", premiumPrizes });
  } catch (err) {
    await conn.rollback();
    console.error("Save results error:", err);
    res.status(500).json({ error: "Database error" });
  } finally {
    conn.release();
  }
});

// ── Get season prize pool total ────────────────────────────────────────

router.get("/season-pool", async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT COALESCE(SUM(spp.amount_pbp), 0) AS totalPBP,
              COUNT(spp.id) AS totalRaces,
              s.id AS seasonId, s.name AS seasonName
       FROM seasons s
       LEFT JOIN season_prize_pool spp ON spp.season_id = s.id
       WHERE s.is_active = TRUE
       GROUP BY s.id`
    );
    const row = (rows as any[])[0];
    res.json({
      seasonId: row?.seasonId ?? null,
      seasonName: row?.seasonName ?? "Season 1",
      totalPBP: row?.totalPBP ?? 0,
      totalRaces: row?.totalRaces ?? 0,
      treasuryWallet: TREASURY_WALLET,
    });
  } catch (err) {
    console.error("Season pool error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// ── Get race history ───────────────────────────────────────────────────

router.get("/history", async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 20, 100);

  try {
    const [races] = await pool.execute(
      `SELECT r.id, r.name, r.status, r.scheduled_time, r.finished_at,
              rl.mode, rl.prize_pool
       FROM races r
       LEFT JOIN race_lobbies rl ON rl.race_id = r.id
       WHERE r.status = 'finished'
       ORDER BY r.finished_at DESC
       LIMIT ?`,
      [limit]
    );

    const result = [];
    for (const race of races as any[]) {
      const [entries] = await pool.execute(
        `SELECT re.nft_id, re.placement, re.finish_time, re.points, n.name AS nft_name
         FROM race_entries re
         JOIN nfts n ON n.id = re.nft_id
         WHERE re.race_id = ?
         ORDER BY re.placement ASC`,
        [race.id]
      );
      result.push({ ...race, entries });
    }

    res.json(result);
  } catch (err) {
    console.error("Race history error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// ── Get leaderboard ────────────────────────────────────────────────────

router.get("/leaderboard", async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT lb.nft_id, lb.points, lb.race_count, lb.race_wins,
              lb.battle_count, lb.battle_wins, n.name AS nft_name
       FROM leaderboard lb
       JOIN nfts n ON n.id = lb.nft_id
       JOIN seasons s ON s.id = lb.season_id AND s.is_active = TRUE
       ORDER BY lb.points DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error("Leaderboard error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

export default router;
