import { Router } from "express";
import pool from "../db.js";

const router = Router();

// ── Twitch OAuth callback ──────────────────────────────────────────────
// In production: exchange code for token, fetch user from Twitch API.
// This endpoint receives the Twitch user info after frontend OAuth flow.

router.post("/login", async (req, res) => {
  const { id, login, displayName, profileImageUrl } = req.body;

  if (!id || !login || !displayName) {
    res.status(400).json({ error: "Missing required Twitch user fields" });
    return;
  }

  try {
    // Upsert user
    await pool.execute(
      `INSERT INTO users (id, login, display_name, profile_image)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         login = VALUES(login),
         display_name = VALUES(display_name),
         profile_image = VALUES(profile_image)`,
      [id, login, displayName, profileImageUrl || ""]
    );

    // Fetch user with wallets and owned NFTs
    const [wallets] = await pool.execute(
      "SELECT address, label FROM wallets WHERE user_id = ?",
      [id]
    );

    const [nfts] = await pool.execute(
      "SELECT id FROM nfts WHERE owner_id = ?",
      [id]
    );

    res.json({
      user: {
        twitchUser: { id, login, displayName, profileImageUrl: profileImageUrl || "" },
        wallets,
        ownedNftIds: (nfts as any[]).map((n) => n.id),
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// ── Get user profile ───────────────────────────────────────────────────

router.get("/user/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const [users] = await pool.execute(
      "SELECT * FROM users WHERE id = ?",
      [userId]
    );
    const user = (users as any[])[0];
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const [wallets] = await pool.execute(
      "SELECT address, label FROM wallets WHERE user_id = ?",
      [userId]
    );

    const [nfts] = await pool.execute(
      "SELECT id FROM nfts WHERE owner_id = ?",
      [userId]
    );

    res.json({
      twitchUser: {
        id: user.id,
        login: user.login,
        displayName: user.display_name,
        profileImageUrl: user.profile_image,
      },
      wallets,
      ownedNftIds: (nfts as any[]).map((n) => n.id),
    });
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

export default router;
