import { useState } from "react";
import type { AuthState } from "../hooks/useAuth";

interface WalletManagerProps {
  auth: AuthState;
}

export function WalletManager({ auth }: WalletManagerProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [newAddress, setNewAddress] = useState("");
  const [newLabel, setNewLabel] = useState("");

  if (!auth.user) return null;

  function handleAdd() {
    if (!newAddress.trim()) return;
    auth.addWallet({
      address: newAddress.trim(),
      label: newLabel.trim() || undefined,
    });
    setNewAddress("");
    setNewLabel("");
    setShowAdd(false);
  }

  return (
    <div className="wallet-manager">
      <h3>Connected Solana Wallets</h3>
      <p className="wallet-info-text">
        All wallets are unified under your Twitch account.
        NFT limits are per Twitch user, not per wallet.
      </p>

      <div className="wallet-list">
        {auth.user.wallets.map((w) => (
          <div key={w.address} className="wallet-row">
            <span className="wallet-chain">SOL</span>
            <span className="wallet-label">{w.label || "Wallet"}</span>
            <span className="wallet-address">
              {w.address.slice(0, 6)}...{w.address.slice(-4)}
            </span>
            <button
              className="btn btn-danger btn-sm"
              onClick={() => auth.removeWallet(w.address)}
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      {!showAdd ? (
        <button className="btn btn-secondary btn-sm" onClick={() => setShowAdd(true)}>
          + Add Solana Wallet
        </button>
      ) : (
        <div className="wallet-add-form">
          <input
            type="text"
            placeholder="Solana wallet address"
            value={newAddress}
            onChange={(e) => setNewAddress(e.target.value)}
            className="wallet-input"
          />
          <input
            type="text"
            placeholder="Label (optional)"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            className="wallet-input"
          />
          <div className="wallet-add-actions">
            <button className="btn btn-primary btn-sm" onClick={handleAdd}>
              Connect
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowAdd(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
