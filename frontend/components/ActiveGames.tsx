'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { NFTShipSelector } from './NFTShipSelector';
import { API_URL } from '@/lib/constants';

interface GameData {
    gameId: number;
    state: number;
    turn: number;
    zoneSize: number;
    prizePool: string;
    startTime: number;
    playerCount: number;
    playersAlive: number;
    winner: string;
    secondPlace: string;
    thirdPlace: string;
}

const GAME_STATES = ['Lobby', 'Active', 'Finished'];

export function ActiveGames() {
    const router = useRouter();
    const { address, isConnected } = useAccount();
    const [selectedTokenId, setSelectedTokenId] = useState<number | null>(null);
    const [selectedJourneyId, setSelectedJourneyId] = useState<number | null>(null);
    const [games, setGames] = useState<GameData[]>([]);
    const [totalGames, setTotalGames] = useState(0);
    const [mounted, setMounted] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [npcCount, setNpcCount] = useState<number>(5);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Fetch games from API
    const fetchGames = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/games`);
            if (!res.ok) throw new Error('Failed to fetch games');
            const data = await res.json();
            setGames(data.games || []);
            setTotalGames(data.total || 0);
            setError(null);
        } catch (e) {
            console.error('Error fetching games:', e);
            setError('Failed to connect to game server');
        }
    }, []);

    // Poll for games
    useEffect(() => {
        if (!mounted) return;
        fetchGames();
        const interval = setInterval(fetchGames, 3000);
        return () => clearInterval(interval);
    }, [mounted, fetchGames]);

    const handleSelectNFT = (tokenId: number, journeyId: number) => {
        setSelectedTokenId(tokenId);
        setSelectedJourneyId(journeyId);
    };

    const handleCreateGame = async () => {
        if (!isConnected || !address) {
            alert('Please connect your wallet first!');
            return;
        }

        setIsProcessing(true);
        try {
            const res = await fetch(`${API_URL}/game/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ npcCount }),
            });

            if (!res.ok) throw new Error('Failed to create game');
            const data = await res.json();

            if (data.success) {
                // Auto-join the game we just created
                await handleJoinGame(data.gameId);
            }
        } catch (e) {
            console.error('Failed to create game:', e);
            alert('Failed to create game. Is the server running?');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleJoinGame = async (gameId: number) => {
        if (!isConnected || !address) {
            alert('Please connect your wallet first!');
            return;
        }

        const tokenId = selectedTokenId || 1;
        const journeyId = selectedJourneyId || 1;

        setIsProcessing(true);
        try {
            const res = await fetch(`${API_URL}/game/${gameId}/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    player: address,
                    tokenId,
                    journeyId,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                alert(data.error || 'Failed to join game');
                return;
            }

            if (data.success) {
                fetchGames();
                router.push(`/game/${gameId}`);
            }
        } catch (e) {
            console.error('Failed to join game:', e);
            alert('Failed to join game');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleStartGame = async (gameId: number) => {
        if (!isConnected) {
            alert('Please connect your wallet first!');
            return;
        }

        setIsProcessing(true);
        try {
            const res = await fetch(`${API_URL}/game/${gameId}/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });

            const data = await res.json();
            if (!res.ok) {
                alert(data.error || 'Failed to start game');
                return;
            }

            if (data.success) {
                fetchGames();
                router.push(`/game/${gameId}`);
            }
        } catch (e) {
            console.error('Failed to start game:', e);
            alert('Failed to start game');
        } finally {
            setIsProcessing(false);
        }
    };

    if (!mounted) {
        return <div className="text-center py-12 text-gray-400">Loading...</div>;
    }

    return (
        <div className="space-y-8">
            {/* NFT Ship Selector */}
            <NFTShipSelector onSelectNFT={handleSelectNFT} />

            {/* Server Status */}
            {error && (
                <div className="bg-red-500/20 rounded-lg p-4 border border-red-500/50 text-center">
                    <p className="text-red-400">{error}</p>
                    <p className="text-sm text-gray-400 mt-1">Make sure the backend is running: cd backend && npm run dev</p>
                </div>
            )}

            {/* Create New Game */}
            <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 rounded-xl p-8 backdrop-blur-sm border-2 border-cyan-500/50">
                <div className="text-center">
                    <h3 className="text-3xl font-bold mb-4 text-cyan-400">Enter the Dark Arena</h3>
                    <p className="text-gray-300 mb-6">
                        Battle against AI enemies in deep space. <span className="font-bold text-green-400">Instant combat!</span>
                    </p>

                    {/* NPC Count Slider */}
                    <div className="mb-6 max-w-xs mx-auto">
                        <label className="block text-sm text-gray-400 mb-2">
                            Enemy Ships: <span className="text-red-400 font-bold">{npcCount}</span>
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="10"
                            value={npcCount}
                            onChange={(e) => setNpcCount(Number(e.target.value))}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-500"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>0 (Solo)</span>
                            <span>5</span>
                            <span>10 (Hard)</span>
                        </div>
                    </div>

                    <button
                        onClick={handleCreateGame}
                        disabled={!isConnected || isProcessing}
                        className={`text-white font-bold py-4 px-8 rounded-lg text-xl shadow-lg transition-all ${
                            isConnected && !isProcessing
                                ? 'bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 shadow-cyan-500/50 hover:scale-105 cursor-pointer'
                                : 'bg-gray-600 cursor-not-allowed opacity-50'
                        }`}
                    >
                        {isProcessing ? 'Launching...' : `Launch Arena (${npcCount} enemies)`}
                    </button>
                    {!isConnected && (
                        <p className="text-yellow-400 text-sm mt-2">Connect wallet to enter the arena</p>
                    )}
                </div>
            </div>

            {/* Game Counter Display */}
            <div className="bg-gray-800/50 rounded-xl p-8 backdrop-blur-sm border border-purple-500/20">
                <h3 className="text-2xl font-bold mb-6 text-purple-400">
                    Games Created: {totalGames}
                </h3>

                {games.length > 0 ? (
                    <div className="space-y-4">
                        {games.slice().reverse().slice(0, 10).map((game) => (
                            <GameCard
                                key={game.gameId}
                                game={game}
                                onJoin={handleJoinGame}
                                onStart={handleStartGame}
                                onWatch={(id) => router.push(`/game/${id}`)}
                                isProcessing={isProcessing}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-400">
                        <p className="text-xl mb-2">No games yet</p>
                        <p className="text-sm">Be the first to create one!</p>
                    </div>
                )}
            </div>

            {/* Instructions */}
            <div className="bg-blue-900/20 rounded-lg p-6 border border-blue-500/30">
                <h4 className="text-lg font-bold text-blue-400 mb-2">How to Play</h4>
                <ol className="text-gray-300 text-sm space-y-1 list-decimal list-inside">
                    <li>Connect your wallet</li>
                    <li>Create a new game</li>
                    <li>Click Start Game to begin</li>
                    <li>Move and attack on the 8x8 grid!</li>
                    <li>Last ship standing wins!</li>
                </ol>
            </div>
        </div>
    );
}

// Game Card Component
function GameCard({
    game,
    onJoin,
    onStart,
    onWatch,
    isProcessing,
}: {
    game: GameData;
    onJoin: (id: number) => void;
    onStart: (id: number) => void;
    onWatch: (id: number) => void;
    isProcessing: boolean;
}) {
    const isLobby = game.state === 0;
    const isActive = game.state === 1;
    const isFinished = game.state === 2;

    return (
        <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-700 hover:border-purple-500/50 transition-all">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                        <span className="text-2xl font-bold text-white">Game #{game.gameId}</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            isLobby ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50' :
                            isActive ? 'bg-green-500/20 text-green-400 border border-green-500/50' :
                            'bg-gray-500/20 text-gray-400 border border-gray-500/50'
                        }`}>
                            {isLobby ? 'Lobby' : isActive ? 'Active' : 'Finished'}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <div className="text-gray-400">Players</div>
                            <div className="text-white font-semibold text-lg">{game.playerCount}/16</div>
                        </div>
                        {isActive && (
                            <>
                                <div>
                                    <div className="text-gray-400">Turn</div>
                                    <div className="text-white font-semibold text-lg">{game.turn}</div>
                                </div>
                                <div>
                                    <div className="text-gray-400">Alive</div>
                                    <div className="text-green-400 font-semibold text-lg">{game.playersAlive}</div>
                                </div>
                                <div>
                                    <div className="text-gray-400">Zone</div>
                                    <div className="text-orange-400 font-semibold text-lg">{game.zoneSize}x{game.zoneSize}</div>
                                </div>
                            </>
                        )}
                        {isFinished && game.winner !== '0x0000000000000000000000000000000000000000' && (
                            <div>
                                <div className="text-gray-400">Winner</div>
                                <div className="text-yellow-400 font-mono text-xs">
                                    {game.winner.slice(0, 6)}...{game.winner.slice(-4)}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex gap-2">
                    {isLobby && (
                        <>
                            <button
                                onClick={() => onJoin(game.gameId)}
                                disabled={isProcessing}
                                className={`font-bold py-3 px-6 rounded-lg transition-all ${
                                    !isProcessing
                                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg shadow-green-500/30 hover:scale-105'
                                        : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
                                }`}
                            >
                                Join
                            </button>
                            {game.playerCount >= 1 && (
                                <button
                                    onClick={() => onStart(game.gameId)}
                                    disabled={isProcessing}
                                    className={`font-bold py-3 px-6 rounded-lg transition-all ${
                                        !isProcessing
                                            ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg shadow-orange-500/30 hover:scale-105'
                                            : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
                                    }`}
                                >
                                    Start
                                </button>
                            )}
                        </>
                    )}
                    {(isActive || isFinished) && (
                        <button
                            onClick={() => onWatch(game.gameId)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-all"
                        >
                            View
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
