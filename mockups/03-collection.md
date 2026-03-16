# Collection Page

## Header + Filter Bar

```
+============================================================================+
|  [Art] CamWOW Collection                                                   |
|  5 total characters | 3 owned                                              |
|                                                                            |
|  Filter: [ All NFTs ] [ My NFTs ]           << only when logged in         |
|                                                                            |
|  +--- Wallet Manager (when logged in) --------------------------------+    |
|  | Connected Wallets:                                                  |    |
|  | [7xKX...4nR2] Main Wallet  [Remove]                               |    |
|  | [+ Add Wallet]                                                     |    |
|  +--------------------------------------------------------------------+    |
+============================================================================+
```

## Character Card Grid

```
+============================================================================+
|                                                                            |
|  +--- Character Card ----+  +--- Character Card ----+  +--- Card --------+|
|  |  +------------------+ |  |  +------------------+ |  |  +------------+ ||
|  |  |    [Art]         | |  |  |    [Art]         | |  |  |   [Art]    | ||
|  |  |    cam-420       | |  |  |    cam-005       | |  |  |   cam-012  | ||
|  |  |   Power: 76      | |  |  |   Power: 66      | |  |  |  Power:57 | ||
|  |  +------------------+ |  |  +------------------+ |  |  +------------+ ||
|  |                        |  |                        |  |                ||
|  |  The 420               |  |  Golden Sage           |  |  Silver Sent. ||
|  |                        |  |                        |  |                ||
|  |  Traits:               |  |  Traits:               |  |  Traits:      ||
|  |  [Solid Gold] [Cyborg] |  |  [Diamond] [Laser]     |  |  [Silver]     ||
|  |  [Crown] [Gold Armor]  |  |  [Suit] [Shield]       |  |  [Helmet]     ||
|  |  [Diamond Chain] ...   |  |  [Galaxy] [Cigar] ...  |  |  [Armor] ...  ||
|  |                        |  |                        |  |                ||
|  |  Stats:                |  |  Stats:                |  |  Stats:        ||
|  |  Speed     ████░░ 12   |  |  Speed     ███░░░ 10   |  |  Speed  ██░░ 8||
|  |  Toughness ███░░░  9   |  |  Toughness ██░░░░  7   |  |  Tough  ████ 14|
|  |  Charisma  █████░ 18   |  |  Charisma  ████░░ 15   |  |  Charis ███░ 11|
|  |  Luck      ████░░ 14   |  |  Luck      ████░░ 13   |  |  Luck   ██░░ 8||
|  |  Stamina   ██░░░░  8   |  |  Stamina   ███░░░  9   |  |  Stam   ██░░ 7||
|  |  Agility   ███░░░ 10   |  |  Agility   ███░░░ 10   |  |  Agil   ██░░ 7||
|  |                        |  |                        |  |                ||
|  |  +-- Progression ----+ |  |  +-- Progression ----+ |  |                ||
|  |  | Total Bonus: +8   | |  |  | Total Bonus: +5   | |  |                ||
|  |  | 12 races, 4 wins  | |  |  | 8 races, 2 wins   | |  |                ||
|  |  |                    | |  |  |                    | |  |                ||
|  |  | Speed   Lv3 ██▒░  | |  |  | Speed   Lv2 █▒░░  | |  |                ||
|  |  | Tough   Lv1 █░░░  | |  |  | Tough   Lv1 █░░░  | |  |                ||
|  |  | Charis  Lv2 ██░░  | |  |  | Charis  Lv1 █░░░  | |  |                ||
|  |  | Luck    Lv1 █░░░  | |  |  | Luck    Lv0 ▒░░░  | |  |                ||
|  |  | Stam    Lv1 █░░░  | |  |  | Stam    Lv1 █░░░  | |  |                ||
|  |  | Agil    Lv0 ▒░░░  | |  |  | Agil    Lv0 ▒░░░  | |  |                ||
|  |  +--------------------+ |  |  +--------------------+ |  |                ||
|  +------------------------+  +------------------------+  +----------------+|
|                                                                            |
+============================================================================+
```

## Stat Bar Legend

```
  ████████████░░░░░░░░  12/30
  ^--- filled (color)   ^--- empty

  Colors per stat:
  Speed     = Blue (#74b9ff)
  Toughness = Red (#ff6b6b)
  Charisma  = Purple (#a29bfe)
  Luck      = Gold (#ffeaa7)
  Stamina   = Green (#55efc4)
  Agility   = Teal (#00cec9)
```

## Progression Display Detail

```
  +-- Progression ----------------------------------------+
  | Progression           Total Bonus: +8 stats           |
  | 12 races completed  |  4 wins                         |
  |                                                        |
  | [Speed Icon] Speed     Lv3  ██████████▒▒▒░░░  +3      |
  |                              ^-- level   ^-- XP next   |
  |                                                        |
  | [Luck Icon]  Luck      MAX  ████████████████   +15     |
  |                              ^-- fully filled          |
  +--------------------------------------------------------+
```

## Notes

- Cards arranged in a responsive CSS grid (3-4 columns on desktop)
- Progression display only shows for NFTs the user owns
- "My NFTs" filter highlights owned cards, dims unowned
- Compact mode hides traits + stat bars (used in battle/race selection)
