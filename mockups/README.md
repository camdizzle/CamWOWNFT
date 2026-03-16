# CamWOW Arena — Page Mockups

Rich HTML mockups that mirror the actual React design system.
Open any `.html` file in a browser to see the full page rendering with the dark gaming theme.

## Pages

| File | Page | Description |
|------|------|-------------|
| [01-nav-and-layout.html](./01-nav-and-layout.html) | Global | Top nav, footer, page shell (logged out + logged in) |
| [02-onboarding.html](./02-onboarding.html) | Onboarding | Wallet connection modal (default + error states) |
| [03-collection.html](./03-collection.html) | Collection | NFT gallery with stats, progression, wallet manager |
| [04-race-free.html](./04-race-free.html) | Race (Free) | Free race lobby, countdown, live race, results |
| [05-race-premium.html](./05-race-premium.html) | Race (Premium) | Premium race with PBP entry fee, prize pool, results |
| [06-battle.html](./06-battle.html) | Battle | 1v1 PvP picker, battle arena, results |
| [07-leaderboard.html](./07-leaderboard.html) | Leaderboard | Season rankings with podium + table |
| [08-shop.html](./08-shop.html) | Shop | Dual-currency buff shop (coins + SOL, premium SOL-only) |
| [09-achievements.html](./09-achievements.html) | Achievements | Achievement grid with progress bars |

## Design System

All mockups use the same CSS custom properties from `src/App.css`:

- **Background**: `#0a0a1a` (dark) / `#141428` (card) / `#1a1a35` (surface)
- **Accent**: `#6c5ce7` (purple) / `#a29bfe` (glow)
- **Gold**: `#ffd700` — used for coins, premium content, and rankings
- **Text**: `#e0e0f0` (primary) / `#8888aa` (muted)
- **Success/Danger**: `#55efc4` / `#ff6b6b`
- **Font**: Inter (Google Fonts)

## States Shown

Each mockup includes multiple component states where applicable:
- Lobby waiting, countdown, race in progress, results
- Logged in vs logged out navigation
- Default, error, and success states
- Unlocked vs locked achievements
- Regular vs premium buff cards
