import express from 'express';
import cors from 'cors';
import { ethers } from 'ethers';

const app = express();
app.use(cors());
app.use(express.json());

// Config
const PORT = process.env.PORT || 3001;
const GRID_SIZE = 8;
const TURN_DURATION = 30; // seconds

// Ship classes based on journey
const SHIP_CLASSES = {
  0: { name: 'Fighter', hp: 100, attack: 15, range: 2, speed: 3 },
  1: { name: 'Frigate', hp: 120, attack: 18, range: 2, speed: 2 },
  2: { name: 'Cruiser', hp: 150, attack: 22, range: 3, speed: 2 },
  3: { name: 'Dreadnought', hp: 200, attack: 28, range: 3, speed: 1 },
  4: { name: 'Titan', hp: 250, attack: 35, range: 4, speed: 1 },
};

// Types
interface Ship {
  player: string;
  shipClass: number;
  currentHP: number;
  maxHP: number;
  x: number;
  y: number;
  isAlive: boolean;
  kills: number;
  damageDealt: number;
  hasActed: boolean;
  tokenId: number;
  journeyId: number;
}

interface Loot {
  x: number;
  y: number;
  amount: number;
  collected: boolean;
}

interface Game {
  gameId: number;
  state: 0 | 1 | 2; // 0=Lobby, 1=Active, 2=Finished
  turn: number;
  zoneSize: number;
  zoneOffset: number;
  prizePool: bigint;
  startTime: number;
  turnEndTime: number;
  ships: Ship[];
  loot: Loot[];
  winner: string;
  secondPlace: string;
  thirdPlace: string;
  actionLog: string[];
}

// In-memory game storage
const games: Map<number, Game> = new Map();
let gameCounter = 0;

// Helper: Get ship class from journey
function getShipClassFromJourney(journeyId: number): number {
  if (journeyId <= 2) return 4; // Titan
  if (journeyId <= 5) return 3; // Dreadnought
  if (journeyId <= 10) return 2; // Cruiser
  if (journeyId <= 20) return 1; // Frigate
  return 0; // Fighter
}

// Helper: Get random spawn position
function getRandomSpawn(existingShips: Ship[]): { x: number; y: number } {
  const occupied = new Set(existingShips.map(s => `${s.x},${s.y}`));
  let x, y;
  do {
    x = Math.floor(Math.random() * GRID_SIZE);
    y = Math.floor(Math.random() * GRID_SIZE);
  } while (occupied.has(`${x},${y}`));
  return { x, y };
}

// Helper: Check if position is in safe zone
function isInSafeZone(x: number, y: number, zoneOffset: number, zoneSize: number): boolean {
  return x >= zoneOffset && x < zoneOffset + zoneSize &&
         y >= zoneOffset && y < zoneOffset + zoneSize;
}

// Helper: Calculate distance
function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.max(Math.abs(x1 - x2), Math.abs(y1 - y2)); // Chebyshev distance
}

// Helper: Verify EIP-712 signature
function verifySignature(gameId: number, player: string, action: string, targetX: number, targetY: number, nonce: number, signature: string): boolean {
  const domain = {
    name: 'DarkArena',
    version: '1',
    chainId: 369,
  };

  const types = {
    Action: [
      { name: 'gameId', type: 'uint256' },
      { name: 'player', type: 'address' },
      { name: 'action', type: 'string' },
      { name: 'targetX', type: 'uint8' },
      { name: 'targetY', type: 'uint8' },
      { name: 'nonce', type: 'uint256' },
    ],
  };

  const value = { gameId, player, action, targetX, targetY, nonce };

  try {
    const recoveredAddress = ethers.verifyTypedData(domain, types, value, signature);
    return recoveredAddress.toLowerCase() === player.toLowerCase();
  } catch {
    return false;
  }
}

// API Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', games: games.size });
});

// Create game
app.post('/game/create', (req, res) => {
  gameCounter++;
  const game: Game = {
    gameId: gameCounter,
    state: 0,
    turn: 0,
    zoneSize: GRID_SIZE,
    zoneOffset: 0,
    prizePool: BigInt(0),
    startTime: 0,
    turnEndTime: 0,
    ships: [],
    loot: [],
    winner: '0x0000000000000000000000000000000000000000',
    secondPlace: '0x0000000000000000000000000000000000000000',
    thirdPlace: '0x0000000000000000000000000000000000000000',
    actionLog: [],
  };
  games.set(gameCounter, game);
  res.json({ success: true, gameId: gameCounter });
});

