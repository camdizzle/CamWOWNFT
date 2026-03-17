-- ── CamWOW Arena MySQL Schema ─────────────────────────────────────────
-- Run this against your MySQL database to set up all tables.

CREATE DATABASE IF NOT EXISTS camwow_arena;
USE camwow_arena;

-- ── Users (Twitch accounts) ──────────────────────────────────────────

CREATE TABLE users (
  id            VARCHAR(64)   PRIMARY KEY,          -- twitch user ID
  login         VARCHAR(100)  NOT NULL,
  display_name  VARCHAR(100)  NOT NULL,
  profile_image VARCHAR(500)  DEFAULT '',
  created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ── Wallets (Solana, linked to Twitch user) ──────────────────────────

CREATE TABLE wallets (
  id          INT           AUTO_INCREMENT PRIMARY KEY,
  user_id     VARCHAR(64)   NOT NULL,
  address     VARCHAR(100)  NOT NULL UNIQUE,
  label       VARCHAR(100)  DEFAULT NULL,
  created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_wallets_user (user_id)
);

-- ── NFTs ─────────────────────────────────────────────────────────────

CREATE TABLE nfts (
  id          VARCHAR(64)   PRIMARY KEY,            -- e.g. "cam-001"
  name        VARCHAR(200)  NOT NULL,
  image       VARCHAR(500)  DEFAULT '',
  owner_id    VARCHAR(64)   DEFAULT NULL,           -- twitch user who owns it
  created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_nfts_owner (owner_id)
);

-- ── NFT Traits ───────────────────────────────────────────────────────

CREATE TABLE nft_traits (
  id          INT           AUTO_INCREMENT PRIMARY KEY,
  nft_id      VARCHAR(64)   NOT NULL,
  trait_type  VARCHAR(100)  NOT NULL,
  value       VARCHAR(100)  NOT NULL,
  FOREIGN KEY (nft_id) REFERENCES nfts(id) ON DELETE CASCADE,
  INDEX idx_traits_nft (nft_id)
);

-- ── Stat Progression (per-NFT, per-stat XP and levels) ───────────────

CREATE TABLE stat_progression (
  id            INT           AUTO_INCREMENT PRIMARY KEY,
  nft_id        VARCHAR(64)   NOT NULL,
  stat_key      ENUM('speed','toughness','charisma','luck','stamina','agility') NOT NULL,
  xp            INT           DEFAULT 0,
  level         INT           DEFAULT 0,
  FOREIGN KEY (nft_id) REFERENCES nfts(id) ON DELETE CASCADE,
  UNIQUE KEY uq_nft_stat (nft_id, stat_key),
  INDEX idx_progression_nft (nft_id)
);

-- ── NFT Levels (overall XP & level per NFT) ────────────────────────

CREATE TABLE nft_levels (
  nft_id          VARCHAR(64)   PRIMARY KEY,
  xp              INT           DEFAULT 0,
  level           INT           DEFAULT 0,
  total_races     INT           DEFAULT 0,
  total_wins      INT           DEFAULT 0,
  total_battles   INT           DEFAULT 0,
  total_battle_wins INT         DEFAULT 0,
  last_race_time  TIMESTAMP     NULL,
  last_battle_time TIMESTAMP    NULL,
  updated_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (nft_id) REFERENCES nfts(id) ON DELETE CASCADE
);

-- ── Seasons ──────────────────────────────────────────────────────────

CREATE TABLE seasons (
  id          INT           AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100)  NOT NULL,
  start_date  TIMESTAMP     NOT NULL,
  end_date    TIMESTAMP     NOT NULL,
  is_active   BOOLEAN       DEFAULT TRUE
);

-- ── Races ────────────────────────────────────────────────────────────

CREATE TABLE races (
  id              INT           AUTO_INCREMENT PRIMARY KEY,
  season_id       INT           DEFAULT NULL,
  name            VARCHAR(200)  DEFAULT 'League Race',
  status          ENUM('upcoming','in_progress','finished','cancelled') DEFAULT 'upcoming',
  scheduled_time  TIMESTAMP     NOT NULL,
  started_at      TIMESTAMP     NULL,
  finished_at     TIMESTAMP     NULL,
  seed            BIGINT        DEFAULT NULL,          -- for deterministic replay
  created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE SET NULL,
  INDEX idx_races_status (status),
  INDEX idx_races_season (season_id)
);

-- ── Race Entries ─────────────────────────────────────────────────────

