'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useNickname } from './NicknameRegistry';
import { API_URL } from '@/lib/constants';
import { IMAGES } from '@/lib/images';
import Image from 'next/image';

interface GameData {
  gameId: number;
  state: number;
  winner: string;
  secondPlace: string;
  thirdPlace: string;
  ships: Array<{
    player: string;
    kills: number;
    damageDealt: number;
    isAlive: boolean;
    isNPC?: boolean;
  }>;
}

interface PlayerStats {
  gamesPlayed: number;
  wins: number;
  secondPlace: number;
  thirdPlace: number;
  totalKills: number;
  totalDamage: number;
  bestKillStreak: number;
}

export function GameStats() {
  const { address, isConnected } = useAccount();
  const nickname = useNickname(address);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [allGames, setAllGames] = useState<GameData[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all games and calculate stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_URL}/games`);
        if (res.ok) {
          const data = await res.json();
          setAllGames(data.games || []);

          if (address) {
            // Calculate player stats from finished games
            const playerStats: PlayerStats = {
              gamesPlayed: 0,
              wins: 0,
              secondPlace: 0,
              thirdPlace: 0,
              totalKills: 0,
              totalDamage: 0,
              bestKillStreak: 0,
            };

            data.games.forEach((game: GameData) => {
              // Check if player was in this game
              const playerShip = game.ships.find(
                s => s.player.toLowerCase() === address.toLowerCase() && !s.isNPC
              );

              if (playerShip) {
                playerStats.gamesPlayed++;
                playerStats.totalKills += playerShip.kills;
                playerStats.totalDamage += playerShip.damageDealt;
                playerStats.bestKillStreak = Math.max(playerStats.bestKillStreak, playerShip.kills);

                // Check placements (only for finished games)
                if (game.state === 2) {
                  if (game.winner.toLowerCase() === address.toLowerCase()) {
                    playerStats.wins++;
                  } else if (game.secondPlace.toLowerCase() === address.toLowerCase()) {
                    playerStats.secondPlace++;
                  } else if (game.thirdPlace.toLowerCase() === address.toLowerCase()) {
                    playerStats.thirdPlace++;
                  }
                }
              }
            });

            setStats(playerStats);
          }
        }
      } catch (e) {
        console.error('Failed to fetch stats:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, [address]);

  // Calculate global stats
  const globalStats = {
    totalGames: allGames.length,
    finishedGames: allGames.filter(g => g.state === 2).length,
    activeGames: allGames.filter(g => g.state === 1).length,
    totalPlayers: new Set(
      allGames.flatMap(g => g.ships.filter(s => !s.isNPC).map(s => s.player.toLowerCase()))
    ).size,
    totalKills: allGames.reduce((acc, g) => acc + g.ships.filter(s => !s.isNPC).reduce((a, s) => a + s.kills, 0), 0),
    totalDamage: allGames.reduce((acc, g) => acc + g.ships.filter(s => !s.isNPC).reduce((a, s) => a + s.damageDealt, 0), 0),
  };

  return (
    <div className="space-y-8">
      {/* Section Title */}
      <div className="text-center mb-8">
        <h3 className="text-5xl md:text-6xl font-black text-white mb-4">
          YOUR <span className="gradient-text-ag">STATISTICS</span>
        </h3>
        <p className="text-gray-400 text-lg">Track your performance in the arena</p>
      </div>

      {/* Player Card */}
      {isConnected ? (
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 border border-purple-500/30 shadow-2xl shadow-purple-500/10 relative overflow-hidden">
          {/* Background image */}
          <div className="absolute inset-0 opacity-10">
            <Image
              src={IMAGES.NEBULA_BG}
              alt=""
              fill
              className="object-cover"
            />
          </div>

          <div className="relative z-10">
            <div className="flex flex-col md:flex-row items-center gap-6 mb-8">
              {/* Avatar */}
              <div className="w-28 h-28 bg-gradient-to-br from-[#FF5001] to-[#3C00DC] rounded-2xl flex items-center justify-center shadow-lg relative overflow-hidden">
                <Image
                  src={IMAGES.FUEL_CELL}
                  alt="Player Avatar"
                  width={80}
                  height={80}
                  className="object-contain"
                />
              </div>

              {/* Player Info */}
              <div className="text-center md:text-left flex-1">
                <h4 className="text-3xl font-black text-white mb-1">
                  {nickname || 'Anonymous Pilot'}
                </h4>
                <div className="flex items-center gap-2 justify-center md:justify-start">
                  <Image src={IMAGES.WALLET} alt="" width={16} height={16} className="opacity-50" />
                  <p className="text-gray-400 font-mono text-sm break-all">{address}</p>
                </div>
                {!nickname && (
                  <p className="text-yellow-400 text-sm mt-2">Set a nickname above to personalize your profile!</p>
                )}
              </div>

              {/* Win Rate */}
              {stats && stats.gamesPlayed > 0 && (
                <div className="text-center bg-black/30 rounded-xl p-4 min-w-[120px] border border-green-500/30">
                  <div className="text-4xl font-black text-green-400">
                    {Math.round((stats.wins / stats.gamesPlayed) * 100)}%
                  </div>
                  <div className="text-gray-400 text-sm">Win Rate</div>
                </div>
              )}
            </div>

            {/* Stats Grid */}
            {loading ? (
              <div className="text-center py-8 text-gray-400">Loading stats...</div>
            ) : stats ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <StatCard
                  label="Games Played"
                  value={stats.gamesPlayed}
                  icon={IMAGES.ROCKET}
                  color="blue"
                />
                <StatCard
                  label="Wins"
                  value={stats.wins}
                  icon={IMAGES.LEADERBOARD}
                  color="gold"
                  isEmoji
                  emoji="🏆"
                />
                <StatCard
                  label="2nd Place"
                  value={stats.secondPlace}
                  icon={IMAGES.LEADERBOARD}
                  color="silver"
                  isEmoji
                  emoji="🥈"
                />
                <StatCard
                  label="3rd Place"
                  value={stats.thirdPlace}
                  icon={IMAGES.LEADERBOARD}
                  color="bronze"
                  isEmoji
                  emoji="🥉"
                />
                <StatCard
                  label="Total Kills"
                  value={stats.totalKills}
                  icon={IMAGES.HAMMER}
                  color="red"
                  isEmoji
                  emoji="💀"
                />
                <StatCard
                  label="Total Damage"
                  value={stats.totalDamage}
                  icon={IMAGES.POINTS}
                  color="orange"
                  isEmoji
                  emoji="💥"
                />
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                No games played yet. Enter the arena and start battling!
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-gray-800/50 rounded-2xl p-12 border border-gray-700 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-5">
            <Image src={IMAGES.NEBULA_BG} alt="" fill className="object-cover" />
          </div>
          <div className="relative z-10">
            <Image src={IMAGES.WALLET} alt="" width={64} height={64} className="mx-auto mb-4 opacity-50" />
            <h4 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h4>
            <p className="text-gray-400">Connect your wallet to view your personal statistics</p>
          </div>
        </div>
      )}

      {/* Global Stats */}
      <div className="bg-gradient-to-br from-gray-900/80 to-[#1a0a30]/80 rounded-2xl p-8 border border-[#3C00DC]/30 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 opacity-20">
          <Image src={IMAGES.NEBULA_BG} alt="" fill className="object-cover" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Image src={IMAGES.LOGO} alt="" width={40} height={40} />
            <h4 className="text-2xl font-bold text-white">Global Arena Stats</h4>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <GlobalStatCard
              label="Active Games"
              value={globalStats.activeGames}
              icon={IMAGES.ROCKET}
              color="from-green-500 to-emerald-500"
            />
            <GlobalStatCard
              label="Games Finished"
              value={globalStats.finishedGames}
              icon={IMAGES.LEADERBOARD}
              color="from-[#3C00DC] to-purple-500"
            />
            <GlobalStatCard
              label="Unique Players"
              value={globalStats.totalPlayers}
              icon={IMAGES.FUEL_CELL}
              color="from-cyan-500 to-blue-500"
            />
            <GlobalStatCard
              label="Total Games"
              value={globalStats.totalGames}
              icon={IMAGES.HAMMER}
              color="from-[#FF5001] to-orange-500"
            />
            <GlobalStatCard
              label="Total Kills"
              value={globalStats.totalKills}
              icon={IMAGES.POINTS}
              color="from-red-500 to-pink-500"
            />
            <GlobalStatCard
              label="Total Damage"
              value={globalStats.totalDamage}
              icon={IMAGES.GIFT}
              color="from-yellow-500 to-orange-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Stat Card Component for Player Stats
function StatCard({
  label,
  value,
  icon,
  color,
  isEmoji = false,
  emoji
}: {
  label: string;
  value: number;
  icon: string;
  color: string;
  isEmoji?: boolean;
  emoji?: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: 'from-blue-500 to-cyan-500',
    gold: 'from-yellow-500 to-orange-500',
    silver: 'from-gray-400 to-gray-500',
    bronze: 'from-orange-600 to-yellow-700',
    red: 'from-red-500 to-pink-500',
    orange: 'from-orange-500 to-red-500',
    green: 'from-green-500 to-emerald-500',
    purple: 'from-purple-500 to-pink-500',
  };

  return (
    <div className="bg-black/40 rounded-xl p-4 text-center hover:bg-black/60 transition-all hover:scale-105 border border-white/5 hover:border-white/20">
      <div className="text-4xl mb-2">
        {isEmoji && emoji ? emoji : <Image src={icon} alt="" width={40} height={40} className="mx-auto" />}
      </div>
      <div className={`text-2xl font-black bg-gradient-to-r ${colorClasses[color] || colorClasses.blue} bg-clip-text text-transparent`}>
        {value.toLocaleString()}
      </div>
      <div className="text-gray-400 text-xs mt-1">{label}</div>
    </div>
  );
}

// Global Stat Card Component
function GlobalStatCard({
  label,
  value,
  icon,
  color
}: {
  label: string;
  value: number;
  icon: string;
  color: string;
}) {
  return (
    <div className="bg-black/30 rounded-xl p-4 text-center hover:bg-black/50 transition-all hover:scale-105 border border-white/5">
      <div className="w-12 h-12 mx-auto mb-2 rounded-lg bg-gradient-to-br p-2" style={{ background: `linear-gradient(135deg, var(--tw-gradient-stops))` }}>
        <Image src={icon} alt="" width={32} height={32} className="w-full h-full object-contain" />
      </div>
      <div className={`text-3xl font-black bg-gradient-to-r ${color} bg-clip-text text-transparent`}>
        {value.toLocaleString()}
      </div>
      <div className="text-gray-400 text-sm mt-1">{label}</div>
    </div>
  );
}
