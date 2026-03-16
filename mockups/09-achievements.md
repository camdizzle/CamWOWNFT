# Achievements Panel

Accessed from the Shop page's "Achievements" tab.

## Full Layout

```
+============================================================================+
|  Shop & Achievements                                                       |
|  Buy buffs with coins or SOL -- premium buffs are SOL-only                 |
|                                                                            |
|  +--- Tabs ---+                                                            |
|  | [ Buff Shop ]  [* Achievements (12) *] |                               |
|  +------------+                                                            |
|                                                                            |
|  +--- Achievements Panel -------------------------------------------------+|
|  |                                                                        ||
|  |  Achievements          12 / 48 unlocked        [Coin] 3,240 earned    ||
|  |                                                                        ||
|  |  Progress: [████████████████████░░░░░░░░░░░░░░░░░░░░░░]  25%          ||
|  |                                                                        ||
|  |  --- Streamer Participation: 2/5 ------------------------------------ ||
|  |                                                                        ||
|  |  +--[Unlocked]--+  +--[Unlocked]--+  +--[Locked]----+  +--[Locked]-+  ||
|  |  | [Check Mark] |  | [Check Mark] |  |  [Lock]      |  |  [Lock]   |  ||
|  |  | First Stream |  | Stream 10    |  |  Stream 25   |  |  Stream50 |  ||
|  |  | Race in 1    |  | Race in 10   |  |  Race in 25  |  |  Race 50  |  ||
|  |  | streamer's   |  | streamers'   |  |  streamers'  |  |  stream.  |  ||
|  |  | lobby        |  | lobbies      |  |  lobbies     |  |  lobbies  |  ||
|  |  | [Coin] 10    |  | [Coin] 100   |  |  [Coin] 250  |  | [C] 500  |  ||
|  |  +--------------+  +--------------+  +--------------+  +----------+   ||
|  |                                                                        ||
|  |  --- Race Count: 4/7 ------------------------------------------------ ||
|  |                                                                        ||
|  |  +--[Unlocked]--+  +--[Unlocked]--+  +--[Unlocked]--+  +--[Unlock]-+ ||
|  |  | [Check]      |  | [Check]      |  | [Check]      |  | [Check]   | ||
|  |  | First Race   |  | 50 Races     |  | 100 Races    |  | 250 Races | ||
|  |  | Complete 1   |  | Complete 50  |  | Complete 100 |  | Complete  | ||
|  |  | race         |  | races        |  | races        |  | 250 races | ||
|  |  | [Coin] 10    |  | [Coin] 100   |  | [Coin] 250   |  | [C] 500  | ||
|  |  +--------------+  +--------------+  +--------------+  +----------+  ||
|  |                                                                        ||
|  |  +--[Locked]----+  +--[Locked]----+  +--[Locked]----+                  ||
|  |  | [Lock]       |  | [Lock]       |  | [Lock]       |                  ||
|  |  | 500 Races    |  | 1,000 Races  |  | 10K Races    |                  ||
|  |  | Complete 500 |  | Complete 1K  |  | Complete 10K |                   ||
|  |  | races        |  | races        |  | races        |                   ||
|  |  | [Coin] 1,000 |  | [Coin] 2,500 |  | [Coin] 10K  |                  ||
|  |  +--------------+  +--------------+  +--------------+                   ||
|  |                                                                        ||
|  |  --- Wins & Placement: 3/12 ----------------------------------------- ||
|  |                                                                        ||
|  |  +--[Unlocked]--+  +--[Unlocked]--+  +--[Unlocked]--+  +--[Locked]-+ ||
|  |  | [Check]      |  | [Check]      |  | [Check]      |  | [Lock]    | ||
|  |  | First Win    |  | 10 Wins      |  | Podium 10    |  | 50 Wins   | ||
|  |  | Win 1 race   |  | Win 10 races |  | Top 3 in 10  |  | Win 50    | ||
|  |  | [Coin] 25    |  | [Coin] 200   |  | [Coin] 150   |  | [C] 500  | ||
|  |  +--------------+  +--------------+  +--------------+  +----------+  ||
|  |                                                                        ||
|  |  +--[Locked]----+  +--[Locked]----+  ...                              ||
|  |  | 100 Wins     |  | 250 Wins     |                                   ||
|  |  | [Coin] 1,000 |  | [Coin] 2,500 |                                   ||
|  |  +--------------+  +--------------+                                    ||
|  |                                                                        ||
|  |  --- Win Streaks: 1/3 ----------------------------------------------- ||
|  |                                                                        ||
|  |  +--[Unlocked]--+  +--[Locked]----+  +--[Locked]----+                 ||
|  |  | [Check]      |  | [Lock]       |  | [Lock]       |                  ||
|  |  | Hot Streak   |  | On Fire      |  | Unstoppable  |                  ||
|  |  | Win 3 in a   |  | Win 5 in a   |  | Win 10 in a  |                  ||
|  |  | row          |  | row          |  | row           |                  ||
|  |  | [Coin] 50    |  | [Coin] 150   |  | [Coin] 500   |                  ||
|  |  +--------------+  +--------------+  +--------------+                   ||
|  |                                                                        ||
|  |  --- Milestones: 2/8 ------------------------------------------------ ||
|  |                                                                        ||
|  |  +--[Unlocked]--+  +--[Unlocked]--+  +--[Locked]----+  ...            ||
|  |  | [Check]      |  | [Check]      |  | [Lock]       |                  ||
|  |  | Multi NFT    |  | Buff User    |  | Weekly Racer |                  ||
|  |  | Race 3 diff  |  | Use 10 buffs |  | 5 races in   |                  ||
|  |  | NFTs         |  | in races     |  | one week     |                  ||
|  |  | [Coin] 50    |  | [Coin] 75    |  | [Coin] 100   |                  ||
|  |  +--------------+  +--------------+  +--------------+                   ||
|  |                                                                        ||
|  +------------------------------------------------------------------------+|
+============================================================================+
```

## Achievement Card Anatomy

```
  +--- Unlocked Achievement ----+      +--- Locked Achievement -----+
  |  [border: rarity glow]      |      |  [border: gray, dimmed]    |
  |                              |      |                            |
  |  [Check Mark Icon]           |      |  [Lock Icon]               |
  |                              |      |                            |
  |  Achievement Name            |      |  Achievement Name          |
  |                              |      |                            |
  |  Description of what         |      |  Description of what       |
  |  was accomplished            |      |  needs to be done          |
  |                              |      |                            |
  |  [Coin] 200 reward           |      |  [Coin] 200 reward         |
  +------------------------------+      +----------------------------+
```

## Achievement Categories

| Category | Total | Coin Rewards Range |
|----------|-------|--------------------|
| Streamer Participation | 5 | 10 - 1,000 |
| Race Count | 7 | 10 - 10,000 |
| Wins & Placement | 12 | 25 - 5,000 |
| Win Streaks | 3 | 50 - 500 |
| Milestones | 8+ | 50 - 1,000 |

## Notes

- Achievement count in tab badge updates in real-time
- Category headers show "X/Y" progress
- Overall progress bar at top shows total completion %
- Total coins earned displayed in header
- Cards scroll horizontally within each category if needed
- Unlocked cards have brighter styling, check icon
- Locked cards are dimmed with lock icon
