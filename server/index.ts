import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import walletRoutes from "./routes/wallets.js";
import nftRoutes from "./routes/nfts.js";
import raceRoutes from "./routes/races.js";
import progressionRoutes from "./routes/progression.js";
import economyRoutes from "./routes/economy.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// ── Middleware ──────────────────────────────────────────────────────────

app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json());

// ── Routes ─────────────────────────────────────────────────────────────

app.use("/api/auth", authRoutes);
app.use("/api/wallets", walletRoutes);
app.use("/api/nfts", nftRoutes);
app.use("/api/races", raceRoutes);
app.use("/api/progression", progressionRoutes);
app.use("/api/economy", economyRoutes);

// ── Health check ───────────────────────────────────────────────────────

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

// ── Start ──────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`CamWOW API server running on http://localhost:${PORT}`);
});
