'use client';

import { useParams } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { GameBoard } from '@/components/GameBoard';

export default function GamePage() {
  const params = useParams();
  const gameId = params.id as string;

  return (
    <div className="min-h-screen bg-black">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-black/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <a href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-xl">⚔️</span>
              </div>
              <div>
                <h1 className="text-xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-purple-500 bg-clip-text text-transparent">
                  DARK ARENA
                </h1>
              </div>
            </a>
            <div className="flex items-center gap-4">
              <a
                href="/"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                ← Exit Game
              </a>
              <ConnectButton />
            </div>
          </div>
        </div>
      </header>

      {/* Game Board with top padding for fixed header */}
      <div className="pt-16">
        <GameBoard gameId={gameId} />
      </div>
    </div>
  );
}
