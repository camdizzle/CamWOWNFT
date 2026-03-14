import type { NFTCharacter, NFTTrait } from "../types/nft";
import { calculateStats, totalPower } from "./traitStatMap";

// ── Sample CamWOW Series 1 Collection ──────────────────────────────────
// Placeholder images — replace with actual IPFS / LaunchMyNFT URIs

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
  buildCharacter("cam-001", "CamWOW #001 — Diamond King", "/nfts/001.png", [
    { trait_type: "Skin", value: "Diamond" },
    { trait_type: "Eyes", value: "Sunglasses" },
    { trait_type: "Headwear", value: "Crown" },
    { trait_type: "Clothing", value: "Cape" },
    { trait_type: "Accessory", value: "Chain" },
    { trait_type: "Background", value: "Galaxy" },
  ]),
  buildCharacter("cam-002", "CamWOW #002 — Lava Warrior", "/nfts/002.png", [
    { trait_type: "Skin", value: "Lava" },
    { trait_type: "Eyes", value: "Laser Eyes" },
    { trait_type: "Headwear", value: "Helmet" },
    { trait_type: "Clothing", value: "Armor" },
    { trait_type: "Accessory", value: "Sword" },
    { trait_type: "Background", value: "Fire" },
  ]),
  buildCharacter("cam-003", "CamWOW #003 — Ice Phantom", "/nfts/003.png", [
    { trait_type: "Skin", value: "Ice" },
    { trait_type: "Eyes", value: "Goggles" },
    { trait_type: "Headwear", value: "Beanie" },
    { trait_type: "Clothing", value: "Hoodie" },
    { trait_type: "Accessory", value: "Skateboard" },
    { trait_type: "Background", value: "Arctic" },
  ]),
  buildCharacter("cam-004", "CamWOW #004 — Neon Hustler", "/nfts/004.png", [
    { trait_type: "Skin", value: "Neon" },
    { trait_type: "Eyes", value: "3D Glasses" },
    { trait_type: "Headwear", value: "Mohawk" },
    { trait_type: "Clothing", value: "Leather" },
    { trait_type: "Accessory", value: "Guitar" },
    { trait_type: "Background", value: "Neon" },
  ]),
  buildCharacter("cam-005", "CamWOW #005 — Golden Sage", "/nfts/005.png", [
    { trait_type: "Skin", value: "Gold" },
    { trait_type: "Eyes", value: "Monocle" },
    { trait_type: "Headwear", value: "Top Hat" },
    { trait_type: "Clothing", value: "Suit" },
    { trait_type: "Accessory", value: "Wand" },
    { trait_type: "Background", value: "Space" },
  ]),
  buildCharacter("cam-006", "CamWOW #006 — Crystal Scout", "/nfts/006.png", [
    { trait_type: "Skin", value: "Crystal" },
    { trait_type: "Eyes", value: "Visor" },
    { trait_type: "Headwear", value: "Bandana" },
    { trait_type: "Clothing", value: "Jersey" },
    { trait_type: "Accessory", value: "Watch" },
    { trait_type: "Background", value: "Forest" },
  ]),
  buildCharacter("cam-007", "CamWOW #007 — Obsidian Monk", "/nfts/007.png", [
    { trait_type: "Skin", value: "Obsidian" },
    { trait_type: "Eyes", value: "Glowing Eyes" },
    { trait_type: "Headwear", value: "Halo" },
    { trait_type: "Clothing", value: "Robe" },
    { trait_type: "Accessory", value: "Shield" },
    { trait_type: "Background", value: "Desert" },
  ]),
  buildCharacter("cam-008", "CamWOW #008 — Bronze Brawler", "/nfts/008.png", [
    { trait_type: "Skin", value: "Bronze" },
    { trait_type: "Eyes", value: "Heart Eyes" },
    { trait_type: "Headwear", value: "Horns" },
    { trait_type: "Clothing", value: "Tank" },
    { trait_type: "Accessory", value: "Backpack" },
    { trait_type: "Background", value: "Ocean" },
  ]),
];