CREATE TABLE race_entries (
  id          INT           AUTO_INCREMENT PRIMARY KEY,
  race_id     INT           NOT NULL,
  nft_id      VARCHAR(64)   NOT NULL,
  user_id     VARCHAR(64)   NOT NULL,               -- twitch user who entered this NFT
  placement   INT           DEFAULT NULL,
  finish_time INT           DEFAULT NULL,            -- ms
  points      INT           DEFAULT 0,
  entered_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (race_id) REFERENCES races(id) ON DELETE CASCADE,
  FOREIGN KEY (nft_id) REFERENCES nfts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_race_nft (race_id, nft_id),
  INDEX idx_entries_race (race_id),
  INDEX idx_entries_user (user_id)
);

-- ── Battles ──────────────────────────────────────────────────────────

CREATE TABLE battles (
  id              INT           AUTO_INCREMENT PRIMARY KEY,
  season_id       INT           DEFAULT NULL,
  challenger_id   VARCHAR(64)   NOT NULL,
  opponent_id     VARCHAR(64)   NOT NULL,
  winner_id       VARCHAR(64)   DEFAULT NULL,
  total_rounds    INT           DEFAULT 0,
  seed            BIGINT        DEFAULT NULL,
  fought_at       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE SET NULL,
  FOREIGN KEY (challenger_id) REFERENCES nfts(id) ON DELETE CASCADE,
  FOREIGN KEY (opponent_id) REFERENCES nfts(id) ON DELETE CASCADE,
  FOREIGN KEY (winner_id) REFERENCES nfts(id) ON DELETE SET NULL,
  INDEX idx_battles_season (season_id)
);

-- ── Leaderboard (denormalized for fast reads) ────────────────────────

CREATE TABLE leaderboard (
  id            INT           AUTO_INCREMENT PRIMARY KEY,
  season_id     INT           NOT NULL,
  nft_id        VARCHAR(64)   NOT NULL,
  points        INT           DEFAULT 0,
  race_count    INT           DEFAULT 0,
  race_wins     INT           DEFAULT 0,
  battle_count  INT           DEFAULT 0,
  battle_wins   INT           DEFAULT 0,
  updated_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE CASCADE,
  FOREIGN KEY (nft_id) REFERENCES nfts(id) ON DELETE CASCADE,
  UNIQUE KEY uq_season_nft (season_id, nft_id),
  INDEX idx_lb_season_points (season_id, points DESC)
);

-- ── Race Lobby (active lobby state) ──────────────────────────────────

CREATE TABLE race_lobbies (
  id              INT           AUTO_INCREMENT PRIMARY KEY,
  race_id         INT           DEFAULT NULL,          -- linked once race starts
  scheduled_time  TIMESTAMP     NOT NULL,
  deadline_time   TIMESTAMP     NOT NULL,
  status          ENUM('waiting','countdown','racing','finished') DEFAULT 'waiting',
  mode            ENUM('free','premium') DEFAULT 'free',
  entry_fee_pbp   INT           DEFAULT 0,             -- 0 for free, 50 for premium
  prize_pool      INT           DEFAULT 0,             -- accumulated PBP from entry fees
  created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (race_id) REFERENCES races(id) ON DELETE SET NULL,
  INDEX idx_lobby_status (status)
);

-- ── Economy: User Coins ────────────────────────────────────────────

