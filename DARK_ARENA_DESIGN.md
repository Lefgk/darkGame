# Dark Arena

**Turn-Based Space Battle Royale on PulseChain**

---

## Overview

Dark Arena is a turn-based battle royale game where players pilot their FuelCell spaceships on an 8x8 grid. Each turn lasts 10 seconds (1 PulseChain block). Players explore, collect loot, fight enemies, and battle each other. Top 3 survivors split the prize pool.

---

## How It Works

### Entry Requirements

- Own at least 1 FuelCell NFT (your spaceship)
- Pay entry fee in PLS (native PulseChain token)
- Entry fees configurable per game (e.g., 100 PLS, 500 PLS, 1000 PLS)

### Game Flow

| Phase | Description |
|-------|-------------|
| **1. Lobby** | Players join and pay entry fee. Minimum 5 players to start. Auto-refund if lobby doesn't fill in 30 min. |
| **2. Launch** | Game starts. Random seed generated. Board populated with loot, enemies, traps. Ships spawn at random positions. |
| **3. Battle** | 10-second turns. Players move, shoot, loot, or defend. Enemies attack nearby ships. |
| **4. Storm** | Every 10 turns, outer ring becomes radiation zone (10 damage/turn). Forces players toward center. |
| **5. Victory** | Last 3 survivors split the prize pool. |

---

## The Grid

8x8 space sector (64 tiles).

### Board Visual (Example Mid-Game)

```
    A     B     C     D     E     F     G     H
  ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐
1 │ ░░░ │     │  †  │     │ $$$ │     │ ░░░ │ ░░░ │
  │STORM│     │WRECK│     │ PLS │     │STORM│STORM│
  ├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
2 │ ░░░ │ <X> │     │  ⚔  │     │     │ >o< │ ░░░ │
  │STORM│ YOU │     │WEAPN│     │     │ENEMY│STORM│
  ├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
3 │     │     │ ### │     │  †  │     │     │ ░░░ │
  │     │     │NEBUL│     │WRECK│     │     │STORM│
  ├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
4 │     │  ⛨  │     │     │     │ <P> │     │     │
  │     │ARMOR│     │     │     │ FOE │     │     │
  ├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
5 │     │     │     │ >O< │     │     │  †  │     │
  │     │     │     │BOSS │     │     │WRECK│     │
  ├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
6 │ ░░░ │     │ *** │     │     │ ### │     │     │
  │STORM│     │DARK │     │     │NEBUL│     │     │
  ├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
7 │ ░░░ │ <P> │     │     │ $$$ │     │     │ ░░░ │
  │STORM│ FOE │     │     │ PLS │     │     │STORM│
  ├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
8 │ ░░░ │ ░░░ │  !  │     │     │  †  │ ░░░ │ ░░░ │
  │STORM│STORM│TRAP │     │     │WRECK│STORM│STORM│
  └─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┘

  LEGEND:
  ┌──────────────────────────────────────────────┐
  │  <X>  = Your Ship       <P>  = Enemy Player  │
  │  >o<  = Scout Drone     >O<  = Battlecruiser │
  │  ░░░  = Storm Zone       †   = Debris (loot) │
  │  ###  = Nebula (hide)    !   = Hidden Trap   │
  │  ⚔   = Weapon Drop      ⛨   = Armor Drop    │
  │  $$$  = PLS Cache       ***  = DARK Stash    │
  └──────────────────────────────────────────────┘
```

### Zone Shrinking Visual

