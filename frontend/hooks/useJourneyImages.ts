'use client';

import { useCallback, useState } from 'react';
import { useConfig } from 'wagmi';
import { readContract } from '@wagmi/core';
import { ADDRESSES, JOURNEY_PHASE_MANAGER_ADDRESS } from '@/lib/constants';

// Minimal ABIs for the functions we need
const FUELCELL_TOKEN_URI_ABI = [
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'tokenURI',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

const JPM_ABI = [
  {
    inputs: [{ internalType: 'uint256', name: 'journeyId', type: 'uint256' }],
    name: 'startTokenIdInJourney',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'currentJourney',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export interface JourneyImage {
  journeyId: number;
  tokenId: number;
  metadataUrl: string;
  imageUrl: string | null;
  name?: string;
  description?: string;
}

interface NFTMetadata {
  name?: string;
  description?: string;
  image?: string;
  attributes?: { trait_type: string; value: string }[];
}

export function useJourneyImages() {
  const config = useConfig();
  const [journeyImages, setJourneyImages] = useState<Map<number, JourneyImage>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch image for a single journey
  const fetchJourneyImage = useCallback(
    async (journeyId: number): Promise<JourneyImage | null> => {
      // Check cache first
      if (journeyImages.has(journeyId)) {
        return journeyImages.get(journeyId) || null;
      }

      try {
        // Get first token ID in journey
        const startTokenId = await readContract(config, {
          address: JOURNEY_PHASE_MANAGER_ADDRESS as `0x${string}`,
          abi: JPM_ABI,
          functionName: 'startTokenIdInJourney',
          args: [BigInt(journeyId)],
        });

        if (startTokenId === BigInt(0)) {
          return null;
        }

        // Get token URI
        const tokenURI = await readContract(config, {
          address: ADDRESSES.FUELCELL_NFT as `0x${string}`,
          abi: FUELCELL_TOKEN_URI_ABI,
          functionName: 'tokenURI',
          args: [startTokenId],
        });

        // Fetch metadata from the URI
        let imageUrl: string | null = null;
        let name: string | undefined;
        let description: string | undefined;

        if (tokenURI) {
          try {
            // Handle IPFS URLs
            const fetchUrl = tokenURI.startsWith('ipfs://')
              ? tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/')
              : tokenURI;

            const response = await fetch(fetchUrl);
            const metadata: NFTMetadata = await response.json();

            imageUrl = metadata.image || null;
            name = metadata.name;
            description = metadata.description;

            // Convert IPFS image URL if needed
            if (imageUrl?.startsWith('ipfs://')) {
              imageUrl = imageUrl.replace('ipfs://', 'https://ipfs.io/ipfs/');
            }
          } catch (fetchErr) {
            console.warn(`Failed to fetch metadata for journey ${journeyId}:`, fetchErr);
          }
        }

        const journeyImage: JourneyImage = {
          journeyId,
          tokenId: Number(startTokenId),
          metadataUrl: tokenURI,
          imageUrl,
          name,
          description,
        };

        // Cache the result
        setJourneyImages(prev => new Map(prev).set(journeyId, journeyImage));

        return journeyImage;
      } catch (err) {
        console.error(`Failed to get image for journey ${journeyId}:`, err);
        return null;
      }
    },
    [config, journeyImages]
  );

  // Fetch images for all journeys up to current
  const fetchAllJourneyImages = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Get current journey
      const currentJourney = await readContract(config, {
        address: JOURNEY_PHASE_MANAGER_ADDRESS as `0x${string}`,
        abi: JPM_ABI,
        functionName: 'currentJourney',
      });

      const images = new Map<number, JourneyImage>();

      // Fetch images for all journeys (in parallel batches)
      const journeyIds = Array.from({ length: Number(currentJourney) }, (_, i) => i + 1);

      // Fetch in batches of 5 to avoid rate limiting
      for (let i = 0; i < journeyIds.length; i += 5) {
        const batch = journeyIds.slice(i, i + 5);
        const results = await Promise.all(batch.map(j => fetchJourneyImage(j)));
        results.forEach(img => {
          if (img) images.set(img.journeyId, img);
        });
      }

      setJourneyImages(images);
    } catch (err) {
      console.error('Failed to fetch journey images:', err);
      setError('Failed to fetch journey images');
    } finally {
      setLoading(false);
    }
  }, [config, fetchJourneyImage]);

  // Get image URL for a specific journey (returns cached or fetches)
  const getJourneyImageUrl = useCallback(
    async (journeyId: number): Promise<string | null> => {
      const cached = journeyImages.get(journeyId);
      if (cached) return cached.imageUrl;

      const img = await fetchJourneyImage(journeyId);
      return img?.imageUrl || null;
    },
    [journeyImages, fetchJourneyImage]
  );

  return {
    journeyImages,
    loading,
    error,
    fetchJourneyImage,
    fetchAllJourneyImages,
    getJourneyImageUrl,
  };
}

export default useJourneyImages;
