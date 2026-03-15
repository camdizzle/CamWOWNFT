import { useState } from "react";
import { BUFF_CATALOG, RARITY_COLORS, MAX_BUFFS_PER_ENTRY } from "../engines/buffs";
import type { BuffRarity } from "../engines/buffs";
import type { UseEconomyResult } from "../hooks/useEconomy";

interface BuffShopProps {
  economy: UseEconomyResult;
}

const RARITY_ORDER: BuffRarity[] = ["common", "uncommon", "rare", "epic", "legendary"];

export function BuffShop({ economy }: BuffShopProps) {
  const [filter, setFilter] = useState<BuffRarity | "all">("all");
  const [message, setMessage] = useState<string | null>(null);

  const filtered =
    filter === "all"
      ? BUFF_CATALOG
      : BUFF_CATALOG.filter((b) => b.rarity === filter);

  function handleBuy(buffId: string) {
    const result = economy.buyBuff(buffId);
    if (result.ok) {
      setMessage("Purchased!");
      setTimeout(() => setMessage(null), 2000);
    } else {
      setMessage(result.reason ?? "Purchase failed.");
      setTimeout(() => setMessage(null), 3000);
    }
  }

  return (
    <div className="buff-shop">
      <div className="shop-header">
        <h3>Buff Shop</h3>
        <div className="shop-balance">
          <span className="coin-icon">🪙</span>
          <span className="coin-amount">{economy.coins}</span>
        </div>
      </div>

      {message && <div className="shop-message">{message}</div>}

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
      </div>

      <div className="shop-grid">
        {filtered.map((buff) => {
          const owned = economy.getBuffCount(buff.id);
          const canAfford = economy.coins >= buff.cost;

          return (
            <div
              key={buff.id}
              className="shop-card"
              style={{ borderColor: RARITY_COLORS[buff.rarity] }}
            >
              <div className="shop-card-header">
                <span className="shop-card-icon">{buff.icon}</span>
                <span
                  className="shop-card-rarity"
                  style={{ color: RARITY_COLORS[buff.rarity] }}
                >
                  {buff.rarity}
                </span>
              </div>
              <div className="shop-card-name">{buff.name}</div>
              <div className="shop-card-desc">{buff.description}</div>
              <div className="shop-card-footer">
                <span className="shop-card-cost">
                  🪙 {buff.cost}
                </span>
                {owned > 0 && (
                  <span className="shop-card-owned">x{owned}</span>
                )}
                <button
                  className={`btn btn-sm ${canAfford ? "btn-primary" : "btn-secondary"}`}
                  disabled={!canAfford}
                  onClick={() => handleBuy(buff.id)}
                >
                  Buy
                </button>
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
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