```
TURN 1-10           TURN 11-20          TURN 21-30          TURN 31+
Full Board          Outer Ring Storm    2 Rings Storm       Center Only

┌────────────┐      ░░░░░░░░░░░░░░      ░░░░░░░░░░░░░░      ░░░░░░░░░░░░░░
│            │      ░┌────────┐░░░      ░░░░░░░░░░░░░░      ░░░░░░░░░░░░░░
│            │      ░│        │░░░      ░░┌──────┐░░░░      ░░░░┌────┐░░░░
│   SAFE     │      ░│  SAFE  │░░░      ░░│ SAFE │░░░░      ░░░░│SAFE│░░░░
│   ZONE     │  →   ░│  ZONE  │░░░  →   ░░│ ZONE │░░░░  →   ░░░░│ZONE│░░░░
│            │      ░│        │░░░      ░░└──────┘░░░░      ░░░░└────┘░░░░
│            │      ░└────────┘░░░      ░░░░░░░░░░░░░░      ░░░░░░░░░░░░░░
└────────────┘      ░░░░░░░░░░░░░░      ░░░░░░░░░░░░░░      ░░░░░░░░░░░░░░
   8x8                  6x6                 4x4                 2x2
```

### Each tile can contain:

| Tile | Description |
|------|-------------|
| Empty Space | Safe, nothing here |
| Debris Field | Contains loot (weapons, armor, currency) |
| Enemy Patrol | NPC ship that attacks if adjacent |
| Asteroid | Hidden trap, deals 15 damage when entered |
| Nebula | Blocks vision, good for hiding |
| Storm Zone | Radiation, 10 HP damage per turn |

Tiles are hidden until explored (fog of war).

---

## Ship Classes & Abilities

Your FuelCell's journey determines your ship class. Each class has unique stats + abilities.

### Stats by Class

| Journey | Class | HP | Attack | Defense | Speed | Playstyle |
|---------|-------|-----|--------|---------|-------|-----------|
| **J1** | Titan | 130 | 14 | 8 | 1 | Brawler |
| **J2-5** | Dreadnought | 125 | 13 | 8 | 1 | Tank |
| **J6-10** | Cruiser | 115 | 12 | 6 | 1 | Support |
| **J11-20** | Frigate | 105 | 11 | 5 | 1 | Assassin |
| **J21-33** | Fighter | 100 | 12 | 4 | 2 | Glass Cannon |

### Passive Abilities (Always Active)

| Class | Passive | Effect |
|-------|---------|--------|
| Titan | **Intimidate** | Adjacent enemies deal -2 damage to you |
| Dreadnought | **Heavy Armor** | Take -2 damage from all sources |
| Cruiser | **Balanced Systems** | +5 HP when picking up any loot |
| Frigate | **Evasive** | 25% chance to dodge attacks |
| Fighter | **Swift** | Can move 2 tiles per turn |

### Active Abilities (3 Turn Cooldown)

| Class | Ability | Effect |
|-------|---------|--------|
| Titan | **Void Blast** | Deal 8 damage to ALL 8 adjacent tiles |
| Dreadnought | **Ram** | Move + attack in one action, +5 bonus damage |
| Cruiser | **EMP Pulse** | Stun all adjacent ships for 1 turn |
| Frigate | **Cloak** | Invisible for 2 turns (can still attack) |
| Fighter | **Ambush** | Next attack deals 2x damage |

### Ability Visuals

**Titan - Void Blast:**
```
┌───┬───┬───┐
│ 8 │ 8 │ 8 │  Deals 8 damage
├───┼───┼───┤  to ALL adjacent
│ 8 │ T │ 8 │
├───┼───┼───┤  T = Titan
│ 8 │ 8 │ 8 │
└───┴───┴───┘
```

**Cruiser - EMP Pulse:**
```
┌───┬───┬───┐
│ ⚡│ ⚡│ ⚡│  All adjacent
├───┼───┼───┤  ships STUNNED
│ ⚡│ C │ ⚡│  (skip next turn)
├───┼───┼───┤
│ ⚡│ ⚡│ ⚡│  C = Cruiser
└───┴───┴───┘
```

---

## Actions (1 Per Turn)

Each turn you choose ONE action:

