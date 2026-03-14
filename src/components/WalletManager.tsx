import { useState } from "react";
import type { AuthState } from "../hooks/useAuth";
import type { WalletConnection } from "../types/nft";

interface WalletManagerProps {
  auth: AuthState;
}

export function WalletManager({ auth }: WalletManagerProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [newAddress, setNewAddress] = useState("");
  const [newChain, setNewChain] = useState<WalletConnection["chain"]>("solana");
  const [newLabel, setNewLabel] = useState("");

  if (!auth.user) return null;

  function handleAdd() {
    if (!newAddress.trim()) return;
    auth.addWallet({
      address: newAddress.trim(),
      chain: newChain,
      label: newLabel.trim() || undefined,
    });
    setNewAddress("");
    setNewLabel("");
    setShowAdd(false);
  }

  return (
    <div className="wallet-manager">
      <h3>Connected Wallets</h3>
      <p className="wallet-info-text">
        All wallets are unified under your Twitch account.
        NFT limits are per Twitch user, not per wallet.
      </p>

      <div className="wallet-list">
        {auth.user.wallets.map((w) => (
          <div key={w.address} className="wallet-row">
            <span className="wallet-chain">{w.chain}</span>
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
          + Add Wallet
        </button>
      ) : (
        <div className="wallet-add-form">
          <select
            value={newChain}
            onChange={(e) => setNewChain(e.target.value as WalletConnection["chain"])}
            className="wallet-select"
          >
            <option value="solana">Solana</option>
            <option value="ethereum">Ethereum</option>
            <option value="polygon">Polygon</option>
          </select>
          <input
            type="text"
            placeholder="Wallet address"
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
