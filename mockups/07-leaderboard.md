# Leaderboard Page

## Full Layout

```
+============================================================================+
|  Season 1 Leaderboard                                                      |
|  Cumulative rankings across all races and battles                          |
|                                                                            |
|  +--- Leaderboard Table -------------------------------------------------+|
|  |  Season Leaderboard                                                    ||
|  |                                                                        ||
|  |  #    Character         Points   Races   Wins   Battles   B.Wins      ||
|  |  ---- ----------------- -------- ------- ------ --------- ------      ||
|  |                                                                        ||
|  |  [Gold Medal]                                                          ||
|  |  1    The 420           2,450    32      12     8         6            ||
|  |                                                                        ||
|  |  [Silver Medal]                                                        ||
|  |  2    Golden Sage       1,890    28       8     6         3            ||
|  |                                                                        ||
|  |  [Bronze Medal]                                                        ||
|  |  3    Silver Sentinel   1,340    25       5     5         3            ||
|  |                                                                        ||
|  |  4    Bronze Brawler      980    22       3     4         2            ||
|  |  5    Everyday Cam        650    20       2     3         1            ||
|  |  6    Player NFT A        520    18       1     2         1            ||
|  |  7    Player NFT B        410    15       1     1         0            ||
|  |  8    Player NFT C        280    12       0     1         0            ||
|  |  9    Player NFT D        150     8       0     0         0            ||
|  | 10    Player NFT E         90     5       0     0         0            ||
|  |                                                                        ||
|  +------------------------------------------------------------------------+|
+============================================================================+
```

## Visual Details

```
  Top 3 Styling:
  +--- 1st Place Row (class: top-1) ---+
  |  Gold medal icon                    |
  |  Gold background highlight          |
  +-------------------------------------+

  +--- 2nd Place Row (class: top-2) ---+
  |  Silver medal icon                  |
  |  Silver background highlight        |
  +-------------------------------------+

  +--- 3rd Place Row (class: top-3) ---+
  |  Bronze medal icon                  |
  |  Bronze background highlight        |
  +-------------------------------------+

  4th+ Place:
  +--- Regular Row --------------------+
  |  Numeric rank                       |
  |  No special styling                 |
  +-------------------------------------+
```

## Column Definitions

| Column | Description | Source |
|--------|-------------|--------|
| # | Rank by points | Sorted descending |
| Character | NFT name (after "—" split) | `nft.name` |
| Points | Cumulative season points | Race placement points + battle points |
| Races | Total races entered | `race_count` |
| Wins | 1st place finishes | `race_wins` |
| Battles | Total battles fought | `battle_count` |
| B.Wins | Battles won | `battle_wins` |

## Notes

- Sorted by points descending (always)
- Character name uses the portion after "—" if name contains it
- Data sourced from denormalized `leaderboard` table for fast reads
- Only shows data for the active season
- Medal icons: 1st = gold, 2nd = silver, 3rd = bronze
- No pagination currently — shows all entries