| Action | Effect |
|--------|--------|
| **Thrust** | Move 1 tile in any direction (8 directions) |
| **Fire** | Attack adjacent ship (player or NPC) |
| **Scavenge** | Pick up loot on current tile |
| **Shields Up** | Take 50% less damage this turn |
| **Use Item** | Activate consumable from inventory |

**Timeout**: If no action submitted within 10 seconds, ship auto-defends (Shields Up).

---

## Loot

### Weapons (Permanent Attack Boost)

| Weapon | Attack | Type | Crit Bonus | Rarity |
|--------|--------|------|------------|--------|
| Laser Cannon | +3 | Melee | +0% | Common |
| Plasma Blaster | +5 | Melee | +5% | Uncommon |
| Sniper Beam | +4 | Ranged | +10% | Uncommon |
| Scatter Gun | +3 | AOE | +0% | Uncommon |
| Piercing Lance | +6 | Piercing | +5% | Rare |
| Ion Disruptor | +8 | Melee | +10% | Rare |
| Void Cannon | +12 | Melee | +15% | Legendary |

**Weapon Types:**
- **Melee**: Standard 1-tile range
- **Ranged**: Can hit 2 tiles away (-3 damage at range)
- **AOE**: Hits all adjacent enemies (damage split)
- **Piercing**: Ignores 50% of target's defense

### Armor (Permanent Defense Boost)

| Armor | Bonus | Rarity |
|-------|-------|--------|
| Hull Plating | +3 Defense | Common |
| Shield Generator | +5 Defense | Uncommon |
| Nano Armor | +8 Defense | Rare |
| Dark Matter Shield | +12 Defense | Legendary |

### Consumables (One-Time Use)

| Item | Effect | Rarity |
|------|--------|--------|
| Repair Kit | +20 HP instantly | Common |
| Emergency Warp | Teleport to random safe tile | Rare |
| Cloaking Device | Invisible for 2 turns | Rare |
| EMP Bomb | Stun adjacent enemies 1 turn | Rare |

### Currency

| Loot | Description |
|------|-------------|
| PLS Cache | Bonus PLS added to your personal winnings |
| DARK Stash | Bonus DARK tokens (rarer, more valuable) |

*Currency pickups go directly to finder, not shared pool.*

---

## Enemies (PvE)

NPC ships patrol the grid. Kill them for rewards.

| Enemy | HP | Attack | Drops |
|-------|-----|--------|-------|
| Scout Drone | 10 | 2 | 5 PLS |
| Patrol Ship | 25 | 5 | 15 PLS + Common item chance |
| Destroyer | 50 | 10 | 30 PLS + Uncommon item |
| Battlecruiser | 100 | 15 | 75 PLS + Rare item + DARK |

---

## Combat

### Basic Rules

- Can only attack ships **adjacent** to you (8 tiles around)
- Ranged weapons can hit 2 tiles away

```
     ┌───┬───┬───┐
     │ ✓ │ ✓ │ ✓ │  ✓ = Valid attack targets
     ├───┼───┼───┤
     │ ✓ │YOU│ ✓ │  (melee range)
     ├───┼───┼───┤
     │ ✓ │ ✓ │ ✓ │
     └───┴───┴───┘
```

### Damage Formula

```
Damage = Attacker's Attack - Defender's Defense
```

If defender used "Shields Up":
```
Damage = (Attack - Defense) × 0.5
```

### Critical Hits

- **Base crit chance**: 10%
- **Crit damage**: 2x normal damage
- Some weapons add bonus crit chance

### Weapon Types

| Type | Range | Special |
|------|-------|---------|
| Melee | 1 tile | Standard damage |
| Ranged | 2 tiles | -3 damage at range |
| AOE | Adjacent | Splits damage across all targets |
| Piercing | 1 tile | Ignores 50% of defense |

### Combat Example

Your ship: 14 Attack + Piercing Lance (+6, ignores 50% def) = **20 Attack**

Enemy ship: 5 Defense + Shield Generator (+5) = **10 Defense**

