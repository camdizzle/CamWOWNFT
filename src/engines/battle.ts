import type { NFTCharacter, Battle, BattleAction, BattleResult } from "../types/nft";

// ── VS Battle Engine ───────────────────────────────────────────────────
// Stat influence on battles:
//   toughness → HP pool & damage reduction
//   speed     → initiative (who attacks first) & dodge chance
//   charisma  → intimidation (chance to reduce opponent attack)
//   luck      → critical hit chance
//   agility   → dodge chance
//   stamina   → sustain damage over rounds

const BASE_HP = 50;
const MAX_ROUNDS = 20;
const BATTLE_COOLDOWN_MS = 4 * 60 * 60 * 1000; // 4 hours per NFT after a battle

interface FighterState {
  character: NFTCharacter;
  hp: number;
  maxHp: number;
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

export { BASE_HP, MAX_ROUNDS, BATTLE_COOLDOWN_MS };

export function simulateBattle(
  challenger: NFTCharacter,
  opponent: NFTCharacter,
  seed?: number
): BattleResult {
  const rand = seededRandom(seed ?? Date.now());

  const fighters: [FighterState, FighterState] = [
    {
      character: challenger,
      hp: BASE_HP + challenger.stats.toughness * 3 + challenger.stats.stamina * 2,
      maxHp: BASE_HP + challenger.stats.toughness * 3 + challenger.stats.stamina * 2,
    },
    {
      character: opponent,
      hp: BASE_HP + opponent.stats.toughness * 3 + opponent.stats.stamina * 2,
      maxHp: BASE_HP + opponent.stats.toughness * 3 + opponent.stats.stamina * 2,
    },
  ];

  const rounds: BattleAction[] = [];

  // Determine initiative
  const order: [number, number] =
    challenger.stats.speed + rand() * 5 >= opponent.stats.speed + rand() * 5
      ? [0, 1]
      : [1, 0];

  for (let round = 1; round <= MAX_ROUNDS; round++) {
    for (const [atkIdx, defIdx] of [order, [order[1], order[0]] as [number, number]]) {
      const attacker = fighters[atkIdx];
      const defender = fighters[defIdx];

      if (attacker.hp <= 0 || defender.hp <= 0) break;

      // Base damage
      let damage = 5 + attacker.character.stats.speed * 0.4 + attacker.character.stats.toughness * 0.3;

      // Dodge check (agility + speed)
      const dodgeChance = (defender.character.stats.agility * 0.02 + defender.character.stats.speed * 0.01);
      if (rand() < dodgeChance) {
        rounds.push({
          round,
          attackerId: attacker.character.id,
          defenderId: defender.character.id,
          damage: 0,
          critical: false,
          description: `${defender.character.name} dodges ${attacker.character.name}'s attack!`,
        });
        continue;
      }

      // Critical hit (luck)
      const critChance = attacker.character.stats.luck * 0.025;
      const critical = rand() < critChance;
      if (critical) {
        damage *= 1.8;
      }

      // Intimidation (charisma reduces damage)
      const intimidation = defender.character.stats.charisma * 0.015;
      if (rand() < intimidation) {
        damage *= 0.6;
      }

      // Damage reduction from toughness
      damage *= Math.max(0.3, 1 - defender.character.stats.toughness * 0.02);

      // Stamina: sustain (less damage taken in later rounds)
      if (round > 5) {
        const staminaBonus = defender.character.stats.stamina * 0.008;
        damage *= Math.max(0.5, 1 - staminaBonus);
      }

      damage = Math.max(1, Math.round(damage));
      defender.hp -= damage;

      const desc = critical
        ? `${attacker.character.name} lands a CRITICAL hit on ${defender.character.name} for ${damage} damage!`
        : `${attacker.character.name} hits ${defender.character.name} for ${damage} damage.`;

      rounds.push({
        round,
        attackerId: attacker.character.id,
        defenderId: defender.character.id,
        damage,
        critical,
        description: desc,
      });

      if (defender.hp <= 0) break;
    }

    if (fighters[0].hp <= 0 || fighters[1].hp <= 0) break;
  }

  // Determine winner
  let winnerId: string;
  let loserId: string;
  if (fighters[0].hp <= 0) {
    winnerId = fighters[1].character.id;
    loserId = fighters[0].character.id;
  } else if (fighters[1].hp <= 0) {
    winnerId = fighters[0].character.id;
    loserId = fighters[1].character.id;
  } else {
    // Timeout: whoever has more HP% wins
    const pct0 = fighters[0].hp / fighters[0].maxHp;
    const pct1 = fighters[1].hp / fighters[1].maxHp;
    winnerId = pct0 >= pct1 ? fighters[0].character.id : fighters[1].character.id;
    loserId = winnerId === fighters[0].character.id ? fighters[1].character.id : fighters[0].character.id;
  }

  return {
    winnerId,
    loserId,
    rounds,
    totalRounds: rounds.length > 0 ? rounds[rounds.length - 1].round : 0,
  };
}

export function createBattle(
  challenger: NFTCharacter,
  opponent: NFTCharacter
): Battle {
  return {
    id: `battle-${Date.now()}`,
    challenger,
    opponent,
    timestamp: Date.now(),
  };
}
