/**
 * API URL for game server
 */
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Contract addresses for Dark Arena on PulseChain
 */

export const ADDRESSES = {
    // FuelCell NFT - Required to play Dark Arena
    FUELCELL_NFT: '0x2187816076a1a129d03b4c14c88983AAf54052e3',

    // Dark Token - Native token for Dark ecosystem
    DARK_TOKEN: '0x1578F4De7fCb3Ac9e8925ac690228EDcA3BBc7c5',

    // Dark Arena Game Contract
    DARK_ARENA: '0xC39aA0848F3a43f6b87fd1b275a91c7AcAFE52DE',

    // Treasury address (for protocol fees)
    TREASURY: '0x9007485D1791793c857E1dCAF405e3cf2477Ef84',
} as const;

// JourneyPhaseManager contract (tracks journey/token ID ranges)
export const JOURNEY_PHASE_MANAGER_ADDRESS = '0xb2561655DAF1DE668F0240aCC6Cb9fb6f2b0450E';

/**
 * PulseChain network configuration
 */
export const PULSECHAIN_CONFIG = {
    chainId: 369,
    name: 'PulseChain',
    nativeCurrency: {
        name: 'Pulse',
        symbol: 'PLS',
        decimals: 18,
    },
    rpcUrls: {
        default: { http: ['https://rpc.pulsechain.com'] },
        public: { http: ['https://rpc.pulsechain.com'] },
    },
    blockExplorers: {
        default: { name: 'PulseScan', url: 'https://scan.pulsechain.com' },
    },
} as const;

/**
 * Game constants
 */
export const GAME_CONFIG = {
    ENTRY_FEE: '0', // PLS (0 for testing, change to 50 for production)
    KILL_BOUNTY: '0', // PLS (0 for testing, change to 25 for production)
    MIN_PLAYERS: 1, // 1 for testing, change to 5 for production
    MAX_PLAYERS: 16,
    BOARD_SIZE: 8,
    TURN_DURATION: 10, // seconds
    LOBBY_TIMEOUT: 600, // seconds (10 minutes)

    // Prize distribution (basis points)
    PRIZE_DISTRIBUTION: {
        FIRST: 5400,  // 54%
        SECOND: 2250, // 22.5%
        THIRD: 1350,  // 13.5%
        PROTOCOL: 1000, // 10%
    },
} as const;

/**
 * Ship class data
 */
export const SHIP_CLASSES = {
    TITAN: { id: 0, name: 'Titan', hp: 500, speed: 2, range: 2, damage: 50 },
    DREADNOUGHT: { id: 1, name: 'Dreadnought', hp: 350, speed: 3, range: 3, damage: 40 },
    CRUISER: { id: 2, name: 'Cruiser', hp: 200, speed: 4, range: 2, damage: 30 },
    FRIGATE: { id: 3, name: 'Frigate', hp: 120, speed: 5, range: 2, damage: 20 },
    FIGHTER: { id: 4, name: 'Fighter', hp: 50, speed: 6, range: 1, damage: 15 },
} as const;