```
Their effective defense: 10 × 0.5 (piercing) = 5
Damage = 20 - 5 = 15 HP

Crit roll (10% chance): If crit → 30 HP damage!
```

### Turn Order

All players submit actions in same 10-second window. Then:

1. All **movements** resolve
2. All **attacks** resolve simultaneously
3. All **loot pickups** resolve
4. **NPCs** attack nearby players
5. **Storm damage** applied
6. **Dead ships** removed, wreckage spawns

*Simultaneous attacks = mutual kills possible*

---

## Kill Rewards

**No healing on kills.** Instead you get bounty + salvage.

### Bounty System

Kills add PLS to your **personal winnings** (separate from prize pool):

| Target | Bounty |
|--------|--------|
| Scout Drone | +5 PLS |
| Patrol Ship | +15 PLS |
| Destroyer | +30 PLS |
| Battlecruiser | +75 PLS |
| **Player** | +25 PLS |

**Inheritance**: Kill a player who had kills → you get 50% of their accumulated bounty.

Example: Kill player with 3 kills (75 PLS bounty):
- Base: 25 PLS
- Inherited: 37 PLS (50% of their 75)
- **Total: 62 PLS**

### Salvage System

Destroyed ships leave **wreckage** on their tile. Move there to salvage.

```
  Kill:              Wreckage:           Salvage:
┌───┬───┐          ┌───┬───┐          ┌───┬───┐
│YOU│ E │    →     │YOU│ † │    →     │   │YOU│  (got loot!)
└───┴───┘          └───┴───┘          └───┴───┘
```

**Salvage Drops:**

| Drop | Chance | Notes |
|------|--------|-------|
| Repair Kit | 40% | +20 HP |
| EMP Bomb | 20% | Stun consumable |
| Emergency Warp | 15% | Teleport consumable |
| Cloaking Device | 10% | 2 turn invis |
| Random Weapon | 10% | Player kills only |
| Random Armor | 5% | Player kills only |

*Player wreckage has better drops than NPC wreckage.*

---

## Zone Shrinking

Radiation storm closes in over time:

| Turns | Safe Zone |
|-------|-----------|
| 1-10 | Full 8x8 grid |
| 11-20 | 6x6 (outer ring = storm) |
| 21-30 | 4x4 |
| 31-40 | 2x2 |
| 41+ | Final tile |

**Storm damage**: 10 HP per turn outside safe zone.

---

## Anti-Camping

| Mechanic | Effect |
|----------|--------|
| Idle Penalty | No movement for 3 turns = 5 HP damage per turn |
| Kill Bonus | Destroying any ship heals +10 HP |
| Loot Spawns | Best loot spawns away from player clusters |
| Storm | Forces everyone toward center |

---

## Prize Distribution

Entry fees collected in PLS. Distributed when game ends:

```
Prize Pool: 100%
│
├── Winners: 90%
│   ├── 1st Place: 54% of total
│   ├── 2nd Place: 22.5% of total
│   └── 3rd Place: 13.5% of total
│
├── Dev Fee: 5%
├── Burned: 2%
└── Main Jackpot: 3%
```

### Example (10 players × 100 PLS = 1,000 PLS pool)

| Recipient | Amount |
|-----------|--------|
| 1st Place | 540 PLS |
| 2nd Place | 225 PLS |
| 3rd Place | 135 PLS |
| Dev Fee | 50 PLS |
| Burned | 20 PLS |
| Jackpot | 30 PLS |

*Plus any PLS/DARK found during the game goes directly to finder.*

---

## Game Settings

| Setting | Value |
|---------|-------|
| Board Size | 8x8 (64 tiles) |
| Min Players | 5 |
| Max Players | 16 |
| Turn Duration | 10 seconds (1 block) |
| Lobby Timeout | 30 minutes (auto-refund) |
| Entry Fee | Configurable (PLS) |

---

