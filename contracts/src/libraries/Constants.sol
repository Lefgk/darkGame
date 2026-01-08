// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

library Constants {
    /// @notice Game board size
    uint8 internal constant BOARD_SIZE = 8;

    /// @notice Initial zone size
    uint8 internal constant INITIAL_ZONE_SIZE = 8;

    /// @notice Zone shrinks every 10 turns
    uint8 internal constant ZONE_SHRINK_INTERVAL = 10;

    /// @notice Minimum players (1 for testing, change to 5 for production)
    uint8 internal constant MIN_PLAYERS = 1;

    /// @notice Maximum players
    uint8 internal constant MAX_PLAYERS = 16;

    /// @notice Entry fee in PLS (0 for testing, change to 50 ether for production)
    uint256 internal constant ENTRY_FEE = 0 ether;

    /// @notice Bounty per kill (0 for testing, change to 25 ether for production)
    uint256 internal constant KILL_BOUNTY = 0 ether;

    /// @notice Prize percentages (basis points)
    uint16 internal constant FIRST_PLACE_BPS = 5400;  // 54%
    uint16 internal constant SECOND_PLACE_BPS = 2250; // 22.5%
    uint16 internal constant THIRD_PLACE_BPS = 1350;  // 13.5%
    uint16 internal constant PROTOCOL_FEE_BPS = 1000; // 10%

    /// @notice Turn duration in blocks (10 seconds = 1 block on PulseChain)
    uint8 internal constant TURN_DURATION_BLOCKS = 1;

    /// @notice Time limit for lobby (10 minutes = 60 blocks)
    uint16 internal constant LOBBY_TIME_LIMIT = 60;
}
