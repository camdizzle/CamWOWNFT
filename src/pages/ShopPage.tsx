import { useState } from "react";
import { BuffShop } from "../components/BuffShop";
import { AchievementsPanel } from "../components/AchievementsPanel";
import type { UseEconomyResult } from "../hooks/useEconomy";

interface ShopPageProps {
  economy: UseEconomyResult;
}

type ShopTab = "shop" | "achievements";

export function ShopPage({ economy }: ShopPageProps) {
  const [tab, setTab] = useState<ShopTab>("shop");

  return (
    <div className="page shop-page">
      <div className="page-header">
        <h1>🪙 Shop & Achievements</h1>
        <p className="subtitle">
          Buy buffs with coins or PBP token — premium buffs are PBP-only
        </p>
      </div>

      <div className="shop-tabs">
        <button
          className={`shop-tab ${tab === "shop" ? "active" : ""}`}
          onClick={() => setTab("shop")}
        >
          🛒 Buff Shop
        </button>
        <button
          className={`shop-tab ${tab === "achievements" ? "active" : ""}`}
          onClick={() => setTab("achievements")}
        >
          🏅 Achievements ({economy.unlockedAchievements.length})
        </button>
      </div>

      {tab === "shop" && <BuffShop economy={economy} />}
      {tab === "achievements" && <AchievementsPanel economy={economy} />}
    </div>
  );
}
