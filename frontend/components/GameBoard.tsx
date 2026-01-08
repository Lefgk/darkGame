'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Ship, GameData, GameState, ShipClass, SHIP_CLASS_INFO, Loot } from '@/lib/types';
import { GAME_CONFIG, ADDRESSES } from '@/lib/constants';
import { DARK_ARENA_ABI } from '@/lib/abis';

interface GameBoardProps {
  gameId: string;
}

export function GameBoard({ gameId }: GameBoardProps) {
  const { address } = useAccount();
  const [selectedTile, setSelectedTile] = useState<{ x: number; y: number } | null>(null);
  const [actionMode, setActionMode] = useState<'move' | 'attack' | null>(null);
  const [turnTimer, setTurnTimer] = useState<number>(GAME_CONFIG.TURN_DURATION);

  // Fetch game data from contract
  const { data: gameDataRaw, refetch: refetchGame } = useReadContract({
    address: ADDRESSES.DARK_ARENA as `0x${string}`,
    abi: DARK_ARENA_ABI,
    functionName: 'getGame',
    args: [BigInt(gameId)],
  });

  // Fetch ships from contract
  const { data: shipsRaw, refetch: refetchShips } = useReadContract({
    address: ADDRESSES.DARK_ARENA as `0x${string}`,
    abi: DARK_ARENA_ABI,
    functionName: 'getGameShips',
    args: [BigInt(gameId)],
  });

  // Fetch loot from contract
  const { data: lootRaw, refetch: refetchLoot } = useReadContract({
    address: ADDRESSES.DARK_ARENA as `0x${string}`,
    abi: DARK_ARENA_ABI,
    functionName: 'getGameLoot',
    args: [BigInt(gameId)],
  });

  // Write contract hook for actions
  const { writeContract, data: actionHash, isPending: isActionPending } = useWriteContract();
  const { isLoading: isActionConfirming, isSuccess: isActionSuccess } = useWaitForTransactionReceipt({ hash: actionHash });

  // Refetch data after action success
  useEffect(() => {
    if (isActionSuccess) {
      refetchGame();
      refetchShips();
      refetchLoot();
      setActionMode(null);
      setSelectedTile(null);
    }
  }, [isActionSuccess, refetchGame, refetchShips, refetchLoot]);

  // Parse game data
  const game: GameData = useMemo(() => {
    if (!gameDataRaw) {
      return {
        gameId: BigInt(gameId),
        state: GameState.Lobby,
        turn: 0,
        zoneSize: 8,
        prizePool: BigInt(0),
        startTime: BigInt(0),
        playerCount: 0,
        playersAlive: 0,
        winner: '0x0000000000000000000000000000000000000000',
        secondPlace: '0x0000000000000000000000000000000000000000',
        thirdPlace: '0x0000000000000000000000000000000000000000',
      };
    }
    const d = gameDataRaw as {
      gameId: bigint;
      state: number;
      turn: number;
      zoneSize: number;
      prizePool: bigint;
      startTime: bigint;
      playerCount: number;
      playersAlive: number;
      winner: string;
      secondPlace: string;
      thirdPlace: string;
    };
    return {
      gameId: d.gameId,
      state: d.state as GameState,
      turn: d.turn,
      zoneSize: d.zoneSize,
      prizePool: d.prizePool,
      startTime: d.startTime,
      playerCount: d.playerCount,
      playersAlive: d.playersAlive,
      winner: d.winner,
      secondPlace: d.secondPlace,
      thirdPlace: d.thirdPlace,
    };
  }, [gameDataRaw, gameId]);

  // Parse ships
  const allShips: Ship[] = useMemo(() => {
    if (!shipsRaw) return [];
    return (shipsRaw as unknown[]).map((s: unknown) => {
      const ship = s as {
        player: string;
        shipClass: number;
        currentHP: number;
        x: number;
        y: number;
        isAlive: boolean;
        kills: number;
        damageDealt: number;
        hasActed: boolean;
      };
      return {
        player: ship.player,
        shipClass: ship.shipClass as ShipClass,
        currentHP: ship.currentHP,
        x: ship.x,
        y: ship.y,
        isAlive: ship.isAlive,
        kills: ship.kills,
        damageDealt: ship.damageDealt,
        hasActed: ship.hasActed,
      };
    });
  }, [shipsRaw]);

  // Parse loot
  const allLoot: Loot[] = useMemo(() => {
    if (!lootRaw) return [];
    return (lootRaw as unknown[]).map((l: unknown) => {
      const loot = l as { x: number; y: number; amount: number; collected: boolean };
      return {
        x: loot.x,
        y: loot.y,
        amount: loot.amount,
        collected: loot.collected,
      };
    });
  }, [lootRaw]);

  // Find current player's ship
  const myShip = useMemo(() => {
    if (!address) return null;
    return allShips.find(s => s.player.toLowerCase() === address.toLowerCase() && s.isAlive);
  }, [allShips, address]);

  const myShipInfo = myShip ? SHIP_CLASS_INFO[myShip.shipClass] : null;

  // Calculate zone boundaries
  const zoneMin = Math.floor((GAME_CONFIG.BOARD_SIZE - game.zoneSize) / 2);
  const zoneMax = zoneMin + game.zoneSize - 1;

  // Check if tile is in safe zone
  const isInZone = (x: number, y: number) => {
    return x >= zoneMin && x <= zoneMax && y >= zoneMin && y <= zoneMax;
  };

  // Check if tile is valid move for current player
  const isValidMove = (x: number, y: number) => {
    if (!myShip || !actionMode || actionMode !== 'move') return false;
    const distance = Math.max(Math.abs(x - myShip.x), Math.abs(y - myShip.y));
    const stats = SHIP_CLASS_INFO[myShip.shipClass].stats;
    return distance > 0 && distance <= stats.speed && !allShips.some(s => s.x === x && s.y === y && s.isAlive);
  };

  // Check if tile is valid attack target
  const isValidAttack = (x: number, y: number) => {
    if (!myShip || !actionMode || actionMode !== 'attack') return false;
    const distance = Math.max(Math.abs(x - myShip.x), Math.abs(y - myShip.y));
    const stats = SHIP_CLASS_INFO[myShip.shipClass].stats;
    const targetShip = allShips.find(s => s.x === x && s.y === y && s.isAlive && s.player !== myShip.player);
    return distance <= stats.range && targetShip !== undefined;
  };

  // Get ship at position
  const getShipAt = (x: number, y: number) => {
    return allShips.find(s => s.x === x && s.y === y);
  };

  // Get loot at position
  const getLootAt = (x: number, y: number) => {
    return allLoot.find(l => l.x === x && l.y === y && !l.collected);
  };

  // Auto-refresh game state
  useEffect(() => {
    if (game.state !== GameState.Active) return;

    const interval = setInterval(() => {
      refetchGame();
      refetchShips();
      refetchLoot();
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [game.state, refetchGame, refetchShips, refetchLoot]);

  // Turn timer countdown
  useEffect(() => {
    if (game.state !== GameState.Active) return;

    const interval = setInterval(() => {
      setTurnTimer(prev => {
        if (prev <= 1) {
          return GAME_CONFIG.TURN_DURATION;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [game.state]);

  // Handle tile click
  const handleTileClick = (x: number, y: number) => {
    if (!myShip || myShip.hasActed || isActionPending || isActionConfirming) return;

    if (actionMode === 'move' && isValidMove(x, y)) {
      // Call contract performAction(gameId, x, y, false)
      writeContract({
        address: ADDRESSES.DARK_ARENA as `0x${string}`,
        abi: DARK_ARENA_ABI,
        functionName: 'performAction',
        args: [BigInt(gameId), x, y, false],
      });
    } else if (actionMode === 'attack' && isValidAttack(x, y)) {
      // Call contract performAction(gameId, x, y, true)
      writeContract({
        address: ADDRESSES.DARK_ARENA as `0x${string}`,
        abi: DARK_ARENA_ABI,
        functionName: 'performAction',
        args: [BigInt(gameId), x, y, true],
      });
    } else {
      setSelectedTile({ x, y });
    }
  };

  // Render a single tile
  const renderTile = (x: number, y: number) => {
    const ship = getShipAt(x, y);
    const lootItem = getLootAt(x, y);
    const inZone = isInZone(x, y);
    const validMove = isValidMove(x, y);
    const validAttack = isValidAttack(x, y);
    const isMyShip = ship && address && ship.player.toLowerCase() === address.toLowerCase();
    const isSelected = selectedTile?.x === x && selectedTile?.y === y;

    let tileClass = 'aspect-square border transition-all duration-200 relative flex items-center justify-center text-2xl ';

    // Base styling
    if (!inZone) {
      tileClass += 'bg-red-900/40 border-red-500/30 '; // Storm zone
    } else {
      tileClass += 'bg-gray-900/50 border-gray-700/50 hover:border-purple-500/50 ';
    }

    // Highlight valid moves/attacks
    if (validMove) {
      tileClass += 'bg-green-500/20 border-green-500/50 cursor-pointer hover:bg-green-500/30 ';
    } else if (validAttack) {
      tileClass += 'bg-red-500/20 border-red-500/50 cursor-pointer hover:bg-red-500/30 ';
    }

    // Selected tile
    if (isSelected) {
      tileClass += 'ring-2 ring-purple-500 ';
    }

    // My ship highlight
    if (isMyShip && ship?.isAlive) {
      tileClass += 'ring-2 ring-yellow-400 ';
    }

    return (
      <div
        key={`${x}-${y}`}
        className={tileClass}
        onClick={() => handleTileClick(x, y)}
      >
        {/* Storm indicator */}
        {!inZone && (
          <div className="absolute inset-0 flex items-center justify-center opacity-30">
            <span className="text-red-500 text-xs">☠️</span>
          </div>
        )}

        {/* Ship */}
        {ship && ship.isAlive && (
          <div className={`relative z-10 ${isMyShip ? 'animate-pulse' : ''}`}>
            <span className="text-3xl drop-shadow-lg">
              {SHIP_CLASS_INFO[ship.shipClass].emoji}
            </span>
            {/* HP bar */}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all"
                style={{
                  width: `${(ship.currentHP / SHIP_CLASS_INFO[ship.shipClass].stats.maxHP) * 100}%`,
                  backgroundColor: ship.currentHP < SHIP_CLASS_INFO[ship.shipClass].stats.maxHP * 0.3 ? '#ef4444' :
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
          <span className="text-xl opacity-50">💀</span>
        )}

        {/* Loot */}
        {lootItem && !ship && (
          <span className="text-xl animate-bounce">💰</span>
        )}

        {/* Coordinate label */}
        <span className="absolute bottom-0 right-0.5 text-[8px] text-gray-600">
          {String.fromCharCode(65 + x)}{y + 1}
        </span>
      </div>
    );
  };

  const isProcessing = isActionPending || isActionConfirming;

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              DARK ARENA
            </h1>
            <p className="text-gray-500">Game #{gameId}</p>
          </div>
          <div className="flex items-center gap-4">
            {/* Game State Badge */}
            <div className={`px-4 py-2 rounded-lg font-bold ${
              game.state === GameState.Lobby ? 'bg-yellow-500/20 text-yellow-400' :
              game.state === GameState.Active ? 'bg-green-500/20 text-green-400' :
              'bg-gray-500/20 text-gray-400'
            }`}>
              {game.state === GameState.Lobby ? '⏳ LOBBY' :
               game.state === GameState.Active ? '⚔️ ACTIVE' : '🏁 FINISHED'}
            </div>
            {/* Turn Timer */}
            {game.state === GameState.Active && (
              <div className={`text-center px-6 py-3 rounded-xl border ${turnTimer <= 3 ? 'bg-red-500/20 border-red-500 animate-pulse' : 'bg-gray-900 border-gray-700'}`}>
                <div className="text-3xl font-black">{turnTimer}s</div>
                <div className="text-xs text-gray-400">TURN {game.turn}</div>
              </div>
            )}
          </div>
        </div>

        {/* Lobby State */}
        {game.state === GameState.Lobby && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-8 mb-6 text-center">
            <h2 className="text-2xl font-bold text-yellow-400 mb-2">Waiting for Players</h2>
            <p className="text-gray-300">
              {game.playerCount} / 16 players joined.
              {game.playerCount >= 1 && ' Game can be started!'}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
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
                  {isProcessing ? '⏳ PROCESSING...' :
                   myShip.hasActed ? '✓ ACTION COMPLETE' : '⚡ READY TO ACT'}
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

            {/* Action Buttons */}
            {game.state === GameState.Active && myShip && !myShip.hasActed && !isProcessing && (
              <div className="space-y-2">
                <button
                  onClick={() => setActionMode(actionMode === 'move' ? null : 'move')}
                  className={`w-full py-3 px-4 rounded-xl font-bold transition-all ${
                    actionMode === 'move'
                      ? 'bg-green-500 text-black'
                      : 'bg-green-500/20 text-green-400 border border-green-500/50 hover:bg-green-500/30'
                  }`}
                >
                  🚀 MOVE (Speed: {myShipInfo?.stats.speed})
                </button>
                <button
                  onClick={() => setActionMode(actionMode === 'attack' ? null : 'attack')}
                  className={`w-full py-3 px-4 rounded-xl font-bold transition-all ${
                    actionMode === 'attack'
                      ? 'bg-red-500 text-black'
                      : 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30'
                  }`}
                >
                  ⚔️ ATTACK (Range: {myShipInfo?.stats.range})
                </button>
              </div>
            )}

            {/* Game Info */}
            <div className="p-4 rounded-xl border border-gray-700 bg-gray-900/50 space-y-3">
              <h4 className="font-bold text-gray-300">Game Info</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Prize Pool</span>
                  <span className="font-bold text-green-400">{Number(game.prizePool / BigInt(10**18))} PLS</span>
                </div>
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
              <div className="flex-1 grid grid-cols-8 gap-1 bg-gray-800/30 p-2 rounded-xl border border-gray-700">
                {Array.from({ length: 64 }).map((_, i) => {
                  const x = i % 8;
                  const y = Math.floor(i / 8);
                  return renderTile(x, y);
                })}
              </div>
            </div>

            {/* Legend */}
            <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs text-gray-400">
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-red-900/40 border border-red-500/30 rounded" />
                <span>Storm Zone</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-green-500/20 border border-green-500/50 rounded" />
                <span>Valid Move</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-red-500/20 border border-red-500/50 rounded" />
                <span>Valid Attack</span>
              </div>
              <div className="flex items-center gap-1">
                <span>💰</span>
                <span>Loot</span>
              </div>
            </div>
          </div>

          {/* Right Panel - All Ships */}
          <div className="lg:col-span-1">
            <div className="p-4 rounded-xl border border-gray-700 bg-gray-900/50">
              <h4 className="font-bold text-gray-300 mb-4">All Ships ({allShips.length})</h4>
              {allShips.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">No ships yet</p>
              ) : (
                <div className="space-y-2">
                  {allShips
                    .sort((a, b) => (b.isAlive ? 1 : 0) - (a.isAlive ? 1 : 0))
                    .map((ship, i) => {
                      const info = SHIP_CLASS_INFO[ship.shipClass];
                      const isMe = address && ship.player.toLowerCase() === address.toLowerCase();
                      return (
                        <div
                          key={i}
                          className={`p-2 rounded-lg border ${
                            !ship.isAlive ? 'opacity-50 border-gray-700 bg-gray-800/30' :
                            isMe ? 'border-yellow-500/50 bg-yellow-500/10' :
                            'border-gray-700 bg-gray-800/30'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{ship.isAlive ? info.emoji : '💀'}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1">
                                <span className={`text-sm font-bold ${info.color}`}>{info.name}</span>
                                {isMe && <span className="text-xs text-yellow-400">(YOU)</span>}
                              </div>
                              <div className="text-xs text-gray-500 truncate">
                                {ship.player.slice(0, 6)}...{ship.player.slice(-4)}
                              </div>
                            </div>
                            <div className="text-right text-xs">
                              {ship.isAlive ? (
                                <>
                                  <div className="font-bold">{ship.currentHP} HP</div>
                                  <div className="text-gray-500">{ship.kills} kills</div>
                                </>
                              ) : (
                                <span className="text-red-400">DEAD</span>
                              )}
                            </div>
                          </div>
                          {/* Mini HP bar */}
                          {ship.isAlive && (
                            <div className="mt-1 h-1 bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-500"
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

            {/* Back to Lobby Button */}
            <div className="mt-4">
              <a
                href="/"
                className="block w-full text-center bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-xl transition-all"
              >
                ← Back to Lobby
              </a>
            </div>
          </div>
        </div>

        {/* Game Over Overlay */}
        {game.state === GameState.Finished && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-900 border border-purple-500/50 rounded-2xl p-8 text-center max-w-md">
              <h2 className="text-4xl font-black mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                GAME OVER
              </h2>
              <div className="space-y-4 mb-6">
                {game.winner !== '0x0000000000000000000000000000000000000000' && (
                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                    <div className="text-yellow-400 text-sm">1ST PLACE</div>
                    <div className="text-xl font-bold truncate">{game.winner.slice(0, 10)}...</div>
                    <div className="text-green-400 font-bold">+{Number(game.prizePool * BigInt(54) / BigInt(100) / BigInt(10**18))} PLS</div>
                  </div>
                )}
                {game.secondPlace !== '0x0000000000000000000000000000000000000000' && (
                  <div className="p-3 bg-gray-500/10 border border-gray-500/30 rounded-xl">
                    <div className="text-gray-400 text-sm">2ND PLACE</div>
                    <div className="text-lg font-bold truncate">{game.secondPlace.slice(0, 10)}...</div>
                  </div>
                )}
                {game.thirdPlace !== '0x0000000000000000000000000000000000000000' && (
                  <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-xl">
                    <div className="text-orange-400 text-sm">3RD PLACE</div>
                    <div className="text-lg font-bold truncate">{game.thirdPlace.slice(0, 10)}...</div>
                  </div>
                )}
              </div>
              <a
                href="/"
                className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 px-8 rounded-xl hover:scale-105 transition-transform"
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
