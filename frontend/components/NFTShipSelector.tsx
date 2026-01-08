'use client';

import { useAccount, useReadContract } from 'wagmi';
import { ADDRESSES } from '@/lib/constants';
import { FUELCELL_ABI } from '@/lib/abis';
import { useState, useEffect } from 'react';

interface FuelCellNFT {
    tokenId: number;
    journeyId: number;
    shipClass: string;
    rarity: string;
    emoji: string;
    stats: {
        hp: number;
        speed: number;
        range: number;
        damage: number;
    };
}

export function NFTShipSelector({ onSelectNFT }: { onSelectNFT: (tokenId: number, journeyId: number) => void }) {
    const { address } = useAccount();
    const [selectedToken, setSelectedToken] = useState<number | null>(null);
    const [userNFTs, setUserNFTs] = useState<FuelCellNFT[]>([]);

    // Get user's FuelCell balance
    const { data: balance } = useReadContract({
        address: ADDRESSES.FUELCELL_NFT as `0x${string}`,
        abi: FUELCELL_ABI,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
    });

    // Mock function to get journey ID (you'll need to implement this properly)
    const getShipFromJourney = (journeyId: number) => {
        if (journeyId <= 2) {
            return {
                shipClass: 'Titan',
                rarity: 'Legendary',
                emoji: '🛡️',
                stats: { hp: 500, speed: 2, range: 2, damage: 50 },
            };
        } else if (journeyId <= 5) {
            return {
                shipClass: 'Dreadnought',
                rarity: 'Epic',
                emoji: '🚢',
                stats: { hp: 350, speed: 3, range: 3, damage: 40 },
            };
        } else if (journeyId <= 10) {
            return {
                shipClass: 'Cruiser',
                rarity: 'Rare',
                emoji: '⚓',
                stats: { hp: 200, speed: 4, range: 2, damage: 30 },
            };
        } else if (journeyId <= 20) {
            return {
                shipClass: 'Frigate',
                rarity: 'Uncommon',
                emoji: '🛥️',
                stats: { hp: 120, speed: 5, range: 2, damage: 20 },
            };
        } else {
            return {
                shipClass: 'Fighter',
                rarity: 'Common',
                emoji: '✈️',
                stats: { hp: 50, speed: 6, range: 1, damage: 15 },
            };
        }
    };

    const getRarityColor = (rarity: string) => {
        switch (rarity) {
            case 'Legendary': return 'from-yellow-600 to-orange-600 border-yellow-500';
            case 'Epic': return 'from-purple-600 to-pink-600 border-purple-500';
            case 'Rare': return 'from-blue-600 to-cyan-600 border-blue-500';
            case 'Uncommon': return 'from-green-600 to-emerald-600 border-green-500';
            case 'Common': return 'from-gray-600 to-gray-800 border-gray-500';
            default: return 'from-gray-600 to-gray-800 border-gray-500';
        }
    };

    // Mock NFT data - in production, fetch real token IDs and journey IDs
    useEffect(() => {
        if (balance && Number(balance) > 0) {
            // Mock data - replace with actual contract calls
            const mockNFTs: FuelCellNFT[] = Array.from({ length: Number(balance) }, (_, i) => {
                const mockJourneyId = Math.floor(Math.random() * 25) + 1; // Random journey 1-25
                const shipData = getShipFromJourney(mockJourneyId);
                return {
                    tokenId: i + 1,
                    journeyId: mockJourneyId,
                    ...shipData,
                };
            });
            setUserNFTs(mockNFTs);
        }
    }, [balance]);

    if (!address) {
        return (
            <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-3xl p-8 border border-yellow-500/20 text-center backdrop-blur-xl">
                <div className="text-5xl mb-4">⚠️</div>
                <p className="text-yellow-400 font-bold text-xl mb-2">Wallet Not Connected</p>
                <p className="text-gray-300">Connect your wallet to see your FuelCell NFTs</p>
            </div>
        );
    }

    if (!balance || Number(balance) === 0) {
        return (
            <div className="bg-gradient-to-br from-red-500/10 to-pink-500/10 rounded-3xl p-8 border border-red-500/20 text-center backdrop-blur-xl">
                <div className="text-5xl mb-4">🚫</div>
                <p className="text-red-400 font-bold text-xl mb-2">No FuelCell NFTs</p>
                <p className="text-gray-300 mb-6">
                    You need at least one FuelCell NFT to play Dark Arena
                </p>
                <a
                    href="https://fuelcell.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-3 px-8 rounded-xl transition-all hover:scale-105 shadow-lg shadow-purple-500/30"
                >
                    Get FuelCell NFT →
                </a>
            </div>
        );
    }

    return (
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
            <h3 className="text-3xl font-black mb-2">
                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    YOUR FUELCELL SHIPS
                </span>
            </h3>
            <p className="text-gray-400 mb-6">
                You own {userNFTs.length} FuelCell{userNFTs.length !== 1 ? 's' : ''}. Select one to enter the arena.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userNFTs.map((nft) => (
                    <button
                        key={nft.tokenId}
                        onClick={() => {
                            setSelectedToken(nft.tokenId);
                            onSelectNFT(nft.tokenId, nft.journeyId);
                        }}
                        className={`bg-gradient-to-br ${getRarityColor(nft.rarity)} rounded-lg p-4 border-2 transition-all hover:scale-105 ${selectedToken === nft.tokenId ? 'ring-4 ring-white' : ''
                            }`}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-3xl">{nft.emoji}</span>
                            <span className="text-xs font-bold bg-black/30 px-2 py-1 rounded">
                                #{nft.tokenId}
                            </span>
                        </div>

                        <div className="text-left">
                            <div className="text-lg font-bold text-white mb-1">{nft.shipClass}</div>
                            <div className="text-xs text-gray-200 mb-2">
                                Journey {nft.journeyId} • {nft.rarity}
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="bg-black/30 rounded px-2 py-1">
                                    <div className="text-gray-300">HP</div>
                                    <div className="font-bold text-white">{nft.stats.hp}</div>
                                </div>
                                <div className="bg-black/30 rounded px-2 py-1">
                                    <div className="text-gray-300">SPD</div>
                                    <div className="font-bold text-white">{nft.stats.speed}</div>
                                </div>
                                <div className="bg-black/30 rounded px-2 py-1">
                                    <div className="text-gray-300">RNG</div>
                                    <div className="font-bold text-white">{nft.stats.range}</div>
                                </div>
                                <div className="bg-black/30 rounded px-2 py-1">
                                    <div className="text-gray-300">DMG</div>
                                    <div className="font-bold text-white">{nft.stats.damage}</div>
                                </div>
                            </div>
                        </div>

                        {selectedToken === nft.tokenId && (
                            <div className="mt-3 bg-white/20 rounded px-2 py-1 text-xs font-semibold text-white">
                                ✓ SELECTED
                            </div>
                        )}
                    </button>
                ))}
            </div>

            {selectedToken && (
                <div className="mt-6 bg-green-900/20 rounded-lg p-4 border border-green-500/30 text-center">
                    <p className="text-green-400 font-semibold">
                        ✓ NFT #{selectedToken} selected! Ready to join game.
                    </p>
                </div>
            )}
        </div>
    );
}
