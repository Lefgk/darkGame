'use client';

import { useAccount } from 'wagmi';
import { ADDRESSES, JOURNEY_PHASE_MANAGER_ADDRESS } from '@/lib/constants';
import { useState, useEffect } from 'react';

interface FuelCellNFT {
    tokenId: number;
    journeyId: number;
    shipClass: string;
    rarity: string;
    image: string;
}

// PulseScan API base URL
const PULSESCAN_API = 'https://api.scan.pulsechain.com/api/v2';

export function NFTShipSelector({ onSelectNFT }: { onSelectNFT: (tokenId: number, journeyId: number) => void }) {
    const { address, isConnected } = useAccount();
    const [selectedToken, setSelectedToken] = useState<number | null>(null);
    const [userNFTs, setUserNFTs] = useState<FuelCellNFT[]>([]);
    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    const getShipFromJourney = (journeyId: number) => {
        if (journeyId <= 2) {
            return { shipClass: 'Titan', rarity: 'Legendary' };
        } else if (journeyId <= 5) {
            return { shipClass: 'Dreadnought', rarity: 'Epic' };
        } else if (journeyId <= 10) {
            return { shipClass: 'Cruiser', rarity: 'Rare' };
        } else if (journeyId <= 20) {
            return { shipClass: 'Frigate', rarity: 'Uncommon' };
        } else {
            return { shipClass: 'Fighter', rarity: 'Common' };
        }
    };

    const getRarityColor = (rarity: string) => {
        switch (rarity) {
            case 'Legendary': return 'border-yellow-500 bg-yellow-500/10';
            case 'Epic': return 'border-purple-500 bg-purple-500/10';
            case 'Rare': return 'border-blue-500 bg-blue-500/10';
            case 'Uncommon': return 'border-green-500 bg-green-500/10';
            default: return 'border-gray-500 bg-gray-500/10';
        }
    };

    const getRarityTextColor = (rarity: string) => {
        switch (rarity) {
            case 'Legendary': return 'text-yellow-400';
            case 'Epic': return 'text-purple-400';
            case 'Rare': return 'text-blue-400';
            case 'Uncommon': return 'text-green-400';
            default: return 'text-gray-400';
        }
    };

    // Get journey for a token ID by checking JourneyPhaseManager ranges
    const getJourneyForToken = async (tokenId: number): Promise<number> => {
        // Pre-computed function selectors
        const startSelector = 'd171b63e'; // startTokenIdInJourney(uint256)
        const endSelector = '756895dc';   // lastTokenIdInJourney(uint256)

        // Check journeys 1-33 to find which one contains this tokenId
        for (let journey = 1; journey <= 33; journey++) {
            try {
                const startRes = await fetch('http://127.0.0.1:8545', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        jsonrpc: '2.0',
                        id: journey,
                        method: 'eth_call',
                        params: [{
                            to: JOURNEY_PHASE_MANAGER_ADDRESS,
                            data: `0x${startSelector}${journey.toString(16).padStart(64, '0')}`
                        }, 'latest']
                    })
                });
                const startData = await startRes.json();
                const startTokenId = parseInt(startData.result || '0', 16);

                if (startTokenId === 0) continue;

                const endRes = await fetch('http://127.0.0.1:8545', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        jsonrpc: '2.0',
                        id: journey + 100,
                        method: 'eth_call',
                        params: [{
                            to: JOURNEY_PHASE_MANAGER_ADDRESS,
                            data: `0x${endSelector}${journey.toString(16).padStart(64, '0')}`
                        }, 'latest']
                    })
                });
                const endData = await endRes.json();
                const lastTokenId = parseInt(endData.result || '0', 16);

                if (tokenId >= startTokenId && tokenId <= lastTokenId) {
                    return journey;
                }
            } catch (e) {
                console.error('Error checking journey', journey, e);
            }
        }
        return 1;
    };

    // Fetch NFTs using PulseScan API
    useEffect(() => {
        if (!mounted || !address) {
            setUserNFTs([]);
            return;
        }

        const fetchNFTs = async () => {
            setLoading(true);
            setError(null);

            try {
                // Use PulseScan API to get NFTs owned by address
                const response = await fetch(
                    `${PULSESCAN_API}/addresses/${address}/nft?type=ERC-721`
                );

                if (!response.ok) {
                    throw new Error(`API error: ${response.status}`);
                }

                const data = await response.json();

                // Filter for FuelCell NFTs only
                const fuelCellNFTs = (data.items || []).filter(
                    (item: { token?: { address_hash?: string } }) =>
                        item.token?.address_hash?.toLowerCase() === ADDRESSES.FUELCELL_NFT.toLowerCase()
                );

                if (fuelCellNFTs.length === 0) {
                    setUserNFTs([]);
                    setLoading(false);
                    return;
                }

                // Process each FuelCell NFT
                const nfts: FuelCellNFT[] = [];

                for (const item of fuelCellNFTs.slice(0, 20)) {
                    const tokenId = parseInt(item.id, 10);

                    // Get image from metadata
                    let image = item.image_url || item.metadata?.image || item.metadata?.image_url || '';
                    if (image.startsWith('ipfs://')) {
                        image = image.replace('ipfs://', 'https://ipfs.io/ipfs/');
                    }

                    // Try to get journey from metadata attributes
                    let journeyId = 1;
                    const journeyAttr = item.metadata?.attributes?.find(
                        (a: { trait_type?: string; value?: unknown }) =>
                            a.trait_type?.toLowerCase() === 'journey'
                    );
                    if (journeyAttr?.value) {
                        journeyId = Number(journeyAttr.value);
                    } else {
                        // Fallback: fetch journey from contract
                        journeyId = await getJourneyForToken(tokenId);
                    }

                    const shipData = getShipFromJourney(journeyId);
                    nfts.push({
                        tokenId,
                        journeyId,
                        image,
                        ...shipData
                    });
                }

                // Sort by tokenId
                nfts.sort((a, b) => a.tokenId - b.tokenId);
                setUserNFTs(nfts);

            } catch (e) {
                console.error('Error fetching NFTs:', e);
                setError('Failed to load NFTs from API');
            } finally {
                setLoading(false);
            }
        };

        fetchNFTs();
    }, [mounted, address]);

    // Loading states
    if (!mounted) {
        return (
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10 text-center">
                <div className="animate-pulse text-2xl">⏳</div>
                <p className="text-gray-400 text-sm mt-2">Loading...</p>
            </div>
        );
    }

    if (!isConnected) {
        return (
            <div className="bg-yellow-500/10 rounded-2xl p-6 border border-yellow-500/20 text-center">
                <div className="text-2xl mb-2">⚠️</div>
                <p className="text-yellow-400 font-bold">Connect Wallet</p>
                <p className="text-gray-400 text-sm">Connect your wallet to see NFTs</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10 text-center">
                <div className="animate-spin text-2xl">⚙️</div>
                <p className="text-gray-400 text-sm mt-2">Loading NFTs from PulseScan...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-500/10 rounded-2xl p-6 border border-red-500/20 text-center">
                <div className="text-2xl mb-2">❌</div>
                <p className="text-red-400 font-bold">Error Loading NFTs</p>
                <p className="text-gray-400 text-sm">{error}</p>
            </div>
        );
    }

    if (userNFTs.length === 0) {
        return (
            <div className="bg-red-500/10 rounded-2xl p-6 border border-red-500/20 text-center">
                <div className="text-2xl mb-2">🚫</div>
                <p className="text-red-400 font-bold">No FuelCell NFTs</p>
                <p className="text-gray-400 text-sm mb-3">You need a FuelCell to play</p>
                <a
                    href="https://fuelcell.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold py-2 px-4 rounded-lg"
                >
                    Get FuelCell →
                </a>
            </div>
        );
    }

    return (
        <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-white">
                    Your FuelCells <span className="text-purple-400">({userNFTs.length})</span>
                </h3>
                {selectedToken && (
                    <span className="text-green-400 text-sm">✓ #{selectedToken}</span>
                )}
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                {userNFTs.map((nft) => (
                    <button
                        key={nft.tokenId}
                        onClick={() => {
                            setSelectedToken(nft.tokenId);
                            onSelectNFT(nft.tokenId, nft.journeyId);
                        }}
                        className={`relative rounded-lg border-2 overflow-hidden transition-all hover:scale-105 ${
                            selectedToken === nft.tokenId
                                ? 'ring-2 ring-white border-white'
                                : getRarityColor(nft.rarity)
                        }`}
                    >
                        <div className="aspect-square bg-gray-800 relative">
                            {nft.image ? (
                                <img
                                    src={nft.image}
                                    alt={`#${nft.tokenId}`}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-2xl bg-gradient-to-br from-purple-900/50 to-pink-900/50">
                                    🚀
                                </div>
                            )}
                            <div className="absolute top-1 left-1 bg-black/80 px-1 py-0.5 rounded text-[10px] font-bold text-white">
                                #{nft.tokenId}
                            </div>
                            {selectedToken === nft.tokenId && (
                                <div className="absolute top-1 right-1 bg-green-500 w-4 h-4 rounded-full flex items-center justify-center text-[10px]">
                                    ✓
                                </div>
                            )}
                        </div>
                        <div className="p-1 bg-black/60 text-center">
                            <div className={`text-[10px] font-bold ${getRarityTextColor(nft.rarity)}`}>
                                J{nft.journeyId} - {nft.shipClass}
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
