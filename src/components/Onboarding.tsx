import { useState } from "react";
import type { AuthState } from "../hooks/useAuth";

interface OnboardingProps {
  auth: AuthState;
}

export function Onboarding({ auth }: OnboardingProps) {
  const [address, setAddress] = useState("");
  const [label, setLabel] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!auth.user) return null;

  async function handleConnect() {
    const trimmed = address.trim();
    if (!trimmed) {
      setError("Please enter your Solana wallet address.");
      return;
    }
    // Basic Solana address validation (base58, 32-44 chars)
    if (trimmed.length < 32 || trimmed.length > 44) {
      setError("That doesn't look like a valid Solana address.");
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await auth.addWallet({
        address: trimmed,
        label: label.trim() || undefined,
      });
    } catch {
      setError("Failed to connect wallet. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-card">
        <div className="onboarding-header">
          <span className="onboarding-icon">🎮</span>
          <h2>Welcome to CamWOW Arena!</h2>
          <p className="onboarding-user">
            Logged in as <strong>{auth.user.twitchUser.displayName}</strong>
          </p>
        </div>

        <div className="onboarding-body">
          <h3>Connect Your Solana Wallet</h3>
          <p className="onboarding-desc">
            To play, you need to connect at least one Solana wallet that holds
            CamWOW Series 1 NFTs. Your NFTs become your race characters!
          </p>
          <p className="onboarding-note">
            You can connect multiple wallets later — all NFTs are unified under
            your Twitch account.
          </p>

          {error && <div className="onboarding-error">{error}</div>}

          <div className="onboarding-form">
            <input
              type="text"
              placeholder="Solana wallet address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="onboarding-input"
              disabled={submitting}
            />
            <input
              type="text"
              placeholder="Label (optional, e.g. Main Wallet)"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="onboarding-input"
              disabled={submitting}
            />
            <button
              className="btn btn-primary onboarding-btn"
              onClick={handleConnect}
              disabled={submitting}
            >
              {submitting ? "Connecting..." : "Connect Wallet"}
            </button>
          </div>
        </div>

        <div className="onboarding-footer">
          <span>CamWOW Series 1 | LaunchMyNFT</span>
        </div>
      </div>
    </div>
  );
}
