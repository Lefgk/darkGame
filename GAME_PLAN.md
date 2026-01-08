# Dark Arena - Turn-Based Battle Royale Game Plan

## Overview

A turn-based battle royale game on PulseChain where players move on a grid board, discover loot, fight enemies, and compete to be the last survivor. Each turn is 10 seconds (1 PulseChain block).

---

## Core Game Mechanics

### Game Flow

1. **Lobby Phase**: Players join by paying entry fee (DARK tokens)
2. **Start Condition**: Game begins when minimum players reached (e.g., 8-16 players)
3. **Battle Phase**: Players take turns moving, looting, fighting
4. **Shrinking Zone**: Board shrinks over time (like battle royale)
5. **End Condition**: Last player standing OR highest HP when zone fully collapses

### Board Design

```
┌───┬───┬───┬───┬───┬───┬───┬───┐
│ L │   │ E │   │   │ L │   │ E │  8x8 to 16x16 grid
├───┼───┼───┼───┼───┼───┼───┼───┤
│   │ P │   │   │ L │   │ P │   │  L = Loot tile
├───┼───┼───┼───┼───┼───┼───┼───┤  E = Enemy spawn
│ E │   │   │ T │   │   │   │ L │  P = Player spawn
├───┼───┼───┼───┼───┼───┼───┼───┤  T = Trap
│   │   │ L │   │   │ E │   │   │
├───┼───┼───┼───┼───┼───┼───┼───┤
│   │ L │   │   │   │   │ L │   │
├───┼───┼───┼───┼───┼───┼───┼───┤
│ L │   │   │ E │   │   │   │ E │
├───┼───┼───┼───┼───┼───┼───┼───┤
│   │ P │   │   │ L │   │ P │   │
├───┼───┼───┼───┼───┼───┼───┼───┤
│ E │   │ L │   │   │ L │   │ E │
└───┴───┴───┴───┴───┴───┴───┴───┘
```

### Turn System (10 seconds per turn)

- Each block = 1 turn = 10 seconds
- Players submit action within the block
- If no action submitted → **auto-defend** (stay in place, 50% damage reduction)
- Actions resolved at block confirmation

### Movement Encouragement (Anti-Camping)

To discourage passive play:
- **Idle Penalty**: After 3 consecutive turns of not moving, player takes 5 HP damage per turn
- **Aggression Bonus**: Killing an enemy or player grants +10 HP heal
- **Loot Incentive**: Valuable loot spawns away from player clusters
- **Zone Pressure**: Shrinking zone forces movement naturally

### Player Actions (Pick ONE per turn)

1. **Move**: Move 1 tile in any direction (8 directions)
2. **Attack**: Attack adjacent player or enemy (melee)
3. **Use Item**: Use a collected item
4. **Defend**: Reduce incoming damage by 50%
5. **Skip**: Do nothing (save stamina)

---

## Integration with Dark Ecosystem

### FuelCell NFT Integration

- **Entry Requirement**: Must own at least 1 FuelCell to play
- **Journey-Based Rarity**: Older journeys = rarer = better bonuses
  - Journey 1 (J1): +25 HP, +3 Attack, +2 Defense (rarest)
  - Journey 2-5: +20 HP, +2 Attack, +2 Defense
  - Journey 6-10: +15 HP, +2 Attack, +1 Defense
  - Journey 11-20: +10 HP, +1 Attack, +1 Defense
  - Journey 21-33: +5 HP, +1 Attack, +0 Defense (most common)
- **Multiple FuelCells**: Use highest journey bonus (no stacking)

### DARK Token Integration

- **Entry Fee**: Pay X DARK tokens to enter game
- **Loot Drops**: Discover DARK tokens on certain tiles
- **Prize Pool**: Winner takes pot (minus dev fee)

---

## Smart Contract Architecture

### Contract 1: `DarkArena.sol` (Main Game Controller)

```solidity
// Core state
mapping(uint256 => Game) public games;
mapping(uint256 => mapping(address => Player)) public players;
mapping(uint256 => mapping(uint256 => Tile)) public board; // gameId => position => tile

struct Game {
    uint256 gameId;
    uint256 startBlock;
    uint256 currentTurn;
    uint256 entryFee;
    uint256 prizePool;
    uint256 playerCount;
    uint256 maxPlayers;
    uint256 minPlayers;
    uint256 boardSize;
    uint256 safeZoneRadius;
    GameState state; // LOBBY, ACTIVE, ENDED
}

struct Player {
    address wallet;
    uint256 fuelCellId;
    uint256 x;
    uint256 y;
    uint256 hp;
    uint256 attack;
    uint256 defense;
    uint256 stamina;
    bool isAlive;
    uint256 lastActionBlock;
}

struct Tile {
    TileType tileType; // EMPTY, LOOT, ENEMY, TRAP, HAZARD
    uint256 lootAmount;
    uint256 enemyHp;
    bool isRevealed;
    bool inSafeZone;
}
```

