import type { NFTCharacter, NFTTrait } from "../types/nft";
import { calculateStats, totalPower } from "./traitStatMap";

// ── Sample CamWOW Series 1 Collection ──────────────────────────────────
// 5 representative NFTs spanning the full power curve.
// Placeholder images — replace with actual IPFS / LaunchMyNFT URIs.

function buildCharacter(
  id: string,
  name: string,
  image: string,
  traits: NFTTrait[]
): NFTCharacter {
  const stats = calculateStats(traits);
  return { id, name, image, traits, stats, totalPower: totalPower(stats) };
}

export const SAMPLE_COLLECTION: NFTCharacter[] = [
  // ── ★ Legend — The 420 (1-of-1, all 11 slots filled) ──────────────
  // 7 S-tier + 4 lower-tier traits.  Power target: ~58
  buildCharacter("cam-420", "CamWOW #420 — The 420", "/nfts/420.png", [
    { trait_type: "Skin", value: "Solid Gold" },
    { trait_type: "Eyes", value: "Cyborg Eyes" },
    { trait_type: "Headwear", value: "Bronze Crown" },
    { trait_type: "Clothing", value: "Gold Armor" },
    { trait_type: "Accessory", value: "Diamond Chain" },
    { trait_type: "Background", value: "420" },
    { trait_type: "Mouth", value: "Gold Grill" },
    { trait_type: "Facial Hair", value: "Goatee" },
    { trait_type: "Ears", value: "Gold Hoops" },
    { trait_type: "Tattoo", value: "Small Ink" },
    { trait_type: "Special", value: "CamWOW Logo" },
  ]),

  // ── ◆ Gold — Golden Sage (10/11 slots) ────────────────────────────
  // Strong charisma / luck build.  Power target: ~50
  buildCharacter("cam-005", "CamWOW #005 — Golden Sage", "/nfts/005.png", [
    { trait_type: "Skin", value: "Diamond" },
    { trait_type: "Eyes", value: "Sunglasses" },
    { trait_type: "Headwear", value: "Diamond Tiara" },
    { trait_type: "Clothing", value: "Suit" },
    { trait_type: "Accessory", value: "Gold Watch" },
    { trait_type: "Background", value: "Galaxy" },
    { trait_type: "Mouth", value: "Diamond Grill" },
    { trait_type: "Facial Hair", value: "Goatee" },
    { trait_type: "Ears", value: "Gold Hoops" },
    { trait_type: "Tattoo", value: "Small Ink" },
  ]),

  // ── ◇ Silver — Silver Sentinel (9/11 slots) ───────────────────────
  // Balanced tank build.  Power target: ~44
  buildCharacter("cam-012", "CamWOW #012 — Silver Sentinel", "/nfts/012.png", [
    { trait_type: "Skin", value: "Obsidian" },
    { trait_type: "Eyes", value: "Laser Eyes" },
    { trait_type: "Headwear", value: "Helmet" },
    { trait_type: "Clothing", value: "Armor" },
    { trait_type: "Accessory", value: "Shield" },
    { trait_type: "Background", value: "Fire" },
    { trait_type: "Mouth", value: "Cigar" },
    { trait_type: "Facial Hair", value: "Full Beard" },
    { trait_type: "Tattoo", value: "Tribal Mark" },
  ]),

  // ── ● Bronze — Bronze Brawler (9/11 slots) ────────────────────────
  // Stamina / toughness focused.  Power target: ~40
  buildCharacter("cam-008", "CamWOW #008 — Bronze Brawler", "/nfts/008.png", [
    { trait_type: "Skin", value: "Bronze" },
    { trait_type: "Eyes", value: "Wide Eyes" },
    { trait_type: "Headwear", value: "Beanie" },
    { trait_type: "Clothing", value: "Hoodie" },
    { trait_type: "Accessory", value: "Backpack" },
    { trait_type: "Background", value: "City" },
    { trait_type: "Mouth", value: "Cigar" },
    { trait_type: "Facial Hair", value: "Stubble" },
    { trait_type: "Ears", value: "Studs" },
  ]),

  // ── ○ Common — Everyday Cam (6/11 slots) ──────────────────────────
  // Minimal traits, base-heavy stats.  Power target: ~36
  buildCharacter("cam-100", "CamWOW #100 — Everyday Cam", "/nfts/100.png", [
    { trait_type: "Skin", value: "OG" },
    { trait_type: "Eyes", value: "Squint" },
    { trait_type: "Headwear", value: "Backwards Cap" },
    { trait_type: "Clothing", value: "Plain Tee" },
    { trait_type: "Background", value: "Plain" },
    { trait_type: "Mouth", value: "Grin" },
  ]),
];
