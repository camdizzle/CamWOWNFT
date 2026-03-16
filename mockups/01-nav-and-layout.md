# Global Layout — Nav + Footer

## Logged Out State

```
+============================================================================+
| [Game Logo] CamWOW Arena    Collection  Race  Battle  Leaderboard  Shop    |
|                                                                            |
|                             [ Login Twitch ]  [ Demo 2 ]  [ Demo 3 ]      |
+============================================================================+
|                                                                            |
|                                                                            |
|                          << PAGE CONTENT HERE >>                           |
|                                                                            |
|                                                                            |
+============================================================================+
|  CamWOW Series 1 | LaunchMyNFT                         Season 1 Active    |
+============================================================================+
```

## Logged In State

```
+============================================================================+
| [Game Logo] CamWOW Arena    Collection  Race  Battle  Leaderboard  Shop    |
|                                                        [Coin] 1,250       |
|                             [Avatar] camdizzle  2 wallets  5 NFTs [Logout] |
+============================================================================+
|                                                                            |
|                                                                            |
|                          << PAGE CONTENT HERE >>                           |
|                                                                            |
|                                                                            |
+============================================================================+
|  CamWOW Series 1 | LaunchMyNFT                         Season 1 Active    |
+============================================================================+
```

## Navigation Highlights

- Active page link gets `.active` styling (underline + brighter)
- Coin display only visible when logged in
- Auth bar sits at far right of nav
- Footer is always visible with season info
- 5 page tabs: Collection, Race, Battle, Leaderboard, Shop

## Responsive Notes

- Nav links collapse on smaller viewports
- Coin balance stays visible at all times when logged in
