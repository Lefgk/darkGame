'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';

// Contract ABI (only the functions we need)
const NICKNAME_REGISTRY_ABI = [
  {
    name: 'getNickname',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '_wallet', type: 'address' }],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    name: 'setNickname',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: '_nickname', type: 'string' }],
    outputs: [],
  },
  {
    name: 'isAvailable',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '_nickname', type: 'string' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'getNicknames',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '_wallets', type: 'address[]' }],
    outputs: [{ name: '', type: 'string[]' }],
  },
] as const;

// Contract address on PulseChain
export const NICKNAME_REGISTRY_ADDRESS = '0x05a924cabc60C1D2d60E7eD8D523646cf6dd0F81';

interface NicknameRegistryProps {
  compact?: boolean;
}

export function NicknameRegistry({ compact = false }: NicknameRegistryProps) {
  const { address, isConnected } = useAccount();
  const [nickname, setNickname] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Read current nickname
  const { data: currentNickname, refetch: refetchNickname } = useReadContract({
    address: NICKNAME_REGISTRY_ADDRESS,
    abi: NICKNAME_REGISTRY_ABI,
    functionName: 'getNickname',
    args: address ? [address] : undefined,
    query: { enabled: !!address && NICKNAME_REGISTRY_ADDRESS !== '0x0000000000000000000000000000000000000000' },
  });

  // Check availability
  const { data: isAvailable } = useReadContract({
    address: NICKNAME_REGISTRY_ADDRESS,
    abi: NICKNAME_REGISTRY_ABI,
    functionName: 'isAvailable',
    args: nickname.length >= 3 ? [nickname] : undefined,
    query: { enabled: nickname.length >= 3 && NICKNAME_REGISTRY_ADDRESS !== '0x0000000000000000000000000000000000000000' },
  });

  // Write contract
  const { data: txHash, writeContract, isPending } = useWriteContract();

  // Wait for transaction
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Refetch nickname after successful tx
  useEffect(() => {
    if (isSuccess) {
      refetchNickname();
      setIsEditing(false);
      setNickname('');
    }
  }, [isSuccess, refetchNickname]);

  const validateNickname = (name: string): string | null => {
    if (name.length < 3) return 'Min 3 characters';
    if (name.length > 16) return 'Max 16 characters';
    if (!/^[a-zA-Z0-9_]+$/.test(name)) return 'Only letters, numbers, underscore';
    return null;
  };

  const handleSubmit = () => {
    const validationError = validateNickname(nickname);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (NICKNAME_REGISTRY_ADDRESS === '0x0000000000000000000000000000000000000000') {
      setError('Contract not deployed yet');
      return;
    }

    setError(null);
    writeContract({
      address: NICKNAME_REGISTRY_ADDRESS,
      abi: NICKNAME_REGISTRY_ABI,
      functionName: 'setNickname',
      args: [nickname],
    });
  };

  if (!isConnected) {
    return null;
  }

  // Contract not deployed - show mock UI
  if (NICKNAME_REGISTRY_ADDRESS === '0x0000000000000000000000000000000000000000') {
    return (
      <div className={`${compact ? 'p-2' : 'p-4'} bg-gray-800/50 rounded-xl border border-gray-700`}>
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm">Nickname:</span>
          <span className="text-yellow-400 font-bold">Coming Soon</span>
        </div>
        <p className="text-xs text-gray-500 mt-1">Contract deployment pending</p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {currentNickname ? (
          <>
            <span className="text-cyan-400 font-bold">{currentNickname}</span>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-xs text-gray-400 hover:text-white"
            >
              edit
            </button>
          </>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm text-purple-400 hover:text-purple-300"
          >
            + Set Nickname
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700">
      <h4 className="text-sm font-bold text-gray-300 mb-3">Your Nickname</h4>

      {!isEditing && currentNickname ? (
        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold text-cyan-400">{currentNickname}</span>
            <p className="text-xs text-gray-500 mt-1">{address}</p>
          </div>
          <button
            onClick={() => {
              setIsEditing(true);
              setNickname(currentNickname);
            }}
            className="text-sm text-purple-400 hover:text-purple-300 px-3 py-1 rounded border border-purple-500/30 hover:border-purple-500"
          >
            Change
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <input
              type="text"
              value={nickname}
              onChange={(e) => {
                setNickname(e.target.value);
                setError(null);
              }}
              placeholder="Enter nickname..."
              maxLength={16}
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none"
            />
            <div className="flex justify-between mt-1 text-xs">
              <span className={error ? 'text-red-400' : 'text-gray-500'}>
                {error || `${nickname.length}/16 characters`}
              </span>
              {nickname.length >= 3 && (
                <span className={isAvailable ? 'text-green-400' : 'text-red-400'}>
                  {isAvailable ? 'Available' : 'Taken'}
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={isPending || isConfirming || !isAvailable}
              className={`flex-1 py-2 rounded-lg font-bold transition-all ${
                isPending || isConfirming
                  ? 'bg-gray-600 text-gray-400 cursor-wait'
                  : isAvailable
                  ? 'bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isPending ? 'Confirm in wallet...' : isConfirming ? 'Confirming...' : 'Save Nickname'}
            </button>
            {(isEditing || currentNickname) && (
              <button
                onClick={() => {
                  setIsEditing(false);
                  setNickname('');
                  setError(null);
                }}
                className="px-4 py-2 rounded-lg border border-gray-600 text-gray-400 hover:text-white hover:border-gray-500"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Hook to get nickname for any address
export function useNickname(address: string | undefined) {
  const { data } = useReadContract({
    address: NICKNAME_REGISTRY_ADDRESS,
    abi: NICKNAME_REGISTRY_ABI,
    functionName: 'getNickname',
    args: address ? [address as `0x${string}`] : undefined,
    query: { enabled: !!address && NICKNAME_REGISTRY_ADDRESS !== '0x0000000000000000000000000000000000000000' },
  });

  return data || null;
}

// Hook to get multiple nicknames
export function useNicknames(addresses: string[]) {
  const { data } = useReadContract({
    address: NICKNAME_REGISTRY_ADDRESS,
    abi: NICKNAME_REGISTRY_ABI,
    functionName: 'getNicknames',
    args: addresses.length > 0 ? [addresses as `0x${string}`[]] : undefined,
    query: { enabled: addresses.length > 0 && NICKNAME_REGISTRY_ADDRESS !== '0x0000000000000000000000000000000000000000' },
  });

  // Return a map of address -> nickname
  const nicknameMap = new Map<string, string>();
  if (data && addresses.length === data.length) {
    addresses.forEach((addr, i) => {
      if (data[i]) {
        nicknameMap.set(addr.toLowerCase(), data[i]);
      }
    });
  }

  return nicknameMap;
}

// Helper to format address or nickname
export function formatPlayerName(address: string, nickname?: string | null, truncate = false): string {
  if (nickname) return nickname;
  if (truncate) return `${address.slice(0, 6)}...${address.slice(-4)}`;
  return address;
}
