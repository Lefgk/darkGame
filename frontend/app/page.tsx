'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { HowToPlay } from '@/components/HowToPlay';
import { ShipClasses } from '@/components/ShipClasses';
import { GameStats } from '@/components/GameStats';
import { ActiveGames } from '@/components/ActiveGames';

export default function Home() {
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated Space Background */}
      <div className="fixed inset-0 z-0">
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-purple-950/30 via-black to-black"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(120, 0, 255, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255, 0, 180, 0.15) 0%, transparent 50%)',
        }}></div>

        {/* Starfield */}
        <div className="absolute inset-0 opacity-60" style={{
          backgroundImage: `
            radial-gradient(2px 2px at 20% 30%, white, transparent),
            radial-gradient(2px 2px at 60% 70%, white, transparent),
            radial-gradient(1px 1px at 50% 50%, white, transparent),
            radial-gradient(1px 1px at 80% 10%, white, transparent),
            radial-gradient(2px 2px at 90% 60%, white, transparent),
            radial-gradient(1px 1px at 33% 80%, white, transparent),
            radial-gradient(1px 1px at 15% 90%, white, transparent)
          `,
          backgroundSize: '200% 200%',
          backgroundPosition: '50% 50%',
          animation: 'twinkle 200s linear infinite',
        }}></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-white/5 bg-black/20 backdrop-blur-xl sticky top-0 z-50">
          <div className="container mx-auto px-4 md:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/50">
                  <span className="text-2xl">⚔️</span>
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-purple-500 bg-clip-text text-transparent">
                    DARK ARENA
                  </h1>
                  <p className="text-xs text-gray-500 font-medium">POWERED BY FUELCELL</p>
                </div>
              </div>
              <ConnectButton />
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="container mx-auto px-4 md:px-6 py-20 md:py-32">
          <div className="text-center space-y-8 max-w-5xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full backdrop-blur-sm">
              <span className="text-purple-400 text-sm font-bold">⚡ LIVE ON PULSECHAIN</span>
            </div>

            {/* Title */}
            <h2 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-none">
              <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-purple-500 bg-clip-text text-transparent drop-shadow-2xl">
                BATTLE
              </span>
              <span className="block bg-gradient-to-r from-pink-400 via-purple-400 to-pink-500 bg-clip-text text-transparent drop-shadow-2xl">
                ROYALE
              </span>
            </h2>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Turn-based tactical combat on an 8x8 grid.
              <br className="hidden md:block" />
              <span className="text-purple-400 font-bold">Fight.</span>{' '}
              <span className="text-pink-400 font-bold">Survive.</span>{' '}
              <span className="text-purple-400 font-bold">Dominate.</span>
              <br />
              <span className="text-green-400 font-bold text-lg">⚡ FREE TO PLAY (TESTING)</span>
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <a
                href="#arena"
                className="group relative overflow-hidden bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-500 hover:via-pink-500 hover:to-purple-500 text-white font-bold py-5 px-10 rounded-2xl text-lg shadow-2xl shadow-purple-500/30 transition-all hover:scale-105 hover:shadow-purple-500/60"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  🚀 ENTER ARENA
                </span>
              </a>
              <a
                href="#guide"
                className="bg-white/5 hover:bg-white/10 backdrop-blur-md text-white font-bold py-5 px-10 rounded-2xl text-lg border border-white/10 hover:border-purple-500/50 transition-all hover:scale-105"
              >
                📖 HOW TO PLAY
              </a>
            </div>

            {/* Live Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-12 max-w-4xl mx-auto">
              {[
                { value: '24', label: 'Active Games', color: 'purple' },
                { value: '1.2K', label: 'Total Players', color: 'pink' },
                { value: '50K', label: 'DARK Prizes', color: 'purple' },
                { value: '856', label: 'Games Played', color: 'pink' },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-purple-500/30 transition-all hover:scale-105"
                >
                  <div className={`text-4xl md:text-5xl font-black bg-gradient-to-r ${stat.color === 'purple' ? 'from-purple-400 to-purple-600' : 'from-pink-400 to-pink-600'} bg-clip-text text-transparent`}>
                    {stat.value}
                  </div>
                  <div className="text-gray-400 text-sm mt-2 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Active Games Section */}
        <section id="arena" className="container mx-auto px-4 md:px-6 py-16 md:py-24">
          <div className="text-center mb-12">
            <h3 className="text-5xl md:text-6xl font-black text-white mb-4">
              JOIN THE <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">ARENA</span>
            </h3>
            <p className="text-gray-400 text-lg">Select your FuelCell NFT and enter the battle</p>
          </div>
          <ActiveGames />
        </section>

        {/* How to Play Section */}
        <section id="guide" className="container mx-auto px-4 md:px-6 py-16 md:py-24">
          <HowToPlay />
        </section>

        {/* Ship Classes Section */}
        <section className="container mx-auto px-4 md:px-6 py-16 md:py-24">
          <div className="text-center mb-12">
            <h3 className="text-5xl md:text-6xl font-black text-white mb-4">
              SHIP <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">CLASSES</span>
            </h3>
            <p className="text-gray-400 text-lg">Your FuelCell journey determines your ship rarity</p>
          </div>
          <ShipClasses />
        </section>

        {/* Game Stats Section */}
        <section className="container mx-auto px-4 md:px-6 py-16 md:py-24">
          <GameStats />
        </section>

        {/* Footer */}
        <footer className="border-t border-white/5 py-12 mt-16 bg-black/20 backdrop-blur-xl">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="text-center md:text-left">
                <h4 className="text-3xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-purple-500 bg-clip-text text-transparent mb-2">
                  DARK ARENA
                </h4>
                <p className="text-gray-500 text-sm">Built on PulseChain • Powered by FuelCell NFTs</p>
              </div>
              <div className="flex gap-8 text-gray-400 text-sm">
                <a href="#" className="hover:text-purple-400 transition-colors font-medium">Documentation</a>
                <a href="#" className="hover:text-purple-400 transition-colors font-medium">Twitter</a>
                <a href="#" className="hover:text-purple-400 transition-colors font-medium">Discord</a>
                <a href="#" className="hover:text-purple-400 transition-colors font-medium">GitHub</a>
              </div>
            </div>
            <div className="text-center text-gray-600 text-sm mt-8 pt-8 border-t border-white/5">
              © 2026 Dark Arena. All rights reserved.
            </div>
          </div>
        </footer>
      </div>

      <style jsx>{`
        @keyframes twinkle {
          0% {
            background-position: 0% 0%;
          }
          100% {
            background-position: 100% 100%;
          }
        }
      `}</style>
    </div>
  );
}