### Contract 2: `ArenaFactory.sol` (Game Creation)

- Create new game instances
- Configure game parameters
- Track all active games

### Contract 3: `ArenaTreasury.sol` (Fee Management)

```solidity
// Fee structure
uint256 public constant DEV_FEE = 500;      // 5% (basis points)
uint256 public constant BURN_FEE = 200;     // 2% burned
uint256 public constant JACKPOT_FEE = 300;  // 3% to main jackpot

// Distribution on game end
function distributeRewards(uint256 gameId) external {
    uint256 pool = games[gameId].prizePool;

    uint256 devShare = (pool * DEV_FEE) / 10000;
    uint256 burnShare = (pool * BURN_FEE) / 10000;
    uint256 jackpotShare = (pool * JACKPOT_FEE) / 10000;
    uint256 winnerShare = pool - devShare - burnShare - jackpotShare;

    // Transfer to winner
    // Transfer to dev
    // Burn tokens
    // Add to jackpot
}
```

### Randomness System (Pre-Generated Seed)

Instead of on-chain randomness, use a **pre-generated seed string** when game starts:

```solidity
struct Game {
    // ... other fields
    bytes32 gameSeed;  // Set when game starts (min players reached)
}

// Seed generated from: keccak256(block.prevrandao, block.timestamp, gameId, playerAddresses)
function startGame(uint256 gameId) external {
    require(games[gameId].playerCount >= games[gameId].minPlayers);

    // Generate seed at game start - deterministic from this point
    games[gameId].gameSeed = keccak256(abi.encodePacked(
        block.prevrandao,
        block.timestamp,
        gameId,
        getPlayerAddresses(gameId)
    ));

    games[gameId].state = GameState.ACTIVE;
}

// All random events derive from seed + nonce
function getRandom(uint256 gameId, uint256 nonce) internal view returns (uint256) {
    return uint256(keccak256(abi.encodePacked(games[gameId].gameSeed, nonce)));
}
```

**Benefits**:
- No external oracle dependency (cheaper, faster)
- Deterministic - same seed = same game layout
- All players can verify randomness was fair
- Resistant to manipulation (seed locked at start)

---

## Game Configuration Options

### Game Configuration

| Setting | Value |
|---------|-------|
| Board Size | 8x8 (64 tiles) |
| Min Players | 5 |
| Max Players | 16 |
| Turn Duration | 10 seconds (1 block) |
| Entry Fee | Configurable per game (10-1000 DARK) |

### Fee Distribution

```
Total Entry Pool: 100%
├── Winners: 90%
│   ├── 1st Place: 60% of winner share (54% of total)
│   ├── 2nd Place: 25% of winner share (22.5% of total)
│   └── 3rd Place: 15% of winner share (13.5% of total)
├── Dev Fee: 5%
├── Burn: 2%
└── Main Jackpot: 3%
```

### Auto-Refund

If game doesn't reach 5 players within lobby timeout (e.g., 30 min):
- All entry fees automatically refunded
- Players can also manually withdraw before game starts

---

## Gameplay Elements

### Loot Types

| Item | Effect | Rarity |
|------|--------|--------|
| Health Pack | +20 HP | Common |
| Shield | +10 Defense for 3 turns | Uncommon |
| Power Boost | +5 Attack for 3 turns | Uncommon |
| Teleport Scroll | Move to random safe tile | Rare |
| DARK Stash | +X DARK tokens to personal pot | Common |
| Trap Kit | Place trap on current tile | Rare |

### Enemy Types (PvE elements)

| Enemy | HP | Attack | Reward |
|-------|-----|--------|--------|
| Drone | 10 | 2 | 5 DARK |
| Guardian | 25 | 5 | 15 DARK |
| Boss | 100 | 15 | 50 DARK + Item |

### Hazards

- **Storm Zone**: Tiles outside safe zone deal 10 damage/turn
- **Traps**: Hidden tiles that deal 15 damage when stepped on
- **Poison Gas**: Random tiles that deal 5 damage/turn

---

## Zone Shrinking Mechanic

