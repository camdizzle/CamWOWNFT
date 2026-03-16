import { useState } from "react";
import {
  BUFF_CATALOG,
  RARITY_COLORS,
  MAX_BUFFS_PER_ENTRY,
  canPurchaseWithCoins,
  canPurchaseWithSol,
} from "../engines/buffs";
import type { BuffRarity, BuffDefinition, PurchaseCurrency } from "../engines/buffs";
import type { UseEconomyResult } from "../hooks/useEconomy";

interface BuffShopProps {
  economy: UseEconomyResult;
}

const RARITY_ORDER: BuffRarity[] = ["common", "uncommon", "rare", "epic", "legendary"];

type ShopFilter = BuffRarity | "all" | "premium";

export function BuffShop({ economy }: BuffShopProps) {
  const [filter, setFilter] = useState<ShopFilter>("all");
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  const filtered =
    filter === "all"
      ? BUFF_CATALOG
      : filter === "premium"
        ? BUFF_CATALOG.filter((b) => b.premiumOnly)
        : BUFF_CATALOG.filter((b) => b.rarity === filter);

  function showMessage(text: string, type: "success" | "error" = "success") {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(null), 3000);
  }

  function handleBuyWithCoins(buff: BuffDefinition) {
    if (!canPurchaseWithCoins(buff)) return;
    const result = economy.buyBuff(buff.id);
    if (result.ok) {
      showMessage(`Purchased ${buff.name}!`);
    } else {
      showMessage(result.reason ?? "Purchase failed.", "error");
    }
  }

  function handleBuyWithSol(buff: BuffDefinition) {
    if (!canPurchaseWithSol(buff)) return;
    // SOL purchase: triggers wallet signing flow
    const result = economy.buyBuffWithSol(buff.id, buff.solPrice);
    if (result.ok) {
      showMessage(`Purchased ${buff.name} for ${buff.solPrice} SOL!`);
    } else {
      showMessage(result.reason ?? "SOL purchase failed.", "error");
    }
  }

  return (
    <div className="buff-shop">
      <div className="shop-header">
        <h3>Buff Shop</h3>
        <div className="shop-balances">
          <div className="shop-balance">
            <span className="coin-icon">🪙</span>
            <span className="coin-amount">{economy.coins}</span>
          </div>
        </div>
      </div>

      {message && (
        <div className={`shop-message ${messageType === "error" ? "shop-message-error" : ""}`}>
          {message}
        </div>
      )}

      <div className="shop-filters">
        <button
          className={`shop-filter ${filter === "all" ? "active" : ""}`}
          onClick={() => setFilter("all")}
        >
          All
        </button>
        {RARITY_ORDER.map((r) => (
          <button
            key={r}
            className={`shop-filter ${filter === r ? "active" : ""}`}
            style={filter === r ? { borderColor: RARITY_COLORS[r] } : undefined}
            onClick={() => setFilter(r)}
          >
            {r.charAt(0).toUpperCase() + r.slice(1)}
          </button>
        ))}
        <button
          className={`shop-filter shop-filter-premium ${filter === "premium" ? "active" : ""}`}
          onClick={() => setFilter("premium")}
        >
          SOL Only
        </button>
      </div>

      <div className="shop-grid">
        {filtered.map((buff) => {
          const owned = economy.getBuffCount(buff.id);
          const canBuyCoins = canPurchaseWithCoins(buff) && economy.coins >= buff.cost;
          const canBuySol = canPurchaseWithSol(buff);

          return (
            <div
              key={buff.id}
              className={`shop-card ${buff.premiumOnly ? "shop-card-premium" : ""}`}
              style={{ borderColor: RARITY_COLORS[buff.rarity] }}
            >
              <div className="shop-card-header">
                <span className="shop-card-icon">{buff.icon}</span>
                <div className="shop-card-badges">
                  <span
                    className="shop-card-rarity"
                    style={{ color: RARITY_COLORS[buff.rarity] }}
                  >
                    {buff.rarity}
                  </span>
                  {buff.premiumOnly && (
                    <span className="shop-card-premium-badge">SOL ONLY</span>
                  )}
                </div>
              </div>
              <div className="shop-card-name">{buff.name}</div>
              <div className="shop-card-desc">{buff.description}</div>
              <div className="shop-card-footer">
                <div className="shop-card-prices">
                  {canPurchaseWithCoins(buff) && (
                    <span className="shop-card-cost shop-card-cost-coins">
                      🪙 {buff.cost}
                    </span>
                  )}
                  {canPurchaseWithSol(buff) && (
                    <span className="shop-card-cost shop-card-cost-sol">
                      ◎ {buff.solPrice}
                    </span>
                  )}
                </div>
                {owned > 0 && (
                  <span className="shop-card-owned">x{owned}</span>
                )}
                <div className="shop-card-buttons">
                  {canPurchaseWithCoins(buff) && (
                    <button
                      className={`btn btn-sm ${canBuyCoins ? "btn-primary" : "btn-secondary"}`}
                      disabled={!canBuyCoins}
                      onClick={() => handleBuyWithCoins(buff)}
                    >
                      Buy (Coins)
                    </button>
                  )}
                  {canBuySol && (
                    <button
                      className="btn btn-sm btn-sol"
                      onClick={() => handleBuyWithSol(buff)}
                    >
                      Buy (SOL)
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Inventory */}
      {economy.inventory.length > 0 && (
        <div className="shop-inventory">
          <h4>Your Inventory</h4>
          <p className="shop-inventory-hint">
            Equip up to {MAX_BUFFS_PER_ENTRY} buffs per NFT before a race
          </p>
          <div className="inventory-list">
            {economy.inventory.map((item) => {
              const def = BUFF_CATALOG.find((b) => b.id === item.buffId);
              if (!def) return null;
              return (
                <div
                  key={item.buffId}
                  className="inventory-item"
                  style={{ borderColor: RARITY_COLORS[def.rarity] }}
                >
                  <span className="inventory-icon">{def.icon}</span>
                  <span className="inventory-name">{def.name}</span>
                  <span className="inventory-qty">x{item.quantity}</span>
                  {def.premiumOnly && <span className="inventory-premium-badge">SOL</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
