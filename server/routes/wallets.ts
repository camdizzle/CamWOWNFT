import { Router } from "express";
import pool from "../db.js";

const router = Router();

// ── Add wallet to user ─────────────────────────────────────────────────

router.post("/", async (req, res) => {
  const { userId, address, label } = req.body;

  if (!userId || !address) {
    res.status(400).json({ error: "userId and address required" });
    return;
  }

  try {
    // Check if address already linked to another user
    const [existing] = await pool.execute(
      "SELECT user_id FROM wallets WHERE address = ?",
      [address]
    );
    if ((existing as any[]).length > 0) {
      const owner = (existing as any[])[0].user_id;
      if (owner !== userId) {
        res.status(409).json({ error: "Wallet already linked to another account" });
        return;
      }
      res.json({ message: "Wallet already connected" });
      return;
    }

    await pool.execute(
      "INSERT INTO wallets (user_id, address, label) VALUES (?, ?, ?)",
      [userId, address, label || null]
    );

    // Re-aggregate NFT ownership across all wallets for this user
    // In production, this would query the blockchain via RPC
    // For now, we trust the nfts table owner_id

    res.json({ message: "Wallet connected" });
  } catch (err) {
    console.error("Add wallet error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// ── Remove wallet ──────────────────────────────────────────────────────

router.delete("/:address", async (req, res) => {
  const { address } = req.params;
  const { userId } = req.body;

  if (!userId) {
    res.status(400).json({ error: "userId required" });
    return;
  }

  try {
    await pool.execute(
      "DELETE FROM wallets WHERE address = ? AND user_id = ?",
      [address, userId]
    );
    res.json({ message: "Wallet removed" });
  } catch (err) {
    console.error("Remove wallet error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// ── List wallets for user ──────────────────────────────────────────────

router.get("/user/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const [wallets] = await pool.execute(
      "SELECT address, label FROM wallets WHERE user_id = ?",
      [userId]
    );
    res.json(wallets);
  } catch (err) {
    console.error("List wallets error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

export default router;
