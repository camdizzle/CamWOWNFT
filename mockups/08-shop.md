# Shop Page — Dual Currency Buff Shop

## Page Header + Tabs

```
+============================================================================+
|  Shop & Achievements                                                       |
|  Buy buffs with coins or SOL -- premium buffs are SOL-only                 |
|                                                                            |
|  +--- Tabs ---+                                                            |
|  | [* Buff Shop *]  [ Achievements (12) ] |                               |
|  +------------+                                                            |
+============================================================================+
```

## Buff Shop — Full Layout

```
+============================================================================+
|                                                                            |
|  +--- Shop Header -------------------------------------------------------+|
|  |  Buff Shop                                     [Coin] 1,250            ||
|  +------------------------------------------------------------------------+|
|                                                                            |
|  [Purchase successful!]               <-- success/error toast, auto-hides  |
|                                                                            |
|  +--- Filter Tabs -------------------------------------------------------+|
|  | [*All*] [Common] [Uncommon] [Rare] [Epic] [Legendary] [SOL Only]      ||
|  +------------------------------------------------------------------------+|
|                                                                            |
|  +--- Buff Grid (3-4 columns) -------------------------------------------+|
|  |                                                                        ||
|  |  +--- Regular Buff Card ---+  +--- Regular Buff Card ---+             ||
|  |  | [border: rarity color]  |  | [border: rarity color]  |             ||
|  |  |  [Rocket Icon]  common  |  |  [Banana Icon]  common  |             ||
|  |  |  Nitro Boost            |  |  Banana Peel             |             ||
|  |  |  +30% speed for one     |  |  Random opponent hits    |             ||
|  |  |  burst at a random      |  |  a slowdown obstacle.    |             ||
|  |  |  point in the race.     |  |                          |             ||
|  |  |                         |  |                          |             ||
|  |  |  [Coin] 30  [SOL] 0.005|  |  [Coin] 40  [SOL] 0.007 |             ||
|  |  |              x3         |  |              x1          |             ||
|  |  |  [Buy (Coins)] [Buy (SOL)]|  [Buy (Coins)] [Buy (SOL)]|            ||
|  |  +-------------------------+  +-------------------------+              ||
|  |                                                                        ||
|  |  +--- Premium Buff Card ---+  +--- Premium Buff Card ---+             ||
|  |  | [border: gold]          |  | [border: purple]        |             ||
|  |  | [SOL ONLY badge]        |  | [SOL ONLY badge]        |             ||
|  |  |  [Warp Icon]  legendary |  |  [Hole Icon]  epic      |             ||
|  |  |  Warp Drive             |  |  Gravity Well            |             ||
|  |  |  Teleport to 1st place  |  |  Pull opponents back 5%  |             ||
|  |  |  at the 75% mark.       |  |  at the 50% mark.        |             ||
|  |  |                         |  |                           |             ||
|  |  |          [SOL] 0.15     |  |          [SOL] 0.08       |             ||
|  |  |                         |  |                           |             ||
|  |  |       [Buy (SOL)]       |  |       [Buy (SOL)]        |             ||
|  |  +-------------------------+  +---------------------------+            ||
|  |                                                                        ||
|  +------------------------------------------------------------------------+|
|                                                                            |
|  +--- Your Inventory ----------------------------------------------------+|
|  |  Your Inventory                                                        ||
|  |  Equip up to 2 buffs per NFT before a race                            ||
|  |                                                                        ||
|  |  [Rocket] Nitro Boost     x3                                          ||
|  |  [Banana] Banana Peel     x1                                          ||
|  |  [Ghost]  Ghost Mode      x2                                          ||
|  |  [Warp]   Warp Drive      x1  [SOL]                                   ||
|  |  [Ticket] Golden Ticket   x2  [SOL]                                   ||
|  |                                                                        ||
|  +------------------------------------------------------------------------+|
+============================================================================+
```

## Buff Card Anatomy

```
  +--- Buff Card ----------------------------------------+
  |  [border color = rarity color]                       |
  |                                                      |
  |  [Icon]            [rarity label]                    |
  |                    [SOL ONLY] << if premium           |
  |                                                      |
  |  Buff Name                                           |
  |                                                      |
  |  Description text describing the                     |
  |  effect of this buff in the race.                    |
  |                                                      |
  |  +--- Pricing ---+                                   |
  |  | [Coin] 120    |  << coin price (hidden if premium)|
  |  | [SOL]  0.02   |  << SOL price (always shown)     |
  |  +----------------+                                  |
  |                    x2  << owned quantity              |
  |                                                      |
  |  [Buy (Coins)] [Buy (SOL)]                          |
  |  ^-- disabled if can't afford                        |
  |  ^-- hidden if premium (coins button)                |
  +------------------------------------------------------+
```

## Rarity Border Colors

```
  Common:    Gray    (#8888aa)   ░░░░
  Uncommon:  Green   (#55efc4)   ████
  Rare:      Blue    (#74b9ff)   ████
  Epic:      Purple  (#a29bfe)   ████
  Legendary: Gold    (#ffd700)   ████
```

## "SOL Only" Filter View

Shows only the 5 premium buffs:

```
  +--- SOL Only Filter Active ---------------------------------------------+
  |                                                                        |
  |  [Warp Drive]     [Gravity Well]    [Mirror Image]                     |
  |  Legendary 0.15   Epic 0.08         Epic 0.07                          |
  |                                                                        |
  |  [Golden Ticket]  [Adrenaline Surge]                                   |
  |  Rare 0.03        Uncommon 0.02                                        |
  |                                                                        |
  +------------------------------------------------------------------------+
```

## Notes

- Coins balance displayed in shop header (always visible)
- SOL purchases trigger Solana wallet signing (Phantom popup)
- Premium cards get special styling: "shop-card-premium" class, SOL ONLY badge
- Inventory shows [SOL] badge next to items purchased with SOL
- Buy buttons: "Buy (Coins)" is disabled when insufficient balance
- Buy buttons: "Buy (SOL)" always enabled (wallet handles insufficient funds)