// Join game
app.post('/game/:gameId/join', (req, res) => {
  const gameId = parseInt(req.params.gameId);
  const { player, tokenId, journeyId, signature } = req.body;

  const game = games.get(gameId);
  if (!game) return res.status(404).json({ error: 'Game not found' });
  if (game.state !== 0) return res.status(400).json({ error: 'Game already started' });
  if (game.ships.length >= 16) return res.status(400).json({ error: 'Game full' });
  if (game.ships.some(s => s.player.toLowerCase() === player.toLowerCase())) {
    return res.status(400).json({ error: 'Already joined' });
  }

  // For testing, skip signature verification
  // In production: verify signature proves wallet ownership

  const shipClass = getShipClassFromJourney(journeyId);
  const stats = SHIP_CLASSES[shipClass as keyof typeof SHIP_CLASSES];
  const spawn = getRandomSpawn(game.ships);

  const ship: Ship = {
    player,
    shipClass,
    currentHP: stats.hp,
    maxHP: stats.hp,
    x: spawn.x,
    y: spawn.y,
    isAlive: true,
    kills: 0,
    damageDealt: 0,
    hasActed: false,
    tokenId,
    journeyId,
  };

  game.ships.push(ship);
  game.actionLog.push(`${player.slice(0, 6)}... joined with ${stats.name}`);

  res.json({ success: true, ship, playerCount: game.ships.length });
});

// Start game
app.post('/game/:gameId/start', (req, res) => {
  const gameId = parseInt(req.params.gameId);
  const game = games.get(gameId);

  if (!game) return res.status(404).json({ error: 'Game not found' });
  if (game.state !== 0) return res.status(400).json({ error: 'Game already started' });
  if (game.ships.length < 1) return res.status(400).json({ error: 'Not enough players' });

  game.state = 1;
  game.turn = 1;
  game.startTime = Date.now();
  game.turnEndTime = Date.now() + TURN_DURATION * 1000;

  // Spawn some random loot
  for (let i = 0; i < 5; i++) {
    const spawn = getRandomSpawn(game.ships);
    game.loot.push({
      x: spawn.x,
      y: spawn.y,
      amount: Math.floor(Math.random() * 30) + 10,
      collected: false,
    });
  }

  game.actionLog.push(`Game started with ${game.ships.length} players!`);

  res.json({ success: true, game: serializeGame(game) });
});

// Perform action (move or attack)
app.post('/game/:gameId/action', (req, res) => {
  const gameId = parseInt(req.params.gameId);
  const { player, action, targetX, targetY, signature, nonce } = req.body;

  const game = games.get(gameId);
  if (!game) return res.status(404).json({ error: 'Game not found' });
  if (game.state !== 1) return res.status(400).json({ error: 'Game not active' });

  const ship = game.ships.find(s => s.player.toLowerCase() === player.toLowerCase());
  if (!ship) return res.status(400).json({ error: 'Player not in game' });
  if (!ship.isAlive) return res.status(400).json({ error: 'Ship destroyed' });
  if (ship.hasActed) return res.status(400).json({ error: 'Already acted this turn' });

  // Verify signature (skip for testing if no signature provided)
  if (signature && !verifySignature(gameId, player, action, targetX, targetY, nonce, signature)) {
    return res.status(400).json({ error: 'Invalid signature' });
  }

  const stats = SHIP_CLASSES[ship.shipClass as keyof typeof SHIP_CLASSES];

  if (action === 'move') {
    // Validate move distance
    const dist = distance(ship.x, ship.y, targetX, targetY);
    if (dist > stats.speed) {
      return res.status(400).json({ error: `Can only move ${stats.speed} tiles` });
    }
    if (targetX < 0 || targetX >= GRID_SIZE || targetY < 0 || targetY >= GRID_SIZE) {
      return res.status(400).json({ error: 'Out of bounds' });
    }
    // Check if tile is occupied
    if (game.ships.some(s => s.isAlive && s.x === targetX && s.y === targetY && s.player !== player)) {
      return res.status(400).json({ error: 'Tile occupied' });
    }

    ship.x = targetX;
    ship.y = targetY;
    ship.hasActed = true;

    // Check for loot pickup
    const loot = game.loot.find(l => !l.collected && l.x === targetX && l.y === targetY);
    if (loot) {
      ship.currentHP = Math.min(ship.maxHP, ship.currentHP + loot.amount);
      loot.collected = true;
      game.actionLog.push(`${player.slice(0, 6)}... collected ${loot.amount} HP`);
    }

    game.actionLog.push(`${player.slice(0, 6)}... moved to (${targetX}, ${targetY})`);
  } else if (action === 'attack') {
    // Find target at position
    const target = game.ships.find(s => s.isAlive && s.x === targetX && s.y === targetY && s.player !== player);
    if (!target) {
      return res.status(400).json({ error: 'No target at position' });
    }

    // Validate attack range
    const dist = distance(ship.x, ship.y, targetX, targetY);
    if (dist > stats.range) {
      return res.status(400).json({ error: `Target out of range (max ${stats.range})` });
    }

    // Calculate damage with some randomness
    const damage = stats.attack + Math.floor(Math.random() * 10) - 5;
    target.currentHP -= damage;
    ship.damageDealt += damage;
    ship.hasActed = true;

    game.actionLog.push(`${player.slice(0, 6)}... attacked ${target.player.slice(0, 6)}... for ${damage} damage`);

    if (target.currentHP <= 0) {
      target.currentHP = 0;
      target.isAlive = false;
      ship.kills++;
      game.actionLog.push(`${target.player.slice(0, 6)}... was destroyed!`);

      // Drop loot on death
      game.loot.push({
        x: target.x,
        y: target.y,
        amount: 25,
        collected: false,
      });

      // Check for game end
      checkGameEnd(game);
    }
  } else {
    return res.status(400).json({ error: 'Invalid action' });
  }

  res.json({ success: true, game: serializeGame(game) });
});

