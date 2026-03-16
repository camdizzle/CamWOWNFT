# Battle Page — 1v1 PvP

## Phase 1: Pick Your Challenger

```
+============================================================================+
|  VS Battle                                                                 |
|  Choose your champion                                                      |
|                                                                            |
|  +--- Character Grid (all characters) -----------------------------------+|
|  |                                                                        ||
|  |  +--[The 420]---+  +--[Golden Sage]-+  +--[Silver Sent.]-+            ||
|  |  |    [Art]     |  |    [Art]       |  |    [Art]         |            ||
|  |  |  Power: 76   |  |  Power: 66    |  |  Power: 57       |            ||
|  |  |  (click)     |  |  (click)      |  |  (click)         |            ||
|  |  +--------------+  +---------------+  +------------------+            ||
|  |                                                                        ||
|  |  +--[Bronze Br.]-+  +--[Everyday]-+                                   ||
|  |  |    [Art]      |  |    [Art]    |                                    ||
|  |  |  Power: 45    |  |  Power: 36  |                                    ||
|  |  |  (click)      |  |  (click)    |                                    ||
|  |  +---------------+  +------------+                                     ||
|  +------------------------------------------------------------------------+|
+============================================================================+
```

## Phase 2: Pick Opponent

```
+============================================================================+
|  VS Battle                                                                 |
|  Choose an opponent for The 420                     [ Start Over ]         |
|                                                                            |
|  +--- Character Grid (minus challenger) ---------------------------------+|
|  |                                                                        ||
|  |  +--[Golden Sage]-+  +--[Silver Sent.]-+  +--[Bronze Br.]-+           ||
|  |  |    [Art]       |  |    [Art]         |  |    [Art]      |           ||
|  |  |  Power: 66     |  |  Power: 57      |  |  Power: 45    |           ||
|  |  |  (click)       |  |  (click)        |  |  (click)      |           ||
|  |  +----------------+  +------------------+  +---------------+           ||
|  |                                                                        ||
|  |  +--[Everyday]--+                                                      ||
|  |  |    [Art]     |                                                      ||
|  |  |  Power: 36   |                                                      ||
|  |  |  (click)     |                                                      ||
|  |  +--------------+                                                      ||
|  +------------------------------------------------------------------------+|
+============================================================================+
```

## Phase 3: Battle Arena

```
+============================================================================+
|  VS Battle                                                                 |
|  Battle in progress...                              [ Start Over ]         |
|                                                                            |
|  +--- Battle Arena -------------------------------------------------------+|
|  |                                                                        ||
|  |          VS Battle                                                     ||
|  |                                                                        ||
|  |  +--- Challenger ---+          +--- Opponent ----+                     ||
|  |  |     [Art]        |          |     [Art]       |                     ||
|  |  |   The 420        |   VS     |  Golden Sage    |                     ||
|  |  |                  |          |                  |                     ||
|  |  |  HP: [████████░] |          |  HP: [██████░░░]|                     ||
|  |  |       78%        |          |       52%       |                     ||
|  |  |  Power: 76       |          |  Power: 66      |                     ||
|  |  +------------------+          +------------------+                    ||
|  |                                                                        ||
|  |  +--- Battle Log (scrollable) ---+                                     ||
|  |  | Round 1: The 420 attacks!     |                                     ||
|  |  |   Deals 14 damage to          |                                     ||
|  |  |   Golden Sage                  |                                     ||
|  |  |                                |                                     ||
|  |  | Round 1: Golden Sage attacks!  |                                     ||
|  |  |   CRITICAL HIT! Deals 22      |                                     ||
|  |  |   damage to The 420            |                                     ||
|  |  |                                |                                     ||
|  |  | Round 2: The 420 attacks!      |                                     ||
|  |  |   Deals 16 damage              |                                     ||
|  |  |                                |                                     ||
|  |  | Round 2: Golden Sage attacks!  |                                     ||
|  |  |   The 420 dodges!             |                                      ||
|  |  |                                |                                     ||
|  |  | Round 3: The 420 attacks!      |                                     ||
|  |  |   Intimidation! Enemy damage   |                                     ||
|  |  |   reduced by 40%               |                                     ||
|  |  +--------------------------------+                                     ||
|  |                                                                        ||
|  +------------------------------------------------------------------------+|
+============================================================================+
```

## Battle Result

```
+============================================================================+
|                                                                            |
|  +--- Battle Result -----------------------------------------------------+|
|  |                                                                        ||
|  |                The 420 WINS!                                           ||
|  |                                                                        ||
|  |          Battle lasted 12 rounds                                       ||
|  |                                                                        ||
|  |  +--- Challenger ---+          +--- Opponent ----+                     ||
|  |  |     [Art]        |          |     [Art]       |                     ||
|  |  |   The 420        |   VS     |  Golden Sage    |                     ||
|  |  |   ** WINNER **   |          |                  |                    ||
|  |  |  HP: [██░░░░░░░] |          |  HP: [░░░░░░░░░]|                     ||
|  |  |       22%        |          |       0%        |                     ||
|  |  |  Power: 76       |          |  Power: 66      |                     ||
|  |  +------------------+          +------------------+                    ||
|  |                                                                        ||
|  |                    [ Rematch ]                                          ||
|  |                                                                        ||
|  +------------------------------------------------------------------------+|
+============================================================================+
```

## HP Bar Color Coding

```
  HP > 50%:   Green   [████████░░]
  HP 25-50%:  Yellow  [████░░░░░░]
  HP < 25%:   Red     [██░░░░░░░░]
  HP = 0%:    Empty   [░░░░░░░░░░]
```

## Battle Action Log Styling

```
  Normal attack:  White text
  Critical hit:   Gold/yellow text with "CRITICAL HIT!" prefix
  Dodge:          Teal text with "dodges!" suffix
  Intimidation:   Purple text
```

## Notes

- Battle log entries appear with 600ms delay (animated)
- "Start Over" returns to Phase 1
- Winner gets +50 leaderboard points, loser gets +10
- Compact CharacterCard mode used in selection grids
- Full card with stats shown in the arena fighter display
