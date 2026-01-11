'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { GAME_CONFIG, API_URL } from '@/lib/constants';

// Ship class configuration
const SHIP_CLASS_INFO: Record<number, { name: string; emoji: string; color: string; bgColor: string; stats: { maxHP: number; speed: number; range: number; damage: number } }> = {
  0: { name: 'Fighter', emoji: '🚀', color: 'text-gray-400', bgColor: 'bg-gray-500/10 border-gray-500/50', stats: { maxHP: 100, speed: 1, range: 1, damage: 15 } },
  1: { name: 'Frigate', emoji: '🛸', color: 'text-green-400', bgColor: 'bg-green-500/10 border-green-500/50', stats: { maxHP: 120, speed: 1, range: 1, damage: 18 } },
  2: { name: 'Cruiser', emoji: '🌀', color: 'text-blue-400', bgColor: 'bg-blue-500/10 border-blue-500/50', stats: { maxHP: 150, speed: 1, range: 1, damage: 22 } },
  3: { name: 'Dreadnought', emoji: '🔱', color: 'text-purple-400', bgColor: 'bg-purple-500/10 border-purple-500/50', stats: { maxHP: 200, speed: 1, range: 1, damage: 28 } },
  4: { name: 'Titan', emoji: '👑', color: 'text-yellow-400', bgColor: 'bg-yellow-500/10 border-yellow-500/50', stats: { maxHP: 250, speed: 1, range: 1, damage: 35 } },
};

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
  isNPC?: boolean;
  npcName?: string;
}

interface Loot {
  x: number;
  y: number;
  amount: number;
  collected: boolean;
}

interface GameData {
  gameId: number;
  state: number;
  turn: number;
  zoneSize: number;
  zoneOffset: number;
  prizePool: string;
  startTime: number;
  turnEndTime: number;
  playerCount: number;
  playersAlive: number;
  ships: Ship[];
  loot: Loot[];
  winner: string;
  secondPlace: string;
  thirdPlace: string;
  actionLog: string[];
}

interface GameBoardProps {
  gameId: string;
}

// Animation types
interface ActionAnimation {
  type: 'attack' | 'loot' | 'move';
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  damage?: number;
  lootAmount?: number;
}

// Combat modal interface
interface CombatModal {
  show: boolean;
  attacker: string;
  attackerEmoji: string;
  attackerClass: string;
  target: string;
  targetEmoji: string;
  targetClass: string;
  baseDamage: number;
  randomRoll: number;
  finalDamage: number;
  targetHP: number;
  targetMaxHP: number;
  killed: boolean;
  // Counter attack info
  counterDamage?: number;
  attackerHP?: number;
  attackerMaxHP?: number;
  attackerKilled?: boolean;
}

