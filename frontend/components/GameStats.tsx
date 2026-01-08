'use client';

export function GameStats() {
    // Mock data - replace with real contract data
    const stats = {
        totalGames: 42,
        totalPlayers: 336,
        totalPrizePool: '21,000',
        largestPot: '1,200',
        topPlayer: '0x742d...35C2',
        topPlayerWins: 8,
    };

    const recentGames = [
        { id: 42, winner: '0x742d...35C2', prize: '648 PLS', players: 12, duration: '45 turns' },
        { id: 41, winner: '0x8a9f...91B3', prize: '540 PLS', players: 10, duration: '38 turns' },
        { id: 40, winner: '0x1c3e...42D1', prize: '756 PLS', players: 14, duration: '52 turns' },
        { id: 39, winner: '0x5f7b...83A4', prize: '432 PLS', players: 8, duration: '31 turns' },
    ];

    const leaderboard = [
        { rank: 1, player: '0x742d...35C2', wins: 8, earnings: '4,320 PLS', games: 25 },
        { rank: 2, player: '0x8a9f...91B3', wins: 6, earnings: '3,240 PLS', games: 18 },
        { rank: 3, player: '0x1c3e...42D1', wins: 5, earnings: '2,700 PLS', games: 15 },
        { rank: 4, player: '0x5f7b...83A4', wins: 4, earnings: '2,160 PLS', games: 12 },
        { rank: 5, player: '0x9d2a...61F5', wins: 3, earnings: '1,620 PLS', games: 10 },
    ];

    return (
        <div className="space-y-6">
            {/* Overall Stats */}
            <div className="bg-gray-800/50 rounded-xl p-8 backdrop-blur-sm border border-purple-500/20">
                <h3 className="text-3xl font-bold mb-6 text-purple-400">Global Statistics</h3>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-purple-900/30 to-purple-700/30 rounded-lg p-6 border border-purple-500/30">
                        <div className="text-sm text-gray-400 mb-2">Total Games</div>
                        <div className="text-4xl font-bold text-white">{stats.totalGames}</div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-900/30 to-blue-700/30 rounded-lg p-6 border border-blue-500/30">
                        <div className="text-sm text-gray-400 mb-2">Total Players</div>
                        <div className="text-4xl font-bold text-white">{stats.totalPlayers}</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-900/30 to-green-700/30 rounded-lg p-6 border border-green-500/30">
                        <div className="text-sm text-gray-400 mb-2">Total Prizes</div>
                        <div className="text-4xl font-bold text-white">{stats.totalPrizePool}</div>
                        <div className="text-xs text-gray-400">PLS distributed</div>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-900/30 to-yellow-700/30 rounded-lg p-6 border border-yellow-500/30">
                        <div className="text-sm text-gray-400 mb-2">Largest Pot</div>
                        <div className="text-4xl font-bold text-white">{stats.largestPot}</div>
                        <div className="text-xs text-gray-400">PLS</div>
                    </div>
                    <div className="bg-gradient-to-br from-pink-900/30 to-pink-700/30 rounded-lg p-6 border border-pink-500/30 col-span-2">
                        <div className="text-sm text-gray-400 mb-2">Top Player</div>
                        <div className="text-2xl font-bold text-white">{stats.topPlayer}</div>
                        <div className="text-lg text-gray-300">{stats.topPlayerWins} wins</div>
                    </div>
                </div>
            </div>

            {/* Recent Games */}
            <div className="bg-gray-800/50 rounded-xl p-8 backdrop-blur-sm border border-purple-500/20">
                <h3 className="text-2xl font-bold mb-4 text-purple-400">Recent Games</h3>

                <div className="space-y-3">
                    {recentGames.map((game) => (
                        <div
                            key={game.id}
                            className="bg-gray-900/50 rounded-lg p-4 border border-gray-700 hover:border-purple-500/50 transition-colors"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="text-gray-400 font-mono">#{game.id}</div>
                                    <div>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-sm text-gray-400">Winner:</span>
                                            <span className="font-mono text-white">{game.winner}</span>
                                            <span className="text-yellow-400">👑</span>
                                        </div>
                                        <div className="flex items-center space-x-4 text-sm text-gray-400 mt-1">
                                            <span>{game.players} players</span>
                                            <span>•</span>
                                            <span>{game.duration}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-green-400">{game.prize}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Leaderboard */}
            <div className="bg-gray-800/50 rounded-xl p-8 backdrop-blur-sm border border-purple-500/20">
                <h3 className="text-2xl font-bold mb-4 text-purple-400">Leaderboard</h3>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-700 text-gray-400 text-sm">
                                <th className="text-left py-3">Rank</th>
                                <th className="text-left py-3">Player</th>
                                <th className="text-center py-3">Wins</th>
                                <th className="text-right py-3">Earnings</th>
                                <th className="text-right py-3">Games</th>
                                <th className="text-right py-3">Win Rate</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaderboard.map((entry) => (
                                <tr
                                    key={entry.rank}
                                    className="border-b border-gray-800 hover:bg-gray-700/30 transition-colors"
                                >
                                    <td className="py-4">
                                        <div className="flex items-center space-x-2">
                                            {entry.rank === 1 && <span className="text-2xl">🥇</span>}
                                            {entry.rank === 2 && <span className="text-2xl">🥈</span>}
                                            {entry.rank === 3 && <span className="text-2xl">🥉</span>}
                                            {entry.rank > 3 && (
                                                <span className="text-gray-400 font-bold">#{entry.rank}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-4">
                                        <span className="font-mono text-white">{entry.player}</span>
                                    </td>
                                    <td className="py-4 text-center">
                                        <span className="font-bold text-purple-400">{entry.wins}</span>
                                    </td>
                                    <td className="py-4 text-right">
                                        <span className="font-bold text-green-400">{entry.earnings}</span>
                                    </td>
                                    <td className="py-4 text-right text-gray-400">{entry.games}</td>
                                    <td className="py-4 text-right">
                                        <span className="font-semibold text-blue-400">
                                            {((entry.wins / entry.games) * 100).toFixed(1)}%
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Ship Class Distribution */}
            <div className="bg-gray-800/50 rounded-xl p-8 backdrop-blur-sm border border-purple-500/20">
                <h3 className="text-2xl font-bold mb-4 text-purple-400">Popular Ship Classes</h3>

                <div className="space-y-3">
                    {[
                        { name: 'Cruiser', emoji: '⚓', percentage: 35, wins: 45 },
                        { name: 'Frigate', emoji: '🛥️', percentage: 25, wins: 32 },
                        { name: 'Dreadnought', emoji: '🚢', percentage: 20, wins: 28 },
                        { name: 'Titan', emoji: '🛡️', percentage: 12, wins: 18 },
                        { name: 'Fighter', emoji: '✈️', percentage: 8, wins: 12 },
                    ].map((ship) => (
                        <div key={ship.name} className="flex items-center space-x-4">
                            <span className="text-3xl">{ship.emoji}</span>
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-semibold text-white">{ship.name}</span>
                                    <div className="flex items-center space-x-4 text-sm">
                                        <span className="text-gray-400">{ship.wins}% win rate</span>
                                        <span className="text-purple-400 font-bold">{ship.percentage}%</span>
                                    </div>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2">
                                    <div
                                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                                        style={{ width: `${ship.percentage}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