CREATE TABLE user_coins (
  user_id     VARCHAR(64)   PRIMARY KEY,
  balance     INT           DEFAULT 0,
  total_earned INT          DEFAULT 0,
  updated_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── Economy: Buff Inventory ────────────────────────────────────────

CREATE TABLE buff_inventory (
  id          INT           AUTO_INCREMENT PRIMARY KEY,
  user_id     VARCHAR(64)   NOT NULL,
  buff_id     VARCHAR(64)   NOT NULL,
  quantity    INT           DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_user_buff (user_id, buff_id),
  INDEX idx_buffinv_user (user_id)
);

-- ── Economy: Unlocked Achievements ─────────────────────────────────

CREATE TABLE user_achievements (
  id              INT           AUTO_INCREMENT PRIMARY KEY,
  user_id         VARCHAR(64)   NOT NULL,
  achievement_id  VARCHAR(64)   NOT NULL,
  unlocked_at     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_user_ach (user_id, achievement_id),
  INDEX idx_ach_user (user_id)
);

-- ── Economy: Player Stats ──────────────────────────────────────────

CREATE TABLE player_stats (
  user_id                VARCHAR(64)   PRIMARY KEY,
  total_races            INT           DEFAULT 0,
  total_wins             INT           DEFAULT 0,
  total_second_place     INT           DEFAULT 0,
  total_third_place      INT           DEFAULT 0,
  total_top_three        INT           DEFAULT 0,
  total_coins_earned     INT           DEFAULT 0,
  current_win_streak     INT           DEFAULT 0,
  longest_win_streak     INT           DEFAULT 0,
  races_this_week        INT           DEFAULT 0,
  races_this_season      INT           DEFAULT 0,
  unique_nfts_raced      INT           DEFAULT 0,
  buffs_used             INT           DEFAULT 0,
  mystats_race_count     INT           DEFAULT 0,
  mystats_points_earned  INT           DEFAULT 0,
  updated_at             TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── Economy: MyStats Streamers Played (normalized) ─────────────────

CREATE TABLE mystats_streamers_played (
  id          INT           AUTO_INCREMENT PRIMARY KEY,
  user_id     VARCHAR(64)   NOT NULL,
  streamer_id VARCHAR(100)  NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_user_streamer (user_id, streamer_id),
  INDEX idx_msp_user (user_id)
);

-- ── Economy: Race Buff Usage (audit log) ───────────────────────────

CREATE TABLE race_buff_usage (
  id          INT           AUTO_INCREMENT PRIMARY KEY,
  race_id     INT           NOT NULL,
  nft_id      VARCHAR(64)   NOT NULL,
  user_id     VARCHAR(64)   NOT NULL,
  buff_id     VARCHAR(64)   NOT NULL,
  triggered   BOOLEAN       DEFAULT FALSE,
  used_at     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (race_id) REFERENCES races(id) ON DELETE CASCADE,
  FOREIGN KEY (nft_id) REFERENCES nfts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_rbu_race (race_id)
);

-- ── Premium Race Payments (PBP entry fee audit log) ──────────────────

CREATE TABLE premium_race_payments (
  id              INT           AUTO_INCREMENT PRIMARY KEY,
  race_id         INT           NOT NULL,
  user_id         VARCHAR(64)   NOT NULL,
  nft_id          VARCHAR(64)   NOT NULL,
  amount_pbp      INT           NOT NULL DEFAULT 50,
  treasury_wallet VARCHAR(100)  NOT NULL,
  paid_at         TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (race_id) REFERENCES races(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (nft_id) REFERENCES nfts(id) ON DELETE CASCADE,
  INDEX idx_prp_race (race_id),
  INDEX idx_prp_user (user_id)
);

-- ── Premium Race Payouts (PBP prize distributions) ───────────────────

CREATE TABLE premium_race_payouts (
  id              INT           AUTO_INCREMENT PRIMARY KEY,
  race_id         INT           NOT NULL,
  nft_id          VARCHAR(64)   NOT NULL,
  user_id         VARCHAR(64)   NOT NULL,
  placement       INT           NOT NULL,
  amount_pbp      INT           NOT NULL,
  paid_at         TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (race_id) REFERENCES races(id) ON DELETE CASCADE,
  FOREIGN KEY (nft_id) REFERENCES nfts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_prpay_race (race_id)
);

-- ── Season Prize Pool (35% of premium race fees → end-of-season) ────

CREATE TABLE season_prize_pool (
  id              INT           AUTO_INCREMENT PRIMARY KEY,
  season_id       INT           NOT NULL,
  race_id         INT           NOT NULL,
  amount_pbp      INT           NOT NULL,
  contributed_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE CASCADE,
  FOREIGN KEY (race_id) REFERENCES races(id) ON DELETE CASCADE,
  INDEX idx_spp_season (season_id)
);

-- ── PBP Purchases (audit log for all PBP token transactions) ──────────

CREATE TABLE pbp_purchases (
  id              INT           AUTO_INCREMENT PRIMARY KEY,
  user_id         VARCHAR(64)   NOT NULL,
  item_type       ENUM('buff','entry_fee') NOT NULL,
  item_id         VARCHAR(64)   NOT NULL,              -- buff_id or race_id
  pbp_amount      DECIMAL(18,9) NOT NULL,
  treasury_wallet VARCHAR(100)  NOT NULL,
  tx_signature    VARCHAR(128)  DEFAULT NULL,          -- Solana tx signature for verification
  purchased_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_pbpp_user (user_id),
  INDEX idx_pbpp_tx (tx_signature)
);

-- ── Insert initial season ────────────────────────────────────────────

INSERT INTO seasons (name, start_date, end_date, is_active)
VALUES ('Season 1', NOW(), DATE_ADD(NOW(), INTERVAL 90 DAY), TRUE);
