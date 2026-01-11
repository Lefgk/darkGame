'use client';

import Image from 'next/image';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { HowToPlay } from '@/components/HowToPlay';
import { GameStats } from '@/components/GameStats';
import { ActiveGames } from '@/components/ActiveGames';
import { NicknameRegistry } from '@/components/NicknameRegistry';
import { LiveStats } from '@/components/LiveStats';
import { IMAGES } from '@/lib/images';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#030404] relative overflow-hidden">
      {/* Animated Space Background - Nebula from antigravity */}
      <div className="fixed inset-0 z-0">
        <Image
          src={IMAGES.NEBULA_BG}
          alt=""
          fill
          className="object-cover opacity-50"
          priority
        />
        {/* Gradient Overlays - Red to Blue like antigravity */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#3C00DC]/20 via-[#030404] to-[#030404]"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(60, 0, 220, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255, 80, 1, 0.15) 0%, transparent 50%)',
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
                <div className="w-12 h-12 bg-gradient-to-br from-[#FF5001] via-[#3C00DC] to-[#FF5001] rounded-xl flex items-center justify-center shadow-lg shadow-[#FF5001]/50 overflow-hidden">
                  <Image
                    src={IMAGES.FUEL_CELL}
                    alt="Dark Arena"
                    width={40}
                    height={40}
                    className="object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-black gradient-text-ag">
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
              <Image src={IMAGES.PLS_COLOR} alt="PLS" width={20} height={20} />
              <span className="text-[#FF5001] text-sm font-bold">LIVE ON PULSECHAIN</span>
            </div>

            {/* Hero Image */}
            <div className="relative w-48 h-48 mx-auto">
              <Image
                src={IMAGES.FUEL_CELL_NFT_GREEN}
                alt="FuelCell NFT"
                fill
                className="object-contain animate-pulse"
              />
            </div>

            {/* Title */}
            <h2 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-none">
              <span className="block gradient-text-ag drop-shadow-2xl">
                BATTLE
              </span>
              <span className="block gradient-text-ag drop-shadow-2xl">
                ROYALE
              </span>
            </h2>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Turn-based tactical combat on an 8x8 grid.
              <br className="hidden md:block" />
              <span className="text-[#FF5001] font-bold">Fight.</span>{' '}
              <span className="text-[#3C00DC] font-bold">Survive.</span>{' '}
              <span className="text-[#FF5001] font-bold">Dominate.</span>
              <br />
              <span className="text-green-400 font-bold text-lg">FREE TO PLAY (TESTING)</span>
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <a
                href="#arena"
                className="group relative overflow-hidden btn-ag-primary text-white font-bold py-5 px-10 rounded-2xl text-lg shadow-2xl shadow-[#FF5001]/30 transition-all hover:scale-105 hover:shadow-[#3C00DC]/60"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <Image src={IMAGES.ROCKET} alt="" width={24} height={24} />
                  ENTER ARENA
                </span>
              </a>
              <a
                href="#guide"
                className="bg-white/5 hover:bg-white/10 backdrop-blur-md text-white font-bold py-5 px-10 rounded-2xl text-lg gradient-border-ag transition-all hover:scale-105 flex items-center justify-center gap-2"
              >
                <Image src={IMAGES.BOOK} alt="" width={24} height={24} />
                HOW TO PLAY
              </a>
            </div>

            {/* Live Stats */}
            <LiveStats />
          </div>
        </section>

        {/* Active Games Section */}
        <section id="arena" className="container mx-auto px-4 md:px-6 py-16 md:py-24">
          <div className="text-center mb-12">
            <h3 className="text-5xl md:text-6xl font-black text-white mb-4">
              JOIN THE <span className="gradient-text-ag">ARENA</span>
            </h3>
            <p className="text-gray-400 text-lg">Select your FuelCell NFT and enter the battle</p>
          </div>

          {/* Nickname Registration */}
          <div className="max-w-md mx-auto mb-8">
            <NicknameRegistry />
          </div>

          <ActiveGames />
        </section>

        {/* How to Play Section */}
        <section id="guide" className="container mx-auto px-4 md:px-6 py-16 md:py-24">
          <HowToPlay />
        </section>

        {/* Game Stats Section */}
        <section className="container mx-auto px-4 md:px-6 py-16 md:py-24">
          <GameStats />
        </section>

        {/* Footer */}
        <footer className="border-t border-white/5 py-12 mt-16 bg-black/20 backdrop-blur-xl">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="text-center md:text-left flex items-center gap-4">
                <Image src={IMAGES.LOGO} alt="Antigravity" width={50} height={50} />
                <div>
                  <h4 className="text-3xl font-black gradient-text-ag mb-1">
                    DARK ARENA
                  </h4>
                  <p className="text-gray-500 text-sm">Built on PulseChain • Powered by FuelCell NFTs</p>
                </div>
              </div>
              <div className="flex gap-6">
                <a href="#" className="hover:opacity-80 transition-opacity p-2 bg-white/5 rounded-lg hover:bg-white/10">
                  <Image src={IMAGES.DOCUMENT} alt="Docs" width={24} height={24} />
                </a>
                <a href="#" className="hover:opacity-80 transition-opacity p-2 bg-white/5 rounded-lg hover:bg-white/10">
                  <Image src={IMAGES.TWITTER} alt="Twitter" width={24} height={24} />
                </a>
                <a href="#" className="hover:opacity-80 transition-opacity p-2 bg-white/5 rounded-lg hover:bg-white/10">
                  <Image src={IMAGES.DISCORD} alt="Discord" width={24} height={24} />
                </a>
                <a href="#" className="hover:opacity-80 transition-opacity p-2 bg-white/5 rounded-lg hover:bg-white/10">
                  <Image src={IMAGES.TELEGRAM} alt="Telegram" width={24} height={24} />
                </a>
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
