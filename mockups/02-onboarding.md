# Onboarding — Wallet Connection

Shown as a full-screen overlay when user is logged in but has no wallets connected.
Blocks access to all other pages until at least one wallet is linked.

```
+============================================================================+
|                                                                            |
|                        +------------------------------+                    |
|                        |         [Game Icon]          |                    |
|                        |   Welcome to CamWOW Arena!   |                    |
|                        |                              |                    |
|                        |   Logged in as: camdizzle    |                    |
|                        |                              |                    |
|                        |  -------------------------   |                    |
|                        |                              |                    |
|                        |  Connect Your Solana Wallet   |                    |
|                        |                              |                    |
|                        |  Link your Solana wallet to   |                    |
|                        |  detect your CamWOW NFTs.     |                    |
|                        |  Your NFT traits become your  |                    |
|                        |  marble's racing stats.       |                    |
|                        |                              |                    |
|                        |  [!] Error message here      |  <-- conditional  |
|                        |                              |                    |
|                        |  Wallet Address:             |                    |
|                        |  [____________________________]                    |
|                        |                              |                    |
|                        |  Label (optional):           |                    |
|                        |  [____________________________]                    |
|                        |                              |                    |
|                        |  [ Connect Wallet ]          |                    |
|                        |                              |                    |
|                        |  -------------------------   |                    |
|                        |  CamWOW Arena | LaunchMyNFT  |                    |
|                        +------------------------------+                    |
|                                                                            |
+============================================================================+
```

## States

1. **Empty** — Form fields blank, button enabled
2. **Submitting** — Button text changes to "Connecting...", inputs disabled
3. **Error** — Red error banner appears above form (e.g., "Wallet already linked")
4. **Success** — Redirects to Collection page automatically

## Data Flow

- User enters a Solana wallet address (e.g., `7xKX...`)
- Optional label for display (e.g., "Main Wallet")
- POST /api/wallets → links wallet → refreshes user → detects NFTs