export function GameBoard({ gameId }: GameBoardProps) {
  const { address } = useAccount();
  const [selectedTile, setSelectedTile] = useState<{ x: number; y: number } | null>(null);
  const [turnTimer, setTurnTimer] = useState<number>(30);
  const [game, setGame] = useState<GameData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [animation, setAnimation] = useState<ActionAnimation | null>(null);
  const [floatingText, setFloatingText] = useState<{ x: number; y: number; text: string; color: string } | null>(null);
  const [combatModal, setCombatModal] = useState<CombatModal | null>(null);
  const [prevHP, setPrevHP] = useState<number | null>(null);
  const [showGameOver, setShowGameOver] = useState(true);
  const [prevTurn, setPrevTurn] = useState<number>(0);
  const [prevShipPositions, setPrevShipPositions] = useState<Map<string, { x: number; y: number }>>(new Map());
  const [turnSummary, setTurnSummary] = useState<{ show: boolean; movements: Array<{ name: string; emoji: string; fromX: number; fromY: number; toX: number; toY: number; isNPC: boolean }> } | null>(null);

  // Fetch game data from API
  const fetchGame = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/game/${gameId}`);
      if (!res.ok) throw new Error('Failed to fetch game');
      const data = await res.json();
      setGame(data);
      setError(null);

      // Update turn timer based on server time
      if (data.state === 1 && data.turnEndTime) {
        const remaining = Math.max(0, Math.floor((data.turnEndTime - Date.now()) / 1000));
        setTurnTimer(remaining);
      }
    } catch (e) {
      console.error('Error fetching game:', e);
      setError('Failed to connect to game server');
    }
  }, [gameId]);

  // Poll for game updates
  useEffect(() => {
    fetchGame();
    const interval = setInterval(fetchGame, 1000); // Poll every second for real-time feel
    return () => clearInterval(interval);
  }, [fetchGame]);

  // Detect turn changes and show movement summary
  useEffect(() => {
    if (!game || game.state !== 1) return;

    if (game.turn > prevTurn && prevTurn > 0) {
      // Turn changed! Calculate movements
      const movements: Array<{ name: string; emoji: string; fromX: number; fromY: number; toX: number; toY: number; isNPC: boolean }> = [];

      game.ships.forEach(ship => {
        const prevPos = prevShipPositions.get(ship.player);
        if (prevPos && (prevPos.x !== ship.x || prevPos.y !== ship.y)) {
          const info = SHIP_CLASS_INFO[ship.shipClass];
          movements.push({
            name: ship.isNPC ? (ship.npcName || 'NPC') : ship.player,
            emoji: info.emoji,
            fromX: prevPos.x,
            fromY: prevPos.y,
            toX: ship.x,
            toY: ship.y,
            isNPC: ship.isNPC || false,
          });
        }
      });

      if (movements.length > 0) {
        setTurnSummary({ show: true, movements });
        // Auto-close after 3 seconds
        setTimeout(() => setTurnSummary(null), 3000);
      }
    }

    // Save current positions for next comparison
    setPrevTurn(game.turn);
    const newPositions = new Map<string, { x: number; y: number }>();
    game.ships.forEach(ship => {
      newPositions.set(ship.player, { x: ship.x, y: ship.y });
    });
    setPrevShipPositions(newPositions);
  }, [game?.turn, game?.ships]);

  // Parse data
  const allShips = game?.ships || [];
  const allLoot = (game?.loot || []).filter(l => !l.collected);

  // Find current player's ship
  const myShip = useMemo(() => {
    if (!address || !game) return null;
    return allShips.find(s => s.player.toLowerCase() === address.toLowerCase() && s.isAlive);
  }, [allShips, address, game]);

  const myShipInfo = myShip ? SHIP_CLASS_INFO[myShip.shipClass] : null;

  // Calculate zone boundaries
  const zoneMin = game?.zoneOffset || 0;
  const zoneMax = zoneMin + (game?.zoneSize || 8) - 1;

  // Check if tile is in safe zone
  const isInZone = (x: number, y: number) => {
    return x >= zoneMin && x <= zoneMax && y >= zoneMin && y <= zoneMax;
  };

  // Check if tile is valid move for current player (empty tile within speed)
  const isValidMove = (x: number, y: number) => {
    if (!myShip || myShip.hasActed) return false;
    const dist = Math.max(Math.abs(x - myShip.x), Math.abs(y - myShip.y));
    const stats = SHIP_CLASS_INFO[myShip.shipClass].stats;
    // Valid move: within speed range, not occupied by any alive ship
    return dist > 0 && dist <= stats.speed && !allShips.some(s => s.x === x && s.y === y && s.isAlive);
  };

  // Check if tile is valid attack target (enemy within range)
  const isValidAttack = (x: number, y: number) => {
    if (!myShip || myShip.hasActed) return false;
    const dist = Math.max(Math.abs(x - myShip.x), Math.abs(y - myShip.y));
    const stats = SHIP_CLASS_INFO[myShip.shipClass].stats;
    const targetShip = allShips.find(s => s.x === x && s.y === y && s.isAlive && s.player !== myShip.player);
    // Valid attack: enemy exists at tile and within attack range
    return targetShip !== undefined && dist <= stats.range;
  };

  // Get ship at position
  const getShipAt = (x: number, y: number) => {
    return allShips.find(s => s.x === x && s.y === y);
  };

  // Get loot at position
  const getLootAt = (x: number, y: number) => {
    return allLoot.find(l => l.x === x && l.y === y);
  };

  // Handle action (server auto-detects move vs attack)
  const performAction = async (targetX: number, targetY: number) => {
    if (!address || isProcessing || !myShip) return;

    const fromX = myShip.x;
    const fromY = myShip.y;
    const lootAtTarget = getLootAt(targetX, targetY);
    const targetShip = getShipAt(targetX, targetY);
    const isAttack = targetShip && targetShip.isAlive;

    setIsProcessing(true);
    try {
      const res = await fetch(`${API_URL}/game/${gameId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player: address,
          targetX,
          targetY,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Action failed');
      } else {
        // Show animation based on what happened
        if (data.action === 'attack' && targetShip) {
          setAnimation({ type: 'attack', fromX, fromY, toX: targetX, toY: targetY, damage: data.damage });
          setFloatingText({ x: targetX, y: targetY, text: `-${data.damage}`, color: 'text-red-500' });

          // Show combat modal with detailed breakdown
          const targetInfo = SHIP_CLASS_INFO[targetShip.shipClass];
          const myInfo = SHIP_CLASS_INFO[myShip.shipClass];
          const baseDamage = myInfo.stats.damage;
          const randomRoll = data.damage - baseDamage; // The random part (-5 to +5)
          const newTargetHP = Math.max(0, targetShip.currentHP - data.damage);
          const newAttackerHP = Math.max(0, myShip.currentHP - (data.counterDamage || 0));
          setCombatModal({
            show: true,
            attacker: 'YOU',
            attackerEmoji: myInfo.emoji,
            attackerClass: myInfo.name,
            target: targetShip.isNPC ? (targetShip.npcName || 'Enemy') : targetShip.player,
            targetEmoji: targetInfo.emoji,
            targetClass: targetInfo.name,
            baseDamage: baseDamage,
            randomRoll: randomRoll,
            finalDamage: data.damage,
            targetHP: newTargetHP,
            targetMaxHP: targetInfo.stats.maxHP,
            killed: newTargetHP <= 0,
            // Counter attack info
            counterDamage: data.counterDamage,
            attackerHP: newAttackerHP,
            attackerMaxHP: myInfo.stats.maxHP,
            attackerKilled: newAttackerHP <= 0,
          });

          // Auto-close modal after 5s
          setTimeout(() => setCombatModal(null), 5000);
        } else if (lootAtTarget) {
          setAnimation({ type: 'loot', fromX, fromY, toX: targetX, toY: targetY, lootAmount: lootAtTarget.amount });
          setFloatingText({ x: targetX, y: targetY, text: `+${lootAtTarget.amount} HP`, color: 'text-green-500' });
        } else {
          setAnimation({ type: 'move', fromX, fromY, toX: targetX, toY: targetY });
        }

        // Clear animation after delay
        setTimeout(() => {
          setAnimation(null);
          setFloatingText(null);
        }, 800);

        setGame(data.game);
        setSelectedTile(null);
      }
    } catch (e) {
      console.error('Action failed:', e);
      alert('Action failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle tile click - auto-detect action
  const handleTileClick = (x: number, y: number) => {
    if (!myShip || myShip.hasActed || isProcessing) return;

    // If valid move or attack, perform action
    if (isValidMove(x, y) || isValidAttack(x, y)) {
      performAction(x, y);
    } else {
      setSelectedTile({ x, y });
    }
  };

  // Check if player is adjacent to a position (for revealing loot)
  const isAdjacentToPlayer = (x: number, y: number) => {
    if (!myShip) return false;
    return Math.abs(myShip.x - x) <= 1 && Math.abs(myShip.y - y) <= 1;
  };

  // Random star pattern based on coordinates (deterministic)
  const getStarPattern = (x: number, y: number) => {
    const seed = x * 8 + y;
    if (seed % 7 === 0) return '✦';
    if (seed % 11 === 0) return '✧';
    if (seed % 13 === 0) return '·';
    return '';
  };

  // Render a single tile
  const renderTile = (x: number, y: number) => {
    const ship = getShipAt(x, y);
    const lootItem = getLootAt(x, y);
    const inZone = isInZone(x, y);
    const validMove = isValidMove(x, y);
    const validAttack = isValidAttack(x, y);
    const isMyShip = ship && address && ship.player.toLowerCase() === address.toLowerCase();
    const isNPCShip = ship?.isNPC;
    const isSelected = selectedTile?.x === x && selectedTile?.y === y;
    const canSeeLoot = isAdjacentToPlayer(x, y) || (myShip?.x === x && myShip?.y === y);

    let tileClass = 'aspect-square border transition-all duration-200 relative flex items-center justify-center text-2xl overflow-hidden ';

    // Base styling - space theme
    if (!inZone) {
      tileClass += 'bg-gradient-to-br from-purple-900/60 to-red-900/40 border-purple-500/30 '; // Cosmic storm
    } else {
      tileClass += 'bg-gradient-to-br from-slate-900 to-gray-900 border-indigo-900/30 hover:border-cyan-500/50 ';
    }

    // Highlight valid moves/attacks
    if (validMove) {
      tileClass += 'bg-cyan-500/20 border-cyan-400/50 cursor-pointer hover:bg-cyan-500/30 ';
    } else if (validAttack) {
      tileClass += 'bg-red-500/20 border-red-500/50 cursor-pointer hover:bg-red-500/30 ';
    }

    // Selected tile
    if (isSelected) {
      tileClass += 'ring-2 ring-cyan-400 ';
    }

    // My ship highlight
    if (isMyShip && ship?.isAlive) {
      tileClass += 'ring-2 ring-yellow-400 ';
    }

    // NPC ship - red glow
    if (isNPCShip && ship?.isAlive) {
      tileClass += 'ring-1 ring-red-500/50 ';
    }

    return (
      <div
        key={`${x}-${y}`}
        className={tileClass}
        onClick={() => handleTileClick(x, y)}
      >
        {/* Stars background */}
        {!ship && !lootItem && inZone && (
          <span className="absolute text-white/20 text-xs">{getStarPattern(x, y)}</span>
        )}

        {/* Cosmic storm effect */}
        {!inZone && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-purple-400/40 text-lg animate-pulse">☄</span>
          </div>
        )}

        {/* Ship */}
        {ship && ship.isAlive && (
          <div className={`relative z-10 ${isMyShip ? 'animate-pulse' : ''} ${isNPCShip ? 'filter hue-rotate-180' : ''}`}>
            <span className={`text-3xl drop-shadow-lg ${isNPCShip ? 'filter brightness-75' : ''}`}>
              {SHIP_CLASS_INFO[ship.shipClass].emoji}
            </span>
            {/* NPC indicator */}
            {isNPCShip && (
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[8px] text-red-400 font-bold">
                ☠
              </span>
            )}
            {/* HP bar */}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full transition-all"
                style={{
                  width: `${(ship.currentHP / SHIP_CLASS_INFO[ship.shipClass].stats.maxHP) * 100}%`,
                  backgroundColor: isNPCShip ? '#ef4444' :
                    ship.currentHP < SHIP_CLASS_INFO[ship.shipClass].stats.maxHP * 0.3 ? '#ef4444' :
                    ship.currentHP < SHIP_CLASS_INFO[ship.shipClass].stats.maxHP * 0.6 ? '#eab308' : '#22c55e'
                }}
              />
            </div>
            {/* Acted indicator */}
            {ship.hasActed && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-gray-500 rounded-full border border-gray-400" title="Already acted" />
            )}
          </div>
        )}

        {/* Dead ship / Wreckage */}
        {ship && !ship.isAlive && (
          <span className="text-xl opacity-30">💀</span>
        )}

        {/* Loot - always visible */}
        {lootItem && !ship && (
          <span className="text-xl animate-pulse text-yellow-400">⚡</span>
        )}

        {/* Attack animation - laser beam effect */}
        {animation?.type === 'attack' && animation.toX === x && animation.toY === y && (
          <div className="absolute inset-0 z-20 flex items-center justify-center">
            <div className="absolute inset-0 bg-red-500/50 animate-ping rounded" />
            <span className="text-3xl animate-bounce">💥</span>
          </div>
        )}

        {/* Loot pickup animation */}
        {animation?.type === 'loot' && animation.toX === x && animation.toY === y && (
          <div className="absolute inset-0 z-20 flex items-center justify-center">
            <div className="absolute inset-0 bg-yellow-500/30 animate-pulse rounded" />
            <span className="text-2xl animate-bounce">⚡</span>
          </div>
        )}

        {/* Floating damage/heal text */}
        {floatingText && floatingText.x === x && floatingText.y === y && (
          <div className={`absolute -top-6 left-1/2 -translate-x-1/2 z-30 font-black text-lg ${floatingText.color} animate-bounce`}
               style={{ animation: 'floatUp 0.8s ease-out forwards' }}>
            {floatingText.text}
          </div>
        )}

        {/* Coordinate label */}
        <span className="absolute bottom-0 right-0.5 text-[8px] text-indigo-800/50">
          {String.fromCharCode(65 + x)}{y + 1}
        </span>
      </div>
    );
  };

  if (!game) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-spin">*</div>
          <p className="text-gray-400">Loading game...</p>
          {error && (
            <p className="text-red-400 mt-2">{error}</p>
          )}
        </div>
      </div>
    );
  }

  const isLobby = game.state === 0;
  const isActive = game.state === 1;
  const isFinished = game.state === 2;

  return (
    <div className="min-h-screen nebula-bg text-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-black gradient-text-ag">
              DARK ARENA
            </h1>
            <p className="text-gray-500">Game #{gameId}</p>
          </div>
          <div className="flex items-center gap-4">
            {/* Game State Badge */}
            <div className={`px-4 py-2 rounded-lg font-bold ${
              isLobby ? 'bg-yellow-500/20 text-yellow-400' :
              isActive ? 'bg-green-500/20 text-green-400' :
              'bg-gray-500/20 text-gray-400'
            }`}>
              {isLobby ? 'LOBBY' : isActive ? (myShip?.hasActed ? 'WAITING' : 'YOUR TURN') : 'FINISHED'}
            </div>
            {/* Turn Timer */}
            {isActive && (
              <div className={`text-center px-6 py-3 rounded-xl border ${turnTimer <= 5 ? 'bg-red-500/20 border-red-500 animate-pulse' : 'bg-gray-900 border-gray-700'}`}>
                <div className="text-3xl font-black">{turnTimer}s</div>
                <div className="text-xs text-gray-400">TURN {game.turn}</div>
              </div>
            )}
          </div>
        </div>

        {/* Lobby State */}
        {isLobby && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-8 mb-6 text-center">
            <h2 className="text-2xl font-bold text-yellow-400 mb-2">Waiting for Players</h2>
            <p className="text-gray-300 mb-4">
              {game.playerCount} / 16 players joined.
              {game.playerCount >= 1 && ' Game can be started!'}
            </p>
            {game.playerCount >= 1 && (
              <button
                onClick={async () => {
                  try {
                    const res = await fetch(`${API_URL}/game/${gameId}/start`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                    });
                    if (res.ok) {
                      const data = await res.json();
                      setGame(data.game);
                    }
                  } catch (e) {
                    console.error('Failed to start:', e);
                  }
                }}
                className="btn-ag-primary text-white font-bold py-3 px-8 rounded-xl text-xl hover:scale-105 transition-all"
              >
                START GAME
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - My Ship Stats */}
          <div className="lg:col-span-1 space-y-4">
            {/* My Ship Card */}
            {myShip && myShipInfo ? (
              <div className={`p-4 rounded-xl border ${myShipInfo.bgColor}`}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-4xl">{myShipInfo.emoji}</span>
                  <div>
                    <h3 className={`text-xl font-bold ${myShipInfo.color}`}>{myShipInfo.name}</h3>
                    <p className="text-gray-400 text-sm">Your Ship</p>
                  </div>
                </div>

                {/* HP Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">HP</span>
                    <span className="font-bold">{myShip.currentHP} / {myShipInfo.stats.maxHP}</span>
                  </div>
                  <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-300"
                      style={{
                        width: `${(myShip.currentHP / myShipInfo.stats.maxHP) * 100}%`,
                        backgroundColor: myShip.currentHP < myShipInfo.stats.maxHP * 0.3 ? '#ef4444' :
                                         myShip.currentHP < myShipInfo.stats.maxHP * 0.6 ? '#eab308' : '#22c55e'
                      }}
                    />
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div className="bg-gray-800/50 rounded-lg p-2">
                    <div className="text-gray-400">SPD</div>
                    <div className="font-bold">{myShipInfo.stats.speed}</div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-2">
                    <div className="text-gray-400">RNG</div>
                    <div className="font-bold">{myShipInfo.stats.range}</div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-2">
                    <div className="text-gray-400">DMG</div>
                    <div className="font-bold">{myShipInfo.stats.damage}</div>
                  </div>
                </div>

                {/* Kill Stats */}
                <div className="mt-4 flex justify-between text-sm">
                  <div>
                    <span className="text-gray-400">Kills: </span>
                    <span className="font-bold text-red-400">{myShip.kills}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Damage: </span>
                    <span className="font-bold text-orange-400">{myShip.damageDealt}</span>
                  </div>
                </div>

                {/* Action Status */}
                <div className={`mt-4 p-2 rounded-lg text-center text-sm font-bold ${
                  isProcessing ? 'bg-blue-500/20 text-blue-400 animate-pulse' :
                  myShip.hasActed ? 'bg-gray-700 text-gray-400' : 'bg-green-500/20 text-green-400'
                }`}>
                  {isProcessing ? 'PROCESSING...' :
                   myShip.hasActed ? 'ACTION COMPLETE' : 'READY TO ACT'}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-gray-700 bg-gray-900/50 text-center">
                <p className="text-gray-400">
                  {!address ? 'Connect wallet to see your ship' :
                   allShips.length === 0 ? 'No ships in game yet' :
                   'You are not in this game'}
                </p>
              </div>
            )}

            {/* Action Hint */}
            {isActive && myShip && !myShip.hasActed && !isProcessing && (
              <div className="p-3 rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-center">
                <p className="text-cyan-400 text-sm font-bold mb-1">Click to Act</p>
                <p className="text-gray-400 text-xs">
                  <span className="text-cyan-400">Empty tile</span> = Move (range {myShipInfo?.stats.speed}) |{' '}
                  <span className="text-red-400">Enemy</span> = Attack (range {myShipInfo?.stats.range})
                </p>
              </div>
            )}

            {/* Game Info */}
            <div className="p-4 rounded-xl border border-gray-700 bg-gray-900/50 space-y-3">
              <h4 className="font-bold text-gray-300">Game Info</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Players</span>
                  <span className="font-bold">{game.playersAlive} / {game.playerCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Safe Zone</span>
                  <span className="font-bold text-blue-400">{game.zoneSize}x{game.zoneSize}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Turn</span>
                  <span className="font-bold">{game.turn}</span>
                </div>
              </div>
            </div>

            {/* Action Log */}
            {game.actionLog && game.actionLog.length > 0 && (
              <div className="p-5 rounded-xl border border-indigo-500/30 bg-gradient-to-br from-gray-900/80 to-indigo-900/20">
                <h4 className="font-bold text-indigo-400 mb-3 text-lg">📜 Battle Log</h4>
                <div className="space-y-2 text-sm text-gray-300 max-h-64 overflow-y-auto">
                  {game.actionLog.slice().reverse().slice(0, 15).map((log, i) => (
                    <div key={i} className="border-b border-gray-700/50 pb-2 leading-relaxed break-all">{log}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Back to Lobby Button */}
            <a
              href="/"
              className="block w-full text-center gradient-border-ag hover:glow-blue text-white font-bold py-3 px-4 rounded-xl transition-all"
            >
              Back to Lobby
            </a>
          </div>

          {/* Center - Game Board */}
          <div className="lg:col-span-2">
            {/* Column Labels */}
            <div className="grid grid-cols-8 gap-1 mb-1 px-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="text-center text-xs text-gray-500 font-bold">
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
            </div>

            <div className="flex">
              {/* Row Labels */}
              <div className="flex flex-col justify-around pr-1">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="text-xs text-gray-500 font-bold h-full flex items-center">
                    {i + 1}
                  </div>
                ))}
              </div>

              {/* The Grid */}
              <div className="flex-1 grid grid-cols-8 gap-1 bg-gradient-to-br from-[#030404] via-[#1a0a30] to-[#030404] p-2 rounded-xl border border-[#3C00DC]/30 cosmic-pulse">
                {Array.from({ length: 64 }).map((_, i) => {
                  const x = i % 8;
                  const y = Math.floor(i / 8);
                  return renderTile(x, y);
                })}
              </div>
            </div>

            {/* Legend */}
            <div className="mt-6 p-4 bg-gray-900/50 rounded-xl border border-gray-700/50">
              <h4 className="text-center text-gray-400 font-bold mb-4 text-base">LEGEND</h4>
              <div className="flex flex-wrap justify-center gap-6 text-base text-gray-300">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-purple-900/60 to-red-900/40 border-2 border-purple-500/30 rounded" />
                  <span>Cosmic Storm (Danger)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-cyan-500/20 border-2 border-cyan-400/50 rounded" />
                  <span>Move Zone</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-red-500/20 border-2 border-red-500/50 rounded" />
                  <span>Attack Target</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl text-red-400">☠</span>
                  <span>Enemy Ship</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl text-yellow-400">⚡</span>
                  <span>Energy Pickup</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - All Ships (COMMENTED OUT)
          <div className="lg:col-span-1">
            <div className="p-4 rounded-xl border border-indigo-900/50 bg-slate-900/50">
              <h4 className="font-bold text-cyan-400 mb-4">Radar ({allShips.filter(s => s.isAlive).length} active)</h4>
              {allShips.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">No contacts</p>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {allShips
                    .sort((a, b) => {
                      // Sort: alive first, then player before NPC, then by HP
                      if (a.isAlive !== b.isAlive) return b.isAlive ? 1 : -1;
                      if (a.isNPC !== b.isNPC) return a.isNPC ? 1 : -1;
                      return b.currentHP - a.currentHP;
                    })
                    .map((ship, i) => {
                      const info = SHIP_CLASS_INFO[ship.shipClass];
                      const isMe = address && ship.player.toLowerCase() === address.toLowerCase();
                      const isNPC = ship.isNPC;
                      return (
                        <div
                          key={i}
                          className={`p-2 rounded-lg border ${
                            !ship.isAlive ? 'opacity-40 border-gray-700 bg-gray-900/30' :
                            isMe ? 'border-yellow-500/50 bg-yellow-500/10' :
                            isNPC ? 'border-red-500/30 bg-red-900/20' :
                            'border-cyan-500/30 bg-cyan-900/20'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`text-xl ${isNPC && ship.isAlive ? 'filter hue-rotate-180 brightness-75' : ''}`}>
                              {ship.isAlive ? info.emoji : '💀'}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1">
                                {isNPC ? (
                                  <>
                                    <span className="text-sm font-bold text-red-400">{ship.npcName}</span>
                                    <span className="text-[10px] text-red-500">☠</span>
                                  </>
                                ) : (
                                  <>
                                    <span className={`text-sm font-bold ${isMe ? 'text-yellow-400' : 'text-cyan-400'}`}>
                                      {info.name}
                                    </span>
                                    {isMe && <span className="text-xs text-yellow-400">(YOU)</span>}
                                  </>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 truncate">
                                {isNPC ? info.name : `${ship.player.slice(0, 6)}...${ship.player.slice(-4)}`}
                              </div>
                            </div>
                            <div className="text-right text-xs">
                              {ship.isAlive ? (
                                <>
                                  <div className={`font-bold ${isNPC ? 'text-red-400' : 'text-white'}`}>{ship.currentHP} HP</div>
                                  <div className="text-gray-500">{ship.kills} kills</div>
                                </>
                              ) : (
                                <span className="text-gray-600">DESTROYED</span>
                              )}
                            </div>
                          </div>
                          {ship.isAlive && (
                            <div className="mt-1 h-1 bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${isNPC ? 'bg-red-500' : 'bg-cyan-500'}`}
                                style={{ width: `${(ship.currentHP / info.stats.maxHP) * 100}%` }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            <div className="mt-4">
              <a
                href="/"
                className="block w-full text-center gradient-border-ag hover:glow-blue text-white font-bold py-3 px-4 rounded-xl transition-all"
              >
                Back to Lobby
              </a>
            </div>
          </div>
          */}
        </div>

        {/* Combat Modal */}
        {combatModal && (
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 cursor-pointer"
            onClick={() => setCombatModal(null)}
          >
            <div
              className="bg-gradient-to-br from-[#030404] to-[#1a0a30] border-2 border-[#FF5001]/50 rounded-3xl p-10 text-center max-w-2xl w-full mx-4 shadow-2xl shadow-[#FF5001]/30 cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-red-400 text-2xl font-bold mb-6">⚔️ COMBAT ⚔️</div>

              <div className="flex items-center justify-center gap-12 mb-8">
                {/* Attacker */}
                <div className="text-center">
                  <div className="text-8xl mb-2">{combatModal.attackerEmoji}</div>
                  <div className="text-yellow-400 font-bold text-2xl">{combatModal.attacker}</div>
                  <div className="text-gray-500 text-lg">{combatModal.attackerClass}</div>
                </div>

                {/* Arrow */}
                <div className="text-6xl text-red-400 animate-pulse">⚔️</div>

                {/* Target */}
                <div className="text-center">
                  <div className="text-8xl mb-2">{combatModal.targetEmoji}</div>
                  <div className="text-cyan-400 font-bold text-sm break-all max-w-[200px]">{combatModal.target}</div>
                  <div className="text-gray-500 text-lg">{combatModal.targetClass}</div>
                </div>
              </div>

              {/* Damage Breakdown */}
              <div className="bg-black/40 rounded-xl p-6 mb-6 text-left max-w-md mx-auto">
                <div className="text-lg text-gray-400 mb-4 text-center font-bold">DAMAGE CALCULATION</div>
                <div className="space-y-2 text-xl font-mono">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Base Attack:</span>
                    <span className="text-white">{combatModal.baseDamage}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Random Roll (-5 to +5):</span>
                    <span className={combatModal.randomRoll >= 0 ? 'text-green-400' : 'text-red-400'}>
                      {combatModal.randomRoll >= 0 ? '+' : ''}{combatModal.randomRoll}
                    </span>
                  </div>
                  <div className="border-t border-gray-600 pt-2 flex justify-between">
                    <span className="text-yellow-400 font-bold">Total Damage:</span>
                    <span className="text-red-400 font-bold text-2xl">-{combatModal.finalDamage}</span>
                  </div>
                </div>
              </div>

              {/* HP Bars - Side by Side */}
              <div className="grid grid-cols-2 gap-6 mb-6 max-w-lg mx-auto">
                {/* Target HP */}
                <div>
                  <div className="flex justify-between text-base text-gray-400 mb-2">
                    <span className="text-cyan-400 font-bold">Target</span>
                    <span className="font-mono">{combatModal.targetHP} / {combatModal.targetMaxHP}</span>
                  </div>
                  <div className="h-5 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-500"
                      style={{
                        width: `${Math.max(0, (combatModal.targetHP / combatModal.targetMaxHP) * 100)}%`,
                        backgroundColor: combatModal.targetHP <= 0 ? '#ef4444' :
                          combatModal.targetHP < combatModal.targetMaxHP * 0.3 ? '#ef4444' :
                          combatModal.targetHP < combatModal.targetMaxHP * 0.6 ? '#eab308' : '#22c55e'
                      }}
                    />
                  </div>
                  {combatModal.killed && (
                    <div className="text-red-500 font-bold text-sm mt-1 animate-pulse">DESTROYED</div>
                  )}
                </div>

                {/* Attacker HP (after counter) */}
                <div>
                  <div className="flex justify-between text-base text-gray-400 mb-2">
                    <span className="text-yellow-400 font-bold">You</span>
                    <span className="font-mono">{combatModal.attackerHP ?? '-'} / {combatModal.attackerMaxHP ?? '-'}</span>
                  </div>
                  <div className="h-5 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-500"
                      style={{
                        width: `${Math.max(0, ((combatModal.attackerHP ?? 0) / (combatModal.attackerMaxHP ?? 1)) * 100)}%`,
                        backgroundColor: (combatModal.attackerHP ?? 0) <= 0 ? '#ef4444' :
                          (combatModal.attackerHP ?? 0) < (combatModal.attackerMaxHP ?? 1) * 0.3 ? '#ef4444' :
                          (combatModal.attackerHP ?? 0) < (combatModal.attackerMaxHP ?? 1) * 0.6 ? '#eab308' : '#22c55e'
                      }}
                    />
                  </div>
                  {combatModal.attackerKilled && (
                    <div className="text-red-500 font-bold text-sm mt-1 animate-pulse">DESTROYED</div>
                  )}
                </div>
              </div>

              {/* Counter Damage Display */}
              {combatModal.counterDamage !== undefined && combatModal.counterDamage > 0 && (
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 mb-4 max-w-md mx-auto">
                  <div className="text-orange-400 font-bold text-lg mb-2">⚡ COUNTER ATTACK!</div>
                  <div className="text-white text-xl font-mono">
                    You received <span className="text-red-400 font-bold text-2xl">-{combatModal.counterDamage}</span> damage
                  </div>
                </div>
              )}

              {/* Kill notifications */}
              {(combatModal.killed || combatModal.attackerKilled) && (
                <div className="mt-4 space-y-2">
                  {combatModal.killed && (
                    <div className="text-3xl font-black text-green-500 animate-bounce">
                      🎯 ENEMY DESTROYED! 🎯
                    </div>
                  )}
                  {combatModal.attackerKilled && (
                    <div className="text-3xl font-black text-red-500 animate-bounce">
                      💀 YOU DIED! 💀
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Turn Summary Modal */}
        {turnSummary?.show && (
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 cursor-pointer"
            onClick={() => setTurnSummary(null)}
          >
            <div
              className="bg-gradient-to-br from-[#030404] to-[#1a0a30] border-2 border-cyan-500/50 rounded-3xl p-8 text-center max-w-lg w-full mx-4 shadow-2xl shadow-cyan-500/20 cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-cyan-400 text-2xl font-bold mb-6">📍 TURN {game?.turn} - MOVEMENTS 📍</div>

              <div className="space-y-4 max-h-80 overflow-y-auto">
                {turnSummary.movements.map((move, i) => (
                  <div key={i} className={`flex items-center gap-4 p-3 rounded-xl ${move.isNPC ? 'bg-red-500/10 border border-red-500/30' : 'bg-cyan-500/10 border border-cyan-500/30'}`}>
                    <span className="text-4xl">{move.emoji}</span>
                    <div className="flex-1 text-left">
                      <div className={`font-bold ${move.isNPC ? 'text-red-400' : 'text-cyan-400'} text-sm break-all`}>
                        {move.name}
                      </div>
                      <div className="text-gray-400 text-lg">
                        ({String.fromCharCode(65 + move.fromX)}{move.fromY + 1}) → ({String.fromCharCode(65 + move.toX)}{move.toY + 1})
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {turnSummary.movements.length === 0 && (
                <div className="text-gray-500 py-8">No movements this turn</div>
              )}
            </div>
          </div>
        )}

        {/* Game Over Overlay */}
        {isFinished && showGameOver && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 cursor-pointer"
            onClick={() => setShowGameOver(false)}
          >
            <div
              className="bg-gray-900 border border-purple-500/50 rounded-2xl p-8 text-center max-w-lg cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-4xl font-black mb-4 gradient-text-ag">
                GAME OVER
              </h2>
              <div className="space-y-4 mb-6">
                {game.winner !== '0x0000000000000000000000000000000000000000' && (
                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                    <div className="text-yellow-400 text-sm">1ST PLACE</div>
                    {game.winner.startsWith('0xNPC') ? (
                      <div className="text-xl font-bold text-red-400">
                        {allShips.find(s => s.player === game.winner)?.npcName || 'NPC Enemy'}
                      </div>
                    ) : (
                      <div className="text-lg font-bold text-white break-all font-mono">{game.winner}</div>
                    )}
                  </div>
                )}
                {game.secondPlace !== '0x0000000000000000000000000000000000000000' && (
                  <div className="p-3 bg-gray-500/10 border border-gray-500/30 rounded-xl">
                    <div className="text-gray-400 text-sm">2ND PLACE</div>
                    {game.secondPlace.startsWith('0xNPC') ? (
                      <div className="text-lg font-bold text-red-400">
                        {allShips.find(s => s.player === game.secondPlace)?.npcName || 'NPC Enemy'}
                      </div>
                    ) : (
                      <div className="text-sm font-bold text-white break-all font-mono">{game.secondPlace}</div>
                    )}
                  </div>
                )}
                {game.thirdPlace !== '0x0000000000000000000000000000000000000000' && (
                  <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-xl">
                    <div className="text-orange-400 text-sm">3RD PLACE</div>
                    {game.thirdPlace.startsWith('0xNPC') ? (
                      <div className="text-lg font-bold text-red-400">
                        {allShips.find(s => s.player === game.thirdPlace)?.npcName || 'NPC Enemy'}
                      </div>
                    ) : (
                      <div className="text-sm font-bold text-white break-all font-mono">{game.thirdPlace}</div>
                    )}
                  </div>
                )}
              </div>
              <a
                href="/"
                className="inline-block btn-ag-primary text-white font-bold py-3 px-8 rounded-xl hover:scale-105 transition-transform"
              >
                BACK TO LOBBY
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
