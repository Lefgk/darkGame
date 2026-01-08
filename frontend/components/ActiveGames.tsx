'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { NFTShipSelector } from './NFTShipSelector';

// Mock data for active games
const mockActiveGames = [
    {
        id: 1,
        players: 8,
        maxPlayers: 16,
        prizePool: '400 DARK',
        state: 'WAITING',
        creator: '0x1234...5678',
    },
    {
        id: 2,
        players: 12,
        maxPlayers: 16,
        prizePool: '600 DARK',
        state: 'WAITING',
        creator: '0xabcd...ef12',
    },
    {
        id: 3,
        players: 16,
        maxPlayers: 16,
        prizePool: '800 DARK',
        state: 'IN_PROGRESS',
        round: 5,
        playersAlive: 7,
        creator: '0x9876...5432',
    },
];

export function ActiveGames() {
    const router = useRouter();
    const [selectedTokenId, setSelectedTokenId] = useState<number | null>(null);
    const [selectedJourneyId, setSelectedJourneyId] = useState<number | null>(null);
    const [isCreatingGame, setIsCreatingGame] = useState(false);
    const [joiningGameId, setJoiningGameId] = useState<number | null>(null);

    const handleSelectNFT = (tokenId: number, journeyId: number) => {
        setSelectedTokenId(tokenId);
        setSelectedJourneyId(journeyId);
    };

    const handleCreateGame = async () => {
        if (!selectedTokenId || !selectedJourneyId) {
            alert('Please select a FuelCell NFT first!');
            return;
        }

        setIsCreatingGame(true);
        try {
            // TODO: Call DarkArena.createGame() contract function
            console.log('Creating game with NFT', selectedTokenId, 'Journey', selectedJourneyId);

            // For now, create a mock game ID and navigate
            const mockGameId = Date.now();
            router.push(`/game/${mockGameId}`);
        } catch (error) {
            console.error('Failed to create game:', error);
            setIsCreatingGame(false);
        }
    };

    const handleJoinGame = async (gameId: number) => {
        if (!selectedTokenId || !selectedJourneyId) {
            alert('Please select a FuelCell NFT first!');
            return;
        }

        setJoiningGameId(gameId);
        try {
            // TODO: Call DarkArena.joinGame(gameId, tokenId, journeyId)
            console.log('Joining game', gameId, 'with NFT', selectedTokenId, 'Journey', selectedJourneyId);

            // Navigate to game board
            router.push(`/game/${gameId}`);
        } catch (error) {
            console.error('Failed to join game:', error);
            setJoiningGameId(null);
        }
    };

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
                        Game starts when 5-16 players join.
                    </p>
                    <button
                        onClick={handleCreateGame}
                        disabled={!selectedTokenId || isCreatingGame}
                        className={`text-white font-bold py-4 px-8 rounded-lg text-xl shadow-lg transition-all ${selectedTokenId && !isCreatingGame
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-purple-500/50 hover:scale-105 cursor-pointer'
                            : 'bg-gray-600 cursor-not-allowed opacity-50'
                            }`}
                    >
                        {isCreatingGame ? '⏳ Creating...' : selectedTokenId ? '🎮 Create Game' : '❌ Select NFT First'}
                    </button>
                </div>
            </div>

            {/* Active Games List */}
            <div className="bg-gray-800/50 rounded-xl p-8 backdrop-blur-sm border border-purple-500/20">
                <h3 className="text-2xl font-bold mb-6 text-purple-400">Active Games</h3>

                {mockActiveGames.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <p className="text-xl mb-2">No active games</p>
                        <p className="text-sm">Be the first to create one!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {mockActiveGames.map((game) => (
                            <div
                                key={game.id}
                                className="bg-gray-900/50 rounded-lg p-6 border border-gray-700 hover:border-purple-500/50 transition-all"
                            >
                                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                    {/* Game Info */}
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-3 mb-3">
                                            <span className="text-2xl font-bold text-white">Game #{game.id}</span>
                                            <span
                                                className={`px-3 py-1 rounded-full text-sm font-semibold ${game.state === 'WAITING'
                                                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
                                                    : 'bg-green-500/20 text-green-400 border border-green-500/50'
                                                    }`}
                                            >
                                                {game.state === 'WAITING' ? '⏳ Lobby' : '⚔️ In Progress'}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                            <div>
                                                <div className="text-gray-400">Players</div>
                                                <div className="text-white font-semibold text-lg">
                                                    {game.players}/{game.maxPlayers}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-gray-400">Prize Pool</div>
                                                <div className="text-purple-400 font-semibold text-lg">{game.prizePool}</div>
                                            </div>
                                            {game.state === 'IN_PROGRESS' && (
                                                <>
                                                    <div>
                                                        <div className="text-gray-400">Round</div>
                                                        <div className="text-white font-semibold text-lg">{game.round}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-gray-400">Alive</div>
                                                        <div className="text-green-400 font-semibold text-lg">{game.playersAlive}</div>
                                                    </div>
                                                </>
                                            )}
                                            <div>
                                                <div className="text-gray-400">Created By</div>
                                                <div className="text-gray-300 font-mono text-xs">{game.creator}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <div>
                                        {game.state === 'WAITING' ? (
                                            <button
                                                onClick={() => handleJoinGame(game.id)}
                                                disabled={!selectedTokenId || joiningGameId === game.id}
                                                className={`font-bold py-3 px-6 rounded-lg transition-all whitespace-nowrap ${selectedTokenId && joiningGameId !== game.id
                                                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg shadow-green-500/30 hover:scale-105 cursor-pointer'
                                                    : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
                                                    }`}
                                            >
                                                {joiningGameId === game.id
                                                    ? '⏳ Joining...'
                                                    : selectedTokenId
                                                        ? '⚔️ Join Game'
                                                        : '❌ Select NFT'}
                                            </button>
                                        ) : (
                                            <button
                                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-all"
                                                onClick={() => router.push(`/game/${game.id}`)}
                                            >
                                                👁️ Watch
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Instructions */}
            <div className="bg-blue-900/20 rounded-lg p-6 border border-blue-500/30">
                <h4 className="text-lg font-bold text-blue-400 mb-2">💡 How to Play</h4>
                <ol className="text-gray-300 text-sm space-y-1 list-decimal list-inside">
                    <li>Select one of your FuelCell NFTs above - your ship class is determined by journey rarity</li>
                    <li>Create a new game or join an existing lobby</li>
                    <li>Wait for 5-16 players to join (game starts automatically at 5 minimum)</li>
                    <li>Battle on an 8x8 grid, make strategic moves each turn</li>
                    <li>Survive the shrinking zone and eliminate opponents</li>
                    <li>Top 3 survivors split the prize pool (50%/30%/20%)</li>
                </ol>
            </div>
        </div>
    );
}