```
Turn 1-10:   Full board safe
Turn 11-20:  Outer 1 ring becomes hazard
Turn 21-30:  Outer 2 rings hazard
Turn 31-40:  Outer 3 rings hazard
...continues until 2x2 center remains
```

---

## Technical Implementation

### Phase 1: Core Contracts

1. [ ] `DarkArena.sol` - Main game logic + inline randomness
2. [ ] `ArenaFactory.sol` - Game creation & lobby management
3. [ ] `ArenaTreasury.sol` - Fee handling & prize distribution

### Phase 2: Game Mechanics

4. [ ] Player registration & FuelCell journey verification
5. [ ] Board generation (8x8) & tile system
6. [ ] Movement & collision detection
7. [ ] Combat system (PvP & PvE)
8. [ ] Loot system
9. [ ] Zone shrinking logic
10. [ ] Idle penalty & kill bonus mechanics

### Phase 3: Integration

11. [ ] Connect to existing DARK token (entry fees, prizes)
12. [ ] Connect to FuelCell NFT - read journey metadata for bonuses
13. [ ] Connect to main Jackpot contract (3% contribution)
14. [ ] Auto-refund logic for unfilled games
15. [ ] Admin functions (pause, emergency withdraw)

### Phase 4: Frontend

15. [ ] Game lobby UI
16. [ ] Board visualization
17. [ ] Action submission interface
18. [ ] Real-time game state updates
19. [ ] Wallet connection (MetaMask, etc.)

### Phase 5: Testing & Deployment

20. [ ] Unit tests for all contracts
21. [ ] Integration tests
22. [ ] Testnet deployment (PulseChain testnet)
23. [ ] Security audit
24. [ ] Mainnet deployment

---

## Security Considerations

1. **Reentrancy**: Use ReentrancyGuard on all token transfers
2. **Front-running**: Commit-reveal scheme for actions
3. **Randomness**: Block hash manipulation protection
4. **Access Control**: Owner functions for emergency stops
5. **Integer Overflow**: Use Solidity 0.8+ built-in checks
6. **Gas Limits**: Batch processing for large player counts

### Commit-Reveal for Fair Play

```solidity
// Turn 1: Player commits hash of action
function commitAction(uint256 gameId, bytes32 commitment) external;

// Turn 2: Player reveals action
function revealAction(uint256 gameId, uint8 action, bytes32 salt) external;
```

---

## Gas Optimization

- Use packed structs (uint8 for coordinates on small boards)
- Bitmap for tile states
- Batch state updates
- Off-chain computation where possible

---

## Estimated Contract Sizes

| Contract | Estimated Size |
|----------|---------------|
| DarkArena | ~15 KB |
| ArenaFactory | ~5 KB |
| ArenaTreasury | ~4 KB |
| ArenaRandomness | ~3 KB |

---

## Design Decisions (Confirmed)

| Decision | Choice |
|----------|--------|
| Board Size | 8x8 fixed |
| Players | 5 min, 16 max |
| FuelCell | Required to play, journey = rarity bonus |
| Mode | Solo only (no teams) |
| Timeout | Auto-defend + idle penalty after 3 turns |
| Winners | Top 3 split (60/25/15) |
| Refund | Auto-refund if game doesn't fill |

---

## File Structure

```
darkGame/
├── contracts/
│   ├── DarkArena.sol
│   ├── ArenaFactory.sol
│   ├── ArenaTreasury.sol
│   ├── ArenaRandomness.sol
│   ├── interfaces/
│   │   ├── IDarkToken.sol
│   │   ├── IFuelCell.sol
│   │   └── IArena.sol
│   └── libraries/
│       ├── BoardLib.sol
│       └── CombatLib.sol
├── test/
│   ├── DarkArena.t.sol
│   ├── ArenaFactory.t.sol
│   └── Integration.t.sol
├── script/
│   ├── Deploy.s.sol
│   └── Configure.s.sol
├── frontend/
│   ├── src/
│   └── public/
└── README.md
```

---

## Next Steps

1. **Review this plan** - Confirm mechanics and features
2. **Answer open questions** - Clarify requirements
3. **Start with core contracts** - DarkArena.sol first
4. **Iterative testing** - Test each feature before adding more
5. **Frontend in parallel** - Start UI while contracts develop

---

## References

- Max Extract: https://github.com/austintgriffith/max-extract
- Dark Token: `/Users/lefgiak/Documents/GitHub/dark/dark/gravity/DarkEvil/Dark.sol`
- FuelCell NFT: `/Users/lefgiak/Documents/GitHub/dark/dark/gravity/DarkEvil/FuelCell.sol`
- PulseChain Block Time: ~10 seconds
