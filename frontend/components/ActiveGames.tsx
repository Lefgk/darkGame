'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatEther } from 'viem';
import { NFTShipSelector } from './NFTShipSelector';
import { ADDRESSES } from '@/lib/constants';
import { DARK_ARENA_ABI } from '@/lib/abis';

interface GameData {
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
}

const GAME_STATES = ['Lobby', 'Active', 'Finished'];

export function ActiveGames() {
    const router = useRouter();
    const { address, isConnected } = useAccount();
    const [selectedTokenId, setSelectedTokenId] = useState<number | null>(null);
    const [selectedJourneyId, setSelectedJourneyId] = useState<number | null>(null);
    const [activeGames, setActiveGames] = useState<GameData[]>([]);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Get total game count
    const { data: gameCounter, refetch: refetchCounter } = useReadContract({
        address: ADDRESSES.DARK_ARENA as `0x${string}`,
        abi: DARK_ARENA_ABI,
        functionName: 'gameCounter',
        query: { enabled: mounted },
    });

    // Write contract hooks
    const { writeContract: createGameWrite, data: createGameHash, isPending: isCreating } = useWriteContract();
    const { writeContract: joinGameWrite, data: joinGameHash, isPending: isJoining } = useWriteContract();
    const { writeContract: startGameWrite, data: startGameHash, isPending: isStarting } = useWriteContract();

    // Wait for transaction receipts
    const { isLoading: isCreateConfirming, isSuccess: isCreateSuccess, data: createReceipt } = useWaitForTransactionReceipt({ hash: createGameHash });
    const { isLoading: isJoinConfirming, isSuccess: isJoinSuccess } = useWaitForTransactionReceipt({ hash: joinGameHash });
    const { isLoading: isStartConfirming, isSuccess: isStartSuccess } = useWaitForTransactionReceipt({ hash: startGameHash });

    // Fetch all games when counter changes
    useEffect(() => {
        if (!mounted || !gameCounter) return;

        const fetchGames = async () => {
            const count = Number(gameCounter);
            const games: GameData[] = [];

            for (let i = 1; i <= count; i++) {
                try {
                    const res = await fetch('https://rpc.pulsechain.com', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            jsonrpc: '2.0',
                            id: i,
                            method: 'eth_call',
                            params: [{
                                to: ADDRESSES.DARK_ARENA,
                                data: `0x게e12c02${i.toString(16).padStart(64, '0')}` // getGame(uint256)
                            }, 'latest']
                        })
                    });
                    // Simplified - just use the API response
                } catch (e) {
                    console.error('Error fetching game', i, e);
                }
            }

            // For now, fetch via direct RPC since we need tuple decoding
            // Let's use a simpler approach - just show games from events
        };

        fetchGames();
    }, [gameCounter, mounted]);

    // Navigate to game after successful create
    useEffect(() => {
        if (isCreateSuccess && createReceipt) {
            // Parse GameCreated event to get gameId
            const gameCreatedLog = createReceipt.logs.find(log =>
                log.topics[0] === '0x8c25e214c5693ebaf8008875bacedeb9e0aafd393864a0de36f0f4e5bece5484' // GameCreated topic
            );
            if (gameCreatedLog && gameCreatedLog.topics[1]) {
                const gameId = parseInt(gameCreatedLog.topics[1], 16);
                router.push(`/game/${gameId}`);
            }
            refetchCounter();
        }
    }, [isCreateSuccess, createReceipt, router, refetchCounter]);

    // Refetch after join/start success
    useEffect(() => {
        if (isJoinSuccess || isStartSuccess) {
            refetchCounter();
        }
    }, [isJoinSuccess, isStartSuccess, refetchCounter]);

    const handleSelectNFT = (tokenId: number, journeyId: number) => {
        setSelectedTokenId(tokenId);
        setSelectedJourneyId(journeyId);
    };

    const handleCreateGame = async () => {
        if (!isConnected) {
            alert('Please connect your wallet first!');
            return;
        }

        try {
            createGameWrite({
                address: ADDRESSES.DARK_ARENA as `0x${string}`,
                abi: DARK_ARENA_ABI,
                functionName: 'createGame',
            });
        } catch (error) {
            console.error('Failed to create game:', error);
        }
    };

    const handleJoinGame = async (gameId: number) => {
        if (!isConnected) {
            alert('Please connect your wallet first!');
            return;
        }

        const tokenId = selectedTokenId || 1;
        const journeyId = selectedJourneyId || 1;

        try {
            joinGameWrite({
                address: ADDRESSES.DARK_ARENA as `0x${string}`,
                abi: DARK_ARENA_ABI,
                functionName: 'joinGame',
                args: [BigInt(gameId), BigInt(tokenId), BigInt(journeyId)],
                value: BigInt(0), // Free for testing
            });
        } catch (error) {
            console.error('Failed to join game:', error);
        }
    };

    const handleStartGame = async (gameId: number) => {
        if (!isConnected) {
            alert('Please connect your wallet first!');
            return;
        }

        try {
            startGameWrite({
                address: ADDRESSES.DARK_ARENA as `0x${string}`,
                abi: DARK_ARENA_ABI,
                functionName: 'startGame',
                args: [BigInt(gameId)],
            });
        } catch (error) {
            console.error('Failed to start game:', error);
        }
    };

    const isProcessing = isCreating || isCreateConfirming || isJoining || isJoinConfirming || isStarting || isStartConfirming;

    return (
        <div className="space-y-8">
            {/* NFT Ship Selector */}
            <NFTShipSelector onSelectNFT={handleSelectNFT} />

            {/* Create New Game */}
            <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-xl p-8 backdrop-blur-sm border-2 border-purple-500">
                <div className="text-center">
                    <h3 className="text-3xl font-bold mb-4 text-white">Start a New Arena</h3>
                    <p className="text-gray-300 mb-6">
                        Create a new battle arena. Entry fee: <span className="font-bold text-green-400">FREE (Testing Mode)</span>
                        <br />
                        <span className="text-yellow-400">Game can start with just 1 player for testing!</span>
                    </p>
                    <button
                        onClick={handleCreateGame}
                        disabled={!isConnected || isProcessing}
                        className={`text-white font-bold py-4 px-8 rounded-lg text-xl shadow-lg transition-all ${
                            isConnected && !isProcessing
                                ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-purple-500/50 hover:scale-105 cursor-pointer'
                                : 'bg-gray-600 cursor-not-allowed opacity-50'
                        }`}
                    >
                        {isCreating || isCreateConfirming ? '⏳ Creating...' : '🎮 Create Game'}
                    </button>
                    {!isConnected && (
                        <p className="text-yellow-400 text-sm mt-2">Connect wallet to create a game</p>
                    )}
                </div>
            </div>

            {/* Game Counter Display */}
            <div className="bg-gray-800/50 rounded-xl p-8 backdrop-blur-sm border border-purple-500/20">
                <h3 className="text-2xl font-bold mb-6 text-purple-400">
                    Games Created: {gameCounter !== undefined ? Number(gameCounter) : '--'}
                </h3>

                {gameCounter !== undefined && Number(gameCounter) > 0 ? (
                    <div className="space-y-4">
                        {Array.from({ length: Math.min(Number(gameCounter), 10) }, (_, i) => Number(gameCounter) - i).map((gameId) => (
                            <GameCard
                                key={gameId}
                                gameId={gameId}
                                onJoin={handleJoinGame}
                                onStart={handleStartGame}
                                onWatch={(id) => router.push(`/game/${id}`)}
                                isProcessing={isProcessing}
                                selectedTokenId={selectedTokenId}
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
                <h4 className="text-lg font-bold text-blue-400 mb-2">💡 How to Play (Testing Mode)</h4>
                <ol className="text-gray-300 text-sm space-y-1 list-decimal list-inside">
                    <li>Connect your wallet</li>
                    <li>Create a new game (no NFT required for testing)</li>
                    <li>Join the game you created</li>
                    <li>Click &quot;Start Game&quot; to begin (1 player minimum for testing)</li>
                    <li>Battle on the 8x8 grid!</li>
                </ol>
            </div>
        </div>
    );
}

// Separate component to fetch individual game data
function GameCard({
    gameId,
    onJoin,
    onStart,
    onWatch,
    isProcessing,
    selectedTokenId
}: {
    gameId: number;
    onJoin: (id: number) => void;
    onStart: (id: number) => void;
    onWatch: (id: number) => void;
    isProcessing: boolean;
    selectedTokenId: number | null;
}) {
    const { data: gameData } = useReadContract({
        address: ADDRESSES.DARK_ARENA as `0x${string}`,
        abi: DARK_ARENA_ABI,
        functionName: 'getGame',
        args: [BigInt(gameId)],
    });

    if (!gameData) {
        return (
            <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-700 animate-pulse">
                <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
                <div className="h-4 bg-gray-700 rounded w-1/2"></div>
            </div>
        );
    }

    const game = gameData as GameData;
    const state = GAME_STATES[game.state] || 'Unknown';
    const isLobby = game.state === 0;
    const isActive = game.state === 1;
    const isFinished = game.state === 2;

    return (
        <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-700 hover:border-purple-500/50 transition-all">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                        <span className="text-2xl font-bold text-white">Game #{gameId}</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            isLobby ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50' :
                            isActive ? 'bg-green-500/20 text-green-400 border border-green-500/50' :
                            'bg-gray-500/20 text-gray-400 border border-gray-500/50'
                        }`}>
                            {isLobby ? '⏳ Lobby' : isActive ? '⚔️ Active' : '🏁 Finished'}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <div className="text-gray-400">Players</div>
                            <div className="text-white font-semibold text-lg">{game.playerCount}/16</div>
                        </div>
                        <div>
                            <div className="text-gray-400">Prize Pool</div>
                            <div className="text-purple-400 font-semibold text-lg">
                                {formatEther(game.prizePool)} PLS
                            </div>
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
                                onClick={() => onJoin(gameId)}
                                disabled={isProcessing}
                                className={`font-bold py-3 px-6 rounded-lg transition-all ${
                                    !isProcessing
                                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg shadow-green-500/30 hover:scale-105'
                                        : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
                                }`}
                            >
                                ⚔️ Join
                            </button>
                            {game.playerCount >= 1 && (
                                <button
                                    onClick={() => onStart(gameId)}
                                    disabled={isProcessing}
                                    className={`font-bold py-3 px-6 rounded-lg transition-all ${
                                        !isProcessing
                                            ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg shadow-orange-500/30 hover:scale-105'
                                            : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
                                    }`}
                                >
                                    🚀 Start
                                </button>
                            )}
                        </>
                    )}
                    {(isActive || isFinished) && (
                        <button
                            onClick={() => onWatch(gameId)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-all"
                        >
                            👁️ View
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
