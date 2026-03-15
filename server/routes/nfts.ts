import { Router } from "express";
import pool from "../db.js";

const router = Router();

// ── Get all NFTs (with traits) ─────────────────────────────────────────

router.get("/", async (req, res) => {
  try {
    const [nfts] = await pool.execute(
      "SELECT id, name, image, owner_id FROM nfts ORDER BY id"
    );

    const [traits] = await pool.execute(
      "SELECT nft_id, trait_type, value FROM nft_traits ORDER BY nft_id, id"
    );

    const traitMap = new Map<string, { trait_type: string; value: string }[]>();
    for (const t of traits as any[]) {
      if (!traitMap.has(t.nft_id)) traitMap.set(t.nft_id, []);
      traitMap.get(t.nft_id)!.push({ trait_type: t.trait_type, value: t.value });
    }

    const result = (nfts as any[]).map((n) => ({
      id: n.id,
      name: n.name,
      image: n.image,
      ownerId: n.owner_id,
      traits: traitMap.get(n.id) || [],
    }));

    res.json(result);
  } catch (err) {
    console.error("Get NFTs error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// ── Get NFTs owned by a user ───────────────────────────────────────────

router.get("/user/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const [nfts] = await pool.execute(
      "SELECT id, name, image FROM nfts WHERE owner_id = ? ORDER BY id",
      [userId]
    );

    const nftIds = (nfts as any[]).map((n) => n.id);
    if (nftIds.length === 0) {
      res.json([]);
      return;
    }

    const placeholders = nftIds.map(() => "?").join(",");
    const [traits] = await pool.execute(
      `SELECT nft_id, trait_type, value FROM nft_traits WHERE nft_id IN (${placeholders}) ORDER BY nft_id, id`,
      nftIds
    );

    const traitMap = new Map<string, { trait_type: string; value: string }[]>();
    for (const t of traits as any[]) {
      if (!traitMap.has(t.nft_id)) traitMap.set(t.nft_id, []);
      traitMap.get(t.nft_id)!.push({ trait_type: t.trait_type, value: t.value });
    }

    const result = (nfts as any[]).map((n) => ({
      id: n.id,
      name: n.name,
      image: n.image,
      traits: traitMap.get(n.id) || [],
    }));

    res.json(result);
  } catch (err) {
    console.error("Get user NFTs error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

export default router;
