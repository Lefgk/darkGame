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

## Ship Stats

Your FuelCell's journey determines your ship class. Older journeys = rarer = stronger ships.

| Journey | Ship Class | HP | Attack | Defense |
|---------|------------|-----|--------|---------|
| J1 | Titan-Class | 125 | 13 | 7 |
| J2-5 | Dreadnought | 120 | 12 | 7 |
| J6-10 | Cruiser | 115 | 12 | 6 |
| J11-20 | Frigate | 110 | 11 | 6 |
| J21-33 | Fighter | 105 | 11 | 5 |

*Base: 100 HP, 10 Attack, 5 Defense + journey bonuses*

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

| Weapon | Bonus | Rarity |
|--------|-------|--------|
| Laser Cannon | +3 Attack | Common |
| Plasma Blaster | +5 Attack | Uncommon |
| Ion Disruptor | +8 Attack | Rare |
| Void Cannon | +12 Attack | Legendary |

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

### Damage Formula

```
Damage = Attacker's Attack - Defender's Defense
```

If defender used "Shields Up":
```
Damage = (Attack - Defense) × 0.5
```

### Example

Your ship: 12 Attack + Plasma Blaster (+5) = **17 Attack**

Enemy ship: 6 Defense + Hull Plating (+3) = **9 Defense**

```
Damage = 17 - 9 = 8 HP
```

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

- Seed generated at game start from block data + player addresses
- Deterministic: same seed = same board layout
- All players can verify fairness
- No external oracle needed

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