## Randomness

### How It Works

When game starts (5+ players), a **seed** is generated once and locked:

```
Seed = Hash(block.prevrandao + timestamp + gameId + all player addresses)
```

This single seed determines EVERYTHING for that game.

### What Randomness Controls

| Event | How It's Calculated |
|-------|---------------------|
| **Board Layout** | Seed + "board" → which tiles have loot, enemies, traps |
| **Spawn Positions** | Seed + "spawns" → where each player starts |
| **Loot Contents** | Seed + tile position → what item is on each tile |
| **Crit Rolls** | Seed + turn + attacker → did attack crit? |
| **Dodge Rolls** | Seed + turn + defender → did Frigate evade? |
| **Salvage Drops** | Seed + kill position → what drops from wreckage |
| **NPC Movement** | Seed + turn → which direction enemies patrol |

### Example: Critical Hit Roll

```
Turn 15, Player 0xABC attacks:

Random = Hash(gameSeed + "crit" + turn15 + 0xABC)
Roll = Random % 100

Base crit chance: 10%
Weapon bonus: +5% (Plasma Blaster)
Total: 15%

If Roll < 15 → CRITICAL HIT (2x damage)
```

### Example: Board Generation

```
For each tile (0-63):
  TileRandom = Hash(gameSeed + "tile" + position)
  TileType = TileRandom % 100

  0-50:   Empty space
  51-70:  Debris field (loot)
  71-80:  Enemy patrol
  81-90:  Nebula
  91-95:  Asteroid (trap)
  96-100: High-value loot
```

### Why This System

| Benefit | Explanation |
|---------|-------------|
| **No Oracle** | All on-chain, no external dependency |
| **Cheap** | No VRF fees, just hash operations |
| **Fast** | Instant, no waiting for randomness |
| **Fair** | Seed locked at start, can't be manipulated mid-game |
| **Verifiable** | Anyone can recalculate all outcomes post-game |
| **Deterministic** | Same seed = exact same game replay |

### Hidden But Pre-Determined

The entire board is generated at game start, but tiles stay **hidden** (fog of war) until a player moves adjacent. You don't know what's on tile E5 until someone explores it - but it was already decided by the seed.

---

## Integration with Dark Ecosystem

| Asset | Integration |
|-------|-------------|
| **FuelCell NFT** | Required to play. Journey determines ship stats. |
| **DARK Token** | Found as rare loot. Bonus rewards. |
| **Main Jackpot** | 3% of each game feeds into existing jackpot system. |

---

## Technical Summary

### Smart Contracts

| Contract | Purpose |
|----------|---------|
| DarkArena.sol | Main game logic, turns, combat, board |
| ArenaFactory.sol | Create games, manage lobbies |
| ArenaTreasury.sol | Entry fees, prize distribution, dev fee |

### Key Features

- PulseChain native (10 sec blocks = 10 sec turns)
- FuelCell NFT gated entry
- On-chain game state
- Pre-generated randomness (no oracle)
- Auto-refund for unfilled lobbies
- Commit-reveal for fair action submission

---

## Game Strategy

### Early Game (Turns 1-10)
- Explore debris fields for weapons/armor
- Hunt Scout Drones for easy PLS
- Avoid other players until geared

### Mid Game (Turns 11-25)
- Engage weakened players
- Farm Destroyers for Uncommon+ loot
- Stack equipment upgrades
- Position toward center

### Late Game (Turns 26+)
- Zone forces confrontation
- Use consumables strategically
- Manage HP carefully
- J1 ships have edge, but geared ships can win

---

## Summary

**Dark Arena** = Chess meets Battle Royale meets Crypto

- 5-16 players
- 8x8 grid
- 10 second turns
- FuelCell = your ship
- PLS entry, PLS prizes
- Top 3 win
- 5% dev fee

---

*Built on PulseChain. Powered by FuelCell NFTs and DARK tokens.*
