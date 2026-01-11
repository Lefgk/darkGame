'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { API_URL } from '@/lib/constants';
import { IMAGES } from '@/lib/images';

interface GameData {
  gameId: number;
  state: number;
  ships: Array<{
    player: string;
    isNPC?: boolean;
  }>;
}

export function LiveStats() {
  const [stats, setStats] = useState({
    activeGames: 0,
    totalPlayers: 0,
    plsPrizes: 0,
    gamesPlayed: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_URL}/games`);
        if (res.ok) {
          const data = await res.json();
          const games: GameData[] = data.games || [];

          const activeGames = games.filter(g => g.state === 1).length;
          const gamesPlayed = games.filter(g => g.state === 2).length;
          const totalPlayers = new Set(
            games.flatMap(g => g.ships.filter(s => !s.isNPC).map(s => s.player.toLowerCase()))
          ).size;

          setStats({
            activeGames,
            totalPlayers,
            plsPrizes: 0, // Placeholder for now
            gamesPlayed,
          });
        }
      } catch (e) {
        console.error('Failed to fetch stats:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const statItems = [
    { value: stats.activeGames, label: 'Active Games', color: 'red', icon: IMAGES.ROCKET },
    { value: stats.totalPlayers, label: 'Total Players', color: 'blue', icon: IMAGES.FUEL_CELL },
    { value: stats.plsPrizes, label: 'PLS Prizes', color: 'red', icon: IMAGES.PLS_COLOR },
    { value: stats.gamesPlayed, label: 'Games Played', color: 'blue', icon: IMAGES.LEADERBOARD },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-12 max-w-4xl mx-auto">
      {statItems.map((stat, i) => (
        <div
          key={i}
          className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-[#FF5001]/30 transition-all hover:scale-105"
        >
          <div className="flex justify-center mb-2">
            <Image src={stat.icon} alt="" width={32} height={32} />
          </div>
          <div className={`text-4xl md:text-5xl font-black bg-gradient-to-r ${stat.color === 'red' ? 'from-[#FF5001] to-[#FF7033]' : 'from-[#3C00DC] to-[#5020FF]'} bg-clip-text text-transparent`}>
            {loading ? '--' : stat.value}
          </div>
          <div className="text-gray-400 text-sm mt-2 font-medium">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}