// End turn (for testing - auto advances turn)
app.post('/game/:gameId/endTurn', (req, res) => {
  const gameId = parseInt(req.params.gameId);
  const game = games.get(gameId);

  if (!game) return res.status(404).json({ error: 'Game not found' });
  if (game.state !== 1) return res.status(400).json({ error: 'Game not active' });

  advanceTurn(game);
  res.json({ success: true, game: serializeGame(game) });
});

// Get game state
app.get('/game/:gameId', (req, res) => {
  const gameId = parseInt(req.params.gameId);
  const game = games.get(gameId);

  if (!game) return res.status(404).json({ error: 'Game not found' });
  res.json(serializeGame(game));
});

// Get all games
app.get('/games', (req, res) => {
  const allGames = Array.from(games.values()).map(serializeGame);
  res.json({ games: allGames, total: gameCounter });
});

// Helper: Advance turn
function advanceTurn(game: Game) {
  game.turn++;
  game.turnEndTime = Date.now() + TURN_DURATION * 1000;

  // Reset hasActed for all ships
  game.ships.forEach(s => s.hasActed = false);

  // Zone shrink every 3 turns
  if (game.turn % 3 === 0 && game.zoneSize > 4) {
    game.zoneSize--;
    game.zoneOffset = Math.floor((GRID_SIZE - game.zoneSize) / 2);
    game.actionLog.push(`Zone shrinks to ${game.zoneSize}x${game.zoneSize}!`);

    // Damage ships outside zone
    game.ships.forEach(ship => {
      if (ship.isAlive && !isInSafeZone(ship.x, ship.y, game.zoneOffset, game.zoneSize)) {
        const damage = 20;
        ship.currentHP -= damage;
        game.actionLog.push(`${ship.player.slice(0, 6)}... takes ${damage} zone damage`);

        if (ship.currentHP <= 0) {
          ship.currentHP = 0;
          ship.isAlive = false;
          game.actionLog.push(`${ship.player.slice(0, 6)}... died to the zone!`);
        }
      }
    });

    checkGameEnd(game);
  }

  game.actionLog.push(`Turn ${game.turn} started`);
}

// Helper: Check if game should end
function checkGameEnd(game: Game) {
  const alive = game.ships.filter(s => s.isAlive);

  if (alive.length <= 1) {
    game.state = 2;

    // Sort by: alive first, then kills, then damage
    const ranked = [...game.ships].sort((a, b) => {
      if (a.isAlive !== b.isAlive) return a.isAlive ? -1 : 1;
      if (a.kills !== b.kills) return b.kills - a.kills;
      return b.damageDealt - a.damageDealt;
    });

    game.winner = ranked[0]?.player || '0x0000000000000000000000000000000000000000';
    game.secondPlace = ranked[1]?.player || '0x0000000000000000000000000000000000000000';
    game.thirdPlace = ranked[2]?.player || '0x0000000000000000000000000000000000000000';

    game.actionLog.push(`Game Over! Winner: ${game.winner.slice(0, 6)}...`);
  }
}

// Helper: Serialize game for JSON response
function serializeGame(game: Game) {
  return {
    gameId: game.gameId,
    state: game.state,
    turn: game.turn,
    zoneSize: game.zoneSize,
    zoneOffset: game.zoneOffset,
    prizePool: game.prizePool.toString(),
    startTime: game.startTime,
    turnEndTime: game.turnEndTime,
    playerCount: game.ships.length,
    playersAlive: game.ships.filter(s => s.isAlive).length,
    ships: game.ships,
    loot: game.loot.filter(l => !l.collected),
    winner: game.winner,
    secondPlace: game.secondPlace,
    thirdPlace: game.thirdPlace,
    actionLog: game.actionLog.slice(-20), // Last 20 actions
  };
}

// Auto-advance turns (check every second)
setInterval(() => {
  games.forEach(game => {
    if (game.state === 1 && Date.now() > game.turnEndTime) {
      advanceTurn(game);
    }
  });
}, 1000);

app.listen(PORT, () => {
  console.log(`Dark Arena server running on port ${PORT}`);
});
