# CamWOW Arena — Implementation Guide

> For the web development team. This document covers every system, file, API endpoint, database table, and integration point needed to ship CamWOW Arena to production.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Repository Structure](#3-repository-structure)
4. [Environment Setup](#4-environment-setup)
5. [Database Schema](#5-database-schema)
6. [Authentication & Wallet Flow](#6-authentication--wallet-flow)
7. [NFT Trait System & Stat Calculation](#7-nft-trait-system--stat-calculation)
8. [Race Engine](#8-race-engine)
9. [Battle Engine](#9-battle-engine)
10. [Progression System (XP & Leveling)](#10-progression-system-xp--leveling)
11. [Economy (Coins, Buffs, Achievements)](#11-economy-coins-buffs-achievements)
12. [Race Lobby & Scheduling](#12-race-lobby--scheduling)
13. [Monetization & Premium Economy](#13-monetization--premium-economy)
14. [API Reference](#14-api-reference)
15. [Frontend Architecture](#15-frontend-architecture)
16. [Integration Notes for Your Users Table](#16-integration-notes-for-your-users-table)
17. [Deployment Checklist](#17-deployment-checklist)

---

## 1. Project Overview

CamWOW Arena is a marble racing + battle game built around CamWOW Series 1 NFTs. Each NFT's visual traits (Skin, Eyes, Headwear, etc.) map to 6 gameplay stats that drive race and battle outcomes. Users log in via Twitch, link their Solana wallet to prove NFT ownership, then enter their marbles into scheduled races.

**Core game loop:**
1. User connects Twitch + wallet
2. System detects owned CamWOW NFTs and calculates their stats from traits
3. User enters NFTs into the next scheduled race lobby (every 4 hours)
4. Race simulates deterministically with seeded RNG (replayable)
5. Results award leaderboard points, coins, XP, and achievement progress
6. Coins buy consumable buffs from the shop for future races
7. Seasonal leaderboard tracks cumulative performance

---

## 2. Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | React 19 + TypeScript 5.9 | Vite 8 for dev/build |
| Backend | Express 5 + TypeScript | Run via `tsx watch` in dev |
| Database | MySQL (mysql2/promise) | Connection pooling, transactions |
| Auth | Twitch OAuth2 (implicit grant) | Mock users available for dev |
| NFT Platform | LaunchMyNFT (Solana) | Wallet verification via RPC |

**Key dependencies:**
```
react, react-dom, express, cors, dotenv, mysql2, tsx, vite, typescript
```

---

## 3. Repository Structure

```
CamWOWNFT/
├── server/                    # Express API backend
│   ├── index.ts               # App entry, middleware, route mounting
│   ├── db.ts                  # MySQL connection pool
│   ├── schema.sql             # Full database DDL
│   └── routes/
│       ├── auth.ts            # POST /api/auth/login, GET /api/auth/user/:userId
│       ├── wallets.ts         # POST/DELETE/GET /api/wallets
│       ├── nfts.ts            # GET /api/nfts, GET /api/nfts/user/:userId
│       ├── races.ts           # Lobby join/leave, results, leaderboard
│       ├── progression.ts     # Per-NFT stat XP/levels
│       └── economy.ts         # Coins, buffs, achievements, player stats
│
├── src/                       # React frontend
│   ├── main.tsx               # React DOM entry
│   ├── App.tsx                # Root component, page routing, nav
│   ├── App.css                # Global styles
│   │
│   ├── types/
│   │   └── nft.ts             # All TypeScript interfaces (NFT, Race, Battle, etc.)
│   │
│   ├── data/
│   │   ├── traitStatMap.ts    # Trait → stat modifier mapping (11 categories)
│   │   └── sampleCollection.ts # 5 representative NFT profiles
│   │
│   ├── engines/               # Pure game logic (no React dependencies)
│   │   ├── marbleRace.ts      # Race simulation (tick-based, seeded RNG)
│   │   ├── battle.ts          # 1v1 battle simulation
│   │   ├── buffs.ts           # Buff catalog + types (21 buffs, dual currency)
│   │   ├── progression.ts     # XP/level system per NFT stat
│   │   ├── raceLobby.ts       # Lobby scheduling, join/leave, free/premium modes
│   │   ├── seasonPool.ts      # Season prize pool tracking (PBP tokens)
│   │   └── achievements.ts    # Achievement definitions + evaluation
│   │
│   ├── hooks/                 # React state hooks
│   │   ├── useAuth.ts         # Twitch login, wallet management, session cache
│   │   ├── useProgression.ts  # NFT stat progression state
│   │   └── useEconomy.ts      # Coins, inventory, achievements, rewards
│   │
│   ├── api/
│   │   └── client.ts          # API client (fetch wrapper for all endpoints)
│   │
│   ├── pages/
│   │   ├── CollectionPage.tsx  # NFT gallery with stat cards
│   │   ├── RacePage.tsx        # Race lobby + live race view
│   │   ├── BattlePage.tsx      # 1v1 battle picker
│   │   ├── LeaderboardPage.tsx # Season rankings
│   │   └── ShopPage.tsx        # Buff shop + achievements panel
│   │
│   └── components/
│       ├── AuthBar.tsx         # Login/logout UI in nav
│       ├── Onboarding.tsx      # Wallet connection flow
│       ├── CharacterCard.tsx   # NFT stat display card
│       ├── StatBar.tsx         # Stat bar with color/icon
│       ├── ProgressionDisplay.tsx # XP progress bars
│       ├── RaceTrack.tsx       # Live race animation
│       ├── RaceSchedule.tsx    # Upcoming race times
│       ├── RaceLobby.tsx       # Lobby entry UI
│       ├── BattleArena.tsx     # Battle animation + round log
│       ├── Leaderboard.tsx     # Leaderboard table
│       ├── BuffShop.tsx        # Unified dual-currency buff shop (coins + SOL)
│       ├── SeasonPoolGauge.tsx # Visual gauge for season PBP prize pool
│       ├── AchievementsPanel.tsx # Achievement grid
│       └── WalletManager.tsx   # Wallet add/remove UI
│
├── package.json
├── tsconfig.json
├── vite.config.ts
└── eslint.config.js
```

---

## 4. Environment Setup

### 4.1 Environment Variables

Create a `.env` file in the project root:

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=camwow
DB_PASSWORD=your_password
DB_NAME=camwow_arena

# Server
PORT=3001
FRONTEND_URL=http://localhost:5173

# Twitch OAuth (replace with your app credentials)
# Used in src/hooks/useAuth.ts — update TWITCH_CLIENT_ID there too
VITE_TWITCH_CLIENT_ID=your_twitch_client_id

# API URL (frontend uses this)
VITE_API_URL=http://localhost:3001/api
```

### 4.2 Database Init

```bash
mysql -u root -p < server/schema.sql
```

This creates the `camwow_arena` database with all tables and inserts an initial Season 1.

### 4.3 Development

```bash
npm install
npm run dev:all    # Starts Vite frontend + Express backend concurrently
```

- Frontend: `http://localhost:5173`
- API: `http://localhost:3001`

### 4.4 Production Build

```bash
npm run build      # TypeScript compile + Vite production build
```

Output goes to `dist/`. Serve with any static file server. The Express backend needs to be run separately (e.g., via PM2, Docker, or your hosting platform).

---

## 5. Database Schema

> **File:** `server/schema.sql`

All tables use the `camwow_arena` database. Below is every table with its purpose and key columns.

### Core Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `users` | Twitch accounts | `id` (twitch ID), `login`, `display_name`, `profile_image` |
| `wallets` | Solana wallets linked to users | `user_id` → users, `address` (UNIQUE), `label` |
| `nfts` | NFT metadata | `id` (e.g. "cam-420"), `name`, `image`, `owner_id` → users |
| `nft_traits` | Individual trait records per NFT | `nft_id` → nfts, `trait_type`, `value` |

### Gameplay Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `stat_progression` | Per-NFT, per-stat XP and levels | `nft_id`, `stat_key` (ENUM of 6 stats), `xp`, `level` |
| `seasons` | Season definitions | `name`, `start_date`, `end_date`, `is_active` |
| `races` | Race records | `season_id`, `status`, `scheduled_time`, `seed` |
| `race_entries` | NFTs entered in a race | `race_id`, `nft_id`, `user_id`, `placement`, `finish_time`, `points` |
| `race_lobbies` | Active lobby state | `race_id`, `scheduled_time`, `deadline_time`, `status`, `mode`, `entry_fee_pbp`, `prize_pool` |
| `battles` | Battle records | `challenger_id`, `opponent_id`, `winner_id`, `seed` |
| `leaderboard` | Denormalized season rankings | `season_id`, `nft_id`, `points`, `race_count`, `race_wins`, etc. |

### Economy Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `user_coins` | Coin balance per user | `user_id`, `balance`, `total_earned` |
| `buff_inventory` | Owned buff quantities | `user_id`, `buff_id`, `quantity` |
| `user_achievements` | Unlocked achievements | `user_id`, `achievement_id`, `unlocked_at` |
| `player_stats` | Aggregated player metrics | `user_id`, 15+ stat columns (wins, streaks, etc.) |
| `mystats_streamers_played` | Unique streamers a user has raced in | `user_id`, `streamer_id` |
| `race_buff_usage` | Audit log of buffs used in races | `race_id`, `nft_id`, `buff_id`, `triggered` |

### Premium Economy Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `premium_race_payments` | PBP entry fee audit log | `race_id`, `user_id`, `nft_id`, `amount_pbp`, `treasury_wallet` |
| `premium_race_payouts` | PBP prize distributions | `race_id`, `nft_id`, `placement`, `amount_pbp` |
| `season_prize_pool` | 35% of premium fees → season pool | `season_id`, `race_id`, `amount_pbp` |
| `sol_purchases` | All SOL transactions (buff buys) | `user_id`, `item_type`, `item_id`, `sol_amount`, `tx_signature` |

### Key Relationships

```
users ──< wallets
users ──< nfts (owner_id)
nfts  ──< nft_traits
nfts  ──< stat_progression
nfts  ──< race_entries
nfts  ──< leaderboard
races ──< race_entries
races ──< race_lobbies
users ──< user_coins
users ──< buff_inventory
users ──< user_achievements
users ──< player_stats
```

---

## 6. Authentication & Wallet Flow

### 6.1 Twitch Login

**File:** `src/hooks/useAuth.ts`

The app uses Twitch OAuth2 implicit grant flow:

1. User clicks "Login with Twitch" → redirects to Twitch authorize URL
2. Twitch redirects back with access token in URL fragment
3. Frontend extracts token, calls Twitch API to get user info
4. Frontend POSTs user info to `POST /api/auth/login`
5. Backend upserts user in `users` table, returns full account with wallets and owned NFTs
6. Frontend caches account in `localStorage` under key `camwow_user`

**Mock login** is available for development — 3 predefined test users ("camdizzle", "player2", "nftcollector"). Called via `auth.loginMock(0)`.

**Production TODO:** Replace `TWITCH_CLIENT_ID` in `useAuth.ts:9` with your real Twitch application client ID.

### 6.2 Wallet Connection

**File:** `src/components/WalletManager.tsx`, `server/routes/wallets.ts`

After Twitch login, users must connect at least one Solana wallet:

1. User enters wallet address (or connects via Phantom/Solflare adapter)
2. Frontend calls `POST /api/wallets` with `{ userId, address, label }`
3. Backend checks the address isn't already linked to another user (409 if so)
4. Backend inserts into `wallets` table
5. Frontend refreshes user data to pick up newly detected NFTs

**Production TODO:** Implement on-chain wallet verification. Current code trusts the submitted address. You should:
- Require a signed message from the wallet to prove ownership
- Query Solana RPC (or LaunchMyNFT API) to scan wallet for CamWOW NFTs
- Auto-populate the `nfts` and `nft_traits` tables from on-chain metadata

### 6.3 NFT Ownership Detection

**File:** `server/routes/nfts.ts`

Currently, NFT ownership is tracked via `nfts.owner_id`. In production:

1. When a wallet is linked, query Solana RPC for all NFTs in that wallet matching your collection mint
2. For each detected NFT: upsert into `nfts` table with traits from on-chain metadata
3. Set `owner_id` to the user who owns the wallet
4. Re-aggregate ownership when wallets are added/removed

---

## 7. NFT Trait System & Stat Calculation

### 7.1 Trait Categories (11 slots)

**File:** `src/data/traitStatMap.ts`

Each CamWOW NFT can have traits in up to 11 categories:

| # | Category | Example Values | Primary Stat |
|---|----------|---------------|--------------|
| 1 | Skin | Solid Gold, Diamond, Bronze, OG | Charisma / Toughness |
| 2 | Eyes | Cyborg Eyes, Sunglasses, Squint | Speed / Charisma |
| 3 | Headwear | Bronze Crown, Helmet, Beanie | Charisma / Toughness |
| 4 | Clothing | Gold Armor, Suit, Plain Tee | Toughness / Charisma |
| 5 | Accessory | Diamond Chain, Skateboard, Backpack | Charisma / Speed |
| 6 | Background | 420, Galaxy, Plain | Luck |
| 7 | Mouth | Gold Grill, Cigar, Grin | Charisma |
| 8 | Facial Hair | Gold Mustache, Full Beard, None | Charisma / Toughness |
| 9 | Ears | Diamond Studs, Gold Hoops, None | Luck / Charisma |
| 10 | Tattoo | Full Sleeve, Tribal Mark, None | Toughness |
| 11 | Special | CamWOW Logo, 420 Badge, None | Charisma / Luck |

**Empty slots contribute +0.** This is the primary driver of the power gap between common and legendary NFTs.

### 7.2 Tier System

Each trait value falls into a tier based on its stat bonuses:

| Tier | Primary Bonus | Secondary Bonus | Total per Slot |
|------|-------------|----------------|----------------|
| S-tier | +4 | +1 | 5 |
| A-tier | +3 | +1 | 4 |
| B-tier | +2 | — | 2 |
| C-tier | +1 | — | 1 |

### 7.3 Stat Calculation

**Function:** `calculateStats(traits)` in `traitStatMap.ts`

```
Base stats: { speed: 5, toughness: 5, charisma: 5, luck: 5, stamina: 5, agility: 5 }

For each trait:
  Look up trait_type → value in TRAIT_STAT_MAP
  Add each modifier to the corresponding stat

Total Power = sum of all 6 stats
```

### 7.4 Power Curve (reference profiles)

**File:** `src/data/sampleCollection.ts`

| Tier | NFT | Slots Filled | Total Power |
|------|-----|-------------|-------------|
| Legend | The 420 | 11/11 | 76 |
| Gold | Golden Sage | 10/11 | 66 |
| Silver | Silver Sentinel | 9/11 | 57 |
| Bronze | Bronze Brawler | 9/11 | 45 |
| Common | Everyday Cam | 6/11 | 36 |

**Power ratio (Legend/Common): 2.1x** — competitive but not guaranteed.

### 7.5 Soft Cap (Diminishing Returns)

**File:** `src/engines/marbleRace.ts`, lines 47-54

To prevent extreme stat values (like charisma=32) from dominating races, all stats are soft-capped before use in the race engine:

```typescript
const SOFT_CAP_KNEE = 15;

function softCap(raw: number): number {
  if (raw <= SOFT_CAP_KNEE) return raw;
  const excess = raw - SOFT_CAP_KNEE;
  return SOFT_CAP_KNEE + Math.sqrt(excess) * 2;
}
```

| Raw Stat | Effective |
|----------|-----------|
| 5 | 5.0 |
| 10 | 10.0 |
| 15 | 15.0 |
| 20 | 19.5 |
| 25 | 21.3 |
| 32 | 23.2 |

Stats at or below 15 are unaffected. The cap only compresses outliers.

---

## 8. Race Engine

**File:** `src/engines/marbleRace.ts`

### 8.1 Overview

- **Tick-based simulation:** 100ms per tick, race distance = 100 position units
- **Deterministic:** Seeded RNG produces identical results for the same seed (enables replays)
- **Points by placement:** 1st=100, 2nd=70, 3rd=50, 4th=35, 5th=25, 6th=15, 7th=10, 8th=5, 9th+=3

### 8.2 Per-Tick Movement Formula

Each tick, every racer's position advances by:

```
1. BASE MOVEMENT
   move = 0.3 + (speed / 30) * 1.2
   → Speed 5 = 0.5 units/tick, Speed 15 = 0.9 units/tick

2. FATIGUE (after position > 50 + stamina*2)
   Reduces move by up to 40%. Higher stamina delays onset AND softens penalty.

3. AGILITY SHORTCUT (RNG: agility * 0.008 chance per tick)
   If triggered: move += 1.5

4. LUCK BURST (RNG: luck * 0.006 chance per tick)
   If triggered: move += 2.0

5. COLLISION (RNG: 8% chance per tick)
   Penalty: max(0.1, 1.2 - toughness * 0.06)

6. CHARISMA CROWD BOOST (RNG: charisma * 0.005, only after position 70)
   If triggered: move += 1.0

7. RANDOM VARIANCE
   move += (rand() - 0.5) * 0.6    // ±0.3 units
   move = max(0.05, move)           // floor
```

### 8.3 Buff Effects in Races

Buffs modify the per-tick formula. See [Section 11](#11-economy-coins-buffs-achievements) for the full buff catalog.

| Buff | Effect | Rarity |
|------|--------|--------|
| Turbo Charger | +15% base speed | Rare |
| Energy Drink | Fatigue delayed by 15 position units | Common |
| Clone Sprint | 3x agility shortcut chance | Epic |
| Lucky Penny / Four-Leaf Clover | 2x luck stat | Common / Uncommon |
| Rubber Bumpers | 75% collision penalty reduction | Uncommon |
| Shield Wall | Immune to ALL collisions | Rare |
| Ghost Mode | Immune to collisions for first 40% | Legendary |
| Crowd Frenzy | Charisma boost activates at 40% instead of 70% | Rare |
| Nitro Boost | +30% speed burst once (random trigger) | Common |
| Head Start | Start at position 5 | Uncommon |
| Slipstream | +1.2/tick if 2nd-4th place after position 80 | Uncommon |
| Banana Peel | Random opponent loses 3 position units | Common |
| Earthquake | ALL racers knocked back 2-6 units at 50% mark | Epic |
| Time Warp | Swap position with racer ahead at 60% mark | Epic |
| Photo Finish | If within 0.5s of winner, also get 1st place points | Legendary |

**Max 2 buffs per NFT per race.** Buffs are consumed on use.

### 8.4 Using the Race Simulator

```typescript
import { createRace, createRaceSimulator, simulateRace } from "./engines/marbleRace";

// Option 1: Run to completion
const race = createRace("race-001", "Grand Prix", characters, Date.now());
const finished = simulateRace(race, characters, seed);
console.log(finished.results); // [{characterId, placement, timeMs, pointsEarned}]

// Option 2: Tick-by-tick (for animation)
const sim = createRaceSimulator(race, characters, seed, activeBuffs);
while (!sim.isFinished()) {
  const entries = sim.tick(); // [{characterId, position, finishTime?}]
  // Render positions...
}
const results = sim.getResults();
```

---

## 9. Battle Engine

**File:** `src/engines/battle.ts`

### 9.1 Overview

1v1 turn-based battles between NFTs. Max 20 rounds. Deterministic with seeded RNG.

### 9.2 How Stats Affect Battles

| Stat | Battle Effect |
|------|--------------|
| **Toughness** | HP pool (+3 per point) + damage reduction (2% per point) |
| **Stamina** | HP pool (+2 per point) + late-round damage reduction |
| **Speed** | Initiative (who attacks first) + base damage (+0.4 per point) + dodge chance |
| **Agility** | Dodge chance (2% per point) |
| **Luck** | Critical hit chance (2.5% per point, 1.8x damage) |
| **Charisma** | Intimidation (1.5% chance per point to reduce incoming damage by 40%) |

### 9.3 HP Formula

```
HP = 50 + (toughness * 3) + (stamina * 2)
```

### 9.4 Battle Flow

1. Determine initiative (higher speed + RNG)
2. Each round: both fighters attack in initiative order
3. Per attack: calculate base damage → check dodge → check crit → check intimidation → apply toughness reduction → apply stamina reduction (after round 5)
4. Fight ends when one fighter hits 0 HP, or after 20 rounds (higher HP% wins)

---

## 10. Progression System (XP & Leveling)

**File:** `src/engines/progression.ts`

### 10.1 Overview

Each NFT has independent XP/level progression for all 6 stats. Progression adds flat bonuses to base stats (max +15 per stat).

### 10.2 XP Gains Per Race

| Placement | XP Earned | Target Stat |
|-----------|----------|-------------|
| 1st | 3 XP | Highest base stat (reinforce strength) |
| 2nd | 2 XP | Speed (the racing stat) |
| 3rd | 1 XP | Lowest base stat (shore up weakness) |
| Everyone | 1 XP | Stamina (participation reward) |

### 10.3 XP Requirements (Escalating)

```
Level 1:  10 XP
Level 2:  25 XP
Level 3:  50 XP
Level 5:  ~117 XP
Level 10: ~631 XP
Level 15: ~18,950 XP (max)
```

Formula: `xpForLevel(n) = floor(10 * n^1.6)`

Takes **100+ wins to max a single stat**. Maxing all 6 stats requires thousands of races.

### 10.4 Effective Stats

```typescript
effectiveSpeed = baseSpeed + progression.statProgress.speed.level
// ... same for all 6 stats
```

The progression bonus is applied BEFORE the race soft cap, so high-progression NFTs still get diminishing returns on extreme stats.

---

## 11. Economy (Coins, Buffs, Achievements)

### 11.1 Coin Sources

**File:** `src/engines/achievements.ts`

| Source | Amount |
|--------|--------|
| 1st place | 25 coins |
| 2nd place | 15 coins |
| 3rd place | 10 coins |
| 4th place | 6 coins |
| 5th-8th | 2-4 coins |
| Participation | 2 coins (everyone who races) |
| Achievements | 10-10,000 coins per unlock |

**Economy pace:** ~15 coins/race average. Common buffs cost 30-40 coins, so one buff every 2-3 races.

### 11.2 Buff Catalog (Dual Currency)

**File:** `src/engines/buffs.ts`

21 buffs across 5 rarity tiers. Regular buffs can be purchased with **coins OR SOL**. Premium buffs are **SOL-only**.

#### Regular Buffs (Coins or SOL)

| Rarity | Coin Cost | SOL Price | Examples |
|--------|-----------|-----------|---------|
| Common | 30-40 | 0.005-0.007 | Nitro Boost, Banana Peel, Energy Drink, Lucky Penny |
| Uncommon | 60-80 | 0.01-0.013 | Slipstream, Four-Leaf Clover, Rubber Bumpers, Head Start |
| Rare | 100-140 | 0.018-0.025 | Shield Wall, Crowd Frenzy, Turbo Charger |
| Epic | 200-250 | 0.04-0.05 | Earthquake, Time Warp, Clone Sprint |
| Legendary | 400-450 | 0.08-0.09 | Ghost Mode, Photo Finish |

#### Premium Buffs (SOL Only)

| Buff | Rarity | SOL Price | Effect |
|------|--------|-----------|--------|
| Warp Drive | Legendary | 0.15 | Teleport to 1st place at 75% mark |
| Gravity Well | Epic | 0.08 | Pull nearby opponents back 5% at 50% mark |
| Mirror Image | Epic | 0.07 | Copy the best buff active in the race |
| Golden Ticket | Rare | 0.03 | +50% coin earnings from this race |
| Adrenaline Surge | Uncommon | 0.02 | +40% speed burst when dropping below 4th |

All SOL purchases are sent to the treasury wallet: `HtPe6EYLgmT3UzyZeBCLg5vX5JjsxpoggtXkRYYx6oN5`

### 11.3 Achievements

**File:** `src/engines/achievements.ts`

40+ achievements across 5 categories:

- **Streamer:** Race in X different MyStats streamers' lobbies (1, 10, 25, 50, 100)
- **Race count:** Complete X races (1, 50, 100, 250, 500, 1000, 10000)
- **Wins/Placement:** Win X races, finish top 3 X times, finish 2nd X times
- **Streaks:** Win X races in a row (3, 5, 10)
- **Milestones:** Race with 3 different NFTs, use buffs, weekly race counts, MyStats points

Each achievement awards a one-time coin bonus on unlock.

---

## 12. Race Lobby & Scheduling

**File:** `src/engines/raceLobby.ts`

### 12.1 Schedule

- Races run every **4 hours** (6 races per day)
- At scheduled time, lobby opens for entries
- **Minimum 6 entries** required to start normally
- **No maximum racer cap** — unlimited entries allowed
- **Maximum 2 NFTs per user** per race
- **Two modes:** Free (earn coins) and Premium (50 PBP entry fee with prize pool)

### 12.2 Lobby States

```
waiting → countdown → racing → finished
```

1. **waiting:** Accepting entries. If < 6 entries at deadline, extends by 15 min (max 8 extensions = 2 hours)
2. **After max extensions:** Minimum drops to **3 racers** (race starts with 3+, never cancels)
3. **countdown:** Min entries met. 30-second countdown before race starts
4. **racing:** Race simulation running
5. **finished:** Results recorded

### 12.3 Race Modes

| Mode | Entry Fee | Coin Rewards | Prize Pool |
|------|-----------|-------------|------------|
| **Free** | None | Yes (placement coins) | None |
| **Premium** | 50 PBP per NFT | Yes (placement coins) | 40% 1st, 15% 2nd, 10% 3rd, 35% season pool |

Premium race entry fees are deposited to the treasury wallet. Prize pool payouts are in PBP tokens.

### 12.4 Lobby Flow (Server-Side)

```
POST /api/races/lobby/join   { userId, characterId, raceId, mode? }
  → Validates: user owns NFT, per-user limit, no duplicate
  → For premium: records PBP payment, updates prize pool
  → Uses transaction for race condition safety

POST /api/races/lobby/leave  { userId, characterId, raceId, mode? }
  → Removes entry
  → For premium: refunds PBP from prize pool

GET  /api/races/lobby/current
  → Returns active lobby with entries, mode, prize pool
```

---

## 13. Monetization & Premium Economy

### 13.1 Revenue Streams

The platform generates revenue through two channels:

1. **SOL Buff Sales** — Users buy buffs with SOL (sent to treasury wallet)
2. **Premium Race Entry Fees** — 50 PBP per NFT per premium race (35% retained in treasury)

**Treasury Wallet:** `HtPe6EYLgmT3UzyZeBCLg5vX5JjsxpoggtXkRYYx6oN5`

### 13.2 Premium Race Economy

```
Entry Fee: 50 PBP per NFT per race
  ├── 40% → 1st place winner
  ├── 15% → 2nd place
  ├── 10% → 3rd place
  └── 35% → Season Prize Pool (treasury)
```

**Example:** 10 entrants = 500 PBP pool
- 1st: 200 PBP | 2nd: 75 PBP | 3rd: 50 PBP | Season Pool: 175 PBP

### 13.3 Season Prize Pool

**Files:** `src/engines/seasonPool.ts`, `src/components/SeasonPoolGauge.tsx`

The season prize pool accumulates 35% of all premium race entry fees throughout the season. At season end, the pool is distributed as PBP token prizes from the treasury wallet based on leaderboard standings.

A visual **gauge component** (`SeasonPoolGauge`) is displayed on the race page, showing:
- Current PBP total in the season pool
- Number of premium races that contributed
- Treasury wallet address (abbreviated)

This drives competition by making the growing pot visible to all players.

### 13.4 Unified Buff Shop (Dual Currency)

**File:** `src/components/BuffShop.tsx`

The shop displays all buffs in a single interface with dual-currency pricing:

- **Regular buffs** (16): Show both coin price and SOL price. User chooses which to pay with.
- **Premium buffs** (5): SOL-only. Marked with "SOL ONLY" badge. Cannot be purchased with coins.
- **Filter tabs:** All | Common | Uncommon | Rare | Epic | Legendary | SOL Only

SOL purchases trigger a Solana wallet transaction to the treasury wallet. In production, the server validates the on-chain transaction signature before crediting the buff.

### 13.5 SOL Transaction Flow

1. User clicks "Buy (SOL)" on a buff
2. Frontend creates a SOL transfer instruction to treasury wallet
3. User signs the transaction with their connected Solana wallet (Phantom, etc.)
4. On confirmation, frontend calls `POST /api/economy/:userId/buffs/buy-sol` with the tx signature
5. Server records the purchase in `sol_purchases` table and credits the buff to inventory

**Production TODO:** Server-side Solana RPC verification of `tx_signature` before crediting buffs.

---

## 14. API Reference

**Base URL:** `http://localhost:3001/api`

### 14.1 Auth

| Method | Path | Body | Returns |
|--------|------|------|---------|
| POST | `/auth/login` | `{ id, login, displayName, profileImageUrl }` | `{ user: { twitchUser, wallets, ownedNftIds } }` |
| GET | `/auth/user/:userId` | — | `{ twitchUser, wallets, ownedNftIds }` |

### Wallets

| Method | Path | Body | Returns |
|--------|------|------|---------|
| POST | `/wallets` | `{ userId, address, label? }` | `{ message }` |
| DELETE | `/wallets/:address` | `{ userId }` | `{ message }` |
| GET | `/wallets/user/:userId` | — | `[{ address, label }]` |

### NFTs

| Method | Path | Returns |
|--------|------|---------|
| GET | `/nfts` | `[{ id, name, image, ownerId, traits }]` |
| GET | `/nfts/user/:userId` | `[{ id, name, image, traits }]` |

### Races

| Method | Path | Body | Returns |
|--------|------|------|---------|
| GET | `/races/lobby/current` | — | Lobby object (with `mode`, `prizePool`) or `null` |
| POST | `/races/lobby/join` | `{ userId, characterId, raceId, mode? }` | `{ message, entryFeePaid? }` |
| POST | `/races/lobby/leave` | `{ userId, characterId, raceId, mode? }` | `{ message }` |
| POST | `/races/results` | `{ raceId, results[], mode?, prizePool? }` | `{ message, premiumPrizes? }` |
| GET | `/races/season-pool` | — | `{ seasonId, totalPBP, totalRaces, treasuryWallet }` |
| GET | `/races/history?limit=20` | — | `[{ race, entries[], mode, prize_pool }]` |
| GET | `/races/leaderboard` | — | `[{ nft_id, points, ... }]` |

### Progression

| Method | Path | Body | Returns |
|--------|------|------|---------|
| GET | `/progression/:nftId` | — | `{ nftId, statProgress }` |
| POST | `/progression/batch` | `{ nftIds[] }` | `{ [nftId]: statProgress }` |
| PUT | `/progression/:nftId` | `{ statProgress }` | `{ message }` |

### Economy

| Method | Path | Body | Returns |
|--------|------|------|---------|
| GET | `/economy/:userId` | — | `{ coins, inventory, achievements, playerStats }` |
| POST | `/economy/:userId/coins/add` | `{ amount }` | `{ message }` |
| POST | `/economy/:userId/buffs/buy` | `{ buffId, cost }` | `{ message }` |
| POST | `/economy/:userId/buffs/buy-sol` | `{ buffId, solPrice, txSignature? }` | `{ message, treasuryWallet }` |
| POST | `/economy/:userId/buffs/consume` | `{ buffId }` | `{ message }` |
| POST | `/economy/:userId/achievements/unlock` | `{ achievementId, coinReward }` | `{ message }` |
| POST | `/economy/:userId/stats` | PlayerStats object | `{ message }` |

### Health

| Method | Path | Returns |
|--------|------|---------|
| GET | `/health` | `{ status: "ok", timestamp }` |

---

## 15. Frontend Architecture

### 15.1 State Management

No Redux or external state library — the app uses three custom hooks:

| Hook | File | Manages |
|------|------|---------|
| `useAuth` | `src/hooks/useAuth.ts` | User session, wallet connections, NFT ownership |
| `useProgression` | `src/hooks/useProgression.ts` | Per-NFT XP/level state |
| `useEconomy` | `src/hooks/useEconomy.ts` | Coins, buff inventory, achievements, player stats |

All hooks implement **optimistic local updates** with **fire-and-forget server sync**. If the API is unreachable, the app continues working from localStorage cache. On next login, data syncs from server.

### 15.2 Data Flow

```
On mount:
  1. Load cached user from localStorage
  2. If cached, silently refresh from GET /api/auth/user/:userId
  3. Load economy data from GET /api/economy/:userId
  4. Load progression for owned NFTs from POST /api/progression/batch

On race complete:
  1. Race engine runs locally (deterministic)
  2. Results posted to POST /api/races/results
  3. Progression updated via PUT /api/progression/:nftId
  4. Economy rewards processed locally, synced to server
  5. Achievement evaluation runs, new unlocks posted to server
```

### 15.3 Pages

| Page | Route/State | Key Components |
|------|------------|----------------|
| Collection | `page === "collection"` | CharacterCard, StatBar, ProgressionDisplay |
| Race | `page === "race"` | RaceLobby, RaceTrack, RaceSchedule |
| Battle | `page === "battle"` | BattleArena |
| Leaderboard | `page === "leaderboard"` | Leaderboard |
| Shop | `page === "shop"` | BuffShop, AchievementsPanel |

### 15.4 API Client

**File:** `src/api/client.ts`

The `apiFetch<T>()` wrapper handles JSON content-type headers and error parsing. All API modules are exported as objects (`authApi`, `walletApi`, `nftApi`, `raceApi`, `progressionApi`, `economyApi`).

The base URL is set by `VITE_API_URL` environment variable (defaults to `http://localhost:3001/api`).

---

## 16. Integration Notes for Your Users Table

Since you already have your own users table with wallet info, here's how to adapt:

### 16.1 Replace the `users` and `wallets` Tables

The codebase uses two tables for this: `users` (Twitch accounts) and `wallets` (Solana addresses). You can replace both with your existing users table. The key foreign key is `user_id` (VARCHAR(64)), which is used throughout the schema as:

- `nfts.owner_id`
- `race_entries.user_id`
- `user_coins.user_id`
- `buff_inventory.user_id`
- `user_achievements.user_id`
- `player_stats.user_id`

**What to do:**

1. **Drop** the `users` and `wallets` tables from `schema.sql`
2. **Update all foreign keys** referencing `users(id)` to point to your users table's primary key instead
3. **Update `server/routes/auth.ts`** — Replace the login/upsert logic with your auth system. The route should still return the same shape:
   ```json
   {
     "user": {
       "twitchUser": { "id": "...", "login": "...", "displayName": "...", "profileImageUrl": "..." },
       "wallets": [{ "address": "...", "label": "..." }],
       "ownedNftIds": ["cam-420", "cam-005"]
     }
   }
   ```
4. **Update `server/routes/wallets.ts`** — Adapt wallet CRUD to read/write from your users table's wallet column(s)
5. **Update `src/hooks/useAuth.ts`** — Adapt the auth flow to your login system. The frontend expects a `UserAccount` object with `twitchUser`, `wallets`, and `ownedNftIds` fields

### 16.2 NFT Ownership Detection

The `nfts.owner_id` column links NFTs to users. When a user's wallet is known:

1. Query Solana RPC for CamWOW NFTs in that wallet
2. Upsert each NFT into the `nfts` table with metadata from on-chain
3. Parse trait metadata and insert rows into `nft_traits`
4. Set `owner_id` to your user's ID

You can do this on wallet link, on login, or on a periodic cron job.

### 16.3 Where `userId` Is Used

Every API route and hook that references `userId` expects a string matching the primary key in your users table. Grep for `userId` or `user_id` to find all usage points:

- **Server routes:** `auth.ts`, `wallets.ts`, `races.ts`, `economy.ts`
- **Frontend hooks:** `useAuth.ts`, `useEconomy.ts`
- **API client:** `client.ts` (passes userId to all server calls)
- **Database:** Every table with a `user_id` column

### 16.4 Minimum Integration

If you want the fastest path to a working app with your users table:

1. Keep the existing API response shapes (frontend expects specific JSON structures)
2. Write an adapter layer in `server/routes/auth.ts` that queries YOUR users table but returns data in the format the frontend expects
3. Update the `user_id` column type/references in `schema.sql` to match your users table PK
4. Everything else (race engine, progression, economy, battles) works as-is — they only need a valid `userId` string

---

## 17. Deployment Checklist

### Before Launch

- [ ] Replace `TWITCH_CLIENT_ID` in `src/hooks/useAuth.ts` with real Twitch app credentials
- [ ] Set up Twitch OAuth redirect URI to match your production domain
- [ ] Run `server/schema.sql` against production MySQL (or adapt FK references to your users table)
- [ ] Set all `.env` variables for production
- [ ] Implement on-chain NFT ownership verification (Solana RPC or LaunchMyNFT API)
- [ ] Replace sample collection data with real NFT metadata loaded from chain
- [ ] Set up HTTPS and CORS for production domains
- [ ] Add rate limiting to API endpoints (especially lobby join, economy mutations)
- [ ] Add authentication middleware to protect API routes (currently no auth tokens required)

### Monetization Setup

- [ ] Verify treasury wallet `HtPe6EYLgmT3UzyZeBCLg5vX5JjsxpoggtXkRYYx6oN5` is correct and accessible
- [ ] Implement server-side Solana RPC verification of SOL transaction signatures in `POST /economy/:userId/buffs/buy-sol`
- [ ] Integrate Solana wallet adapter (Phantom, Solflare) for frontend SOL transactions
- [ ] Implement PBP token transfer for premium race entry fees and prize payouts
- [ ] Set up season-end PBP distribution script based on leaderboard standings
- [ ] Configure PBP token contract address and treasury approval

### Security Considerations

- [ ] **API auth:** Add JWT or session tokens. Currently all API routes are unprotected — anyone who knows a userId can call economy/progression endpoints
- [ ] **Race result validation:** Race results are currently submitted by the client. In production, run the race simulation server-side using the stored seed and verify results match
- [ ] **Wallet verification:** Require signed messages to prove wallet ownership before linking
- [ ] **SOL transaction verification:** Validate all SOL purchase tx signatures on-chain before crediting buffs
- [ ] **PBP payment verification:** Verify PBP token transfers for premium race entries before allowing lobby joins
- [ ] **Rate limiting:** Protect coin/buff/achievement endpoints from abuse
- [ ] **Input validation:** Sanitize all user inputs (addresses, buff IDs, etc.)

### Performance

- [ ] The race engine is deterministic and CPU-bound. For large lobbies (16 racers), simulation completes in <100ms — no async concerns
- [ ] Leaderboard table is denormalized for fast reads. Updates happen per-race via `ON DUPLICATE KEY UPDATE`
- [ ] MySQL connection pool is set to 10 connections. Adjust `connectionLimit` in `server/db.ts` based on expected load
- [ ] Frontend uses localStorage caching with server sync. Works offline and syncs on reconnect

### Scaling Notes

- Race simulation can run client-side (current approach) or server-side. For competitive integrity, run server-side with the seed stored in the `races.seed` column
- The lobby system uses MySQL transactions with `FOR UPDATE` locks for race condition safety on joins
- Achievement evaluation is pure JavaScript — runs client-side with server sync for persistence
- The soft-cap knee (15) and curve multiplier (2) in `marbleRace.ts` are easily tunable constants if balance needs adjustment post-launch
