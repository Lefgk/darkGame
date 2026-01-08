// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

library Types {
    /// @notice Ship class types
    enum ShipClass {
        Titan,      // 500 HP, 2 Speed, 2 Range, 50 DMG
        Dreadnought,// 350 HP, 3 Speed, 3 Range, 40 DMG
        Cruiser,    // 200 HP, 4 Speed, 2 Range, 30 DMG
        Frigate,    // 120 HP, 5 Speed, 2 Range, 20 DMG
        Fighter     // 50 HP,  6 Speed, 1 Range, 15 DMG
    }

    /// @notice Weapon types
    enum WeaponType {
        Melee,      // Adjacent tiles
        Ranged,     // Based on ship range
        AOE,        // Area of Effect
        Piercing    // Ignores armor
    }

    /// @notice Game state
    enum GameState {
        Lobby,
        Active,
        Finished
    }

    /// @notice Ship stats
    struct ShipStats {
        uint16 maxHP;
        uint8 speed;
        uint8 range;
        uint8 damage;
    }

    /// @notice Player ship data
    struct Ship {
        address player;
        ShipClass shipClass;
        uint16 currentHP;
        uint8 x;
        uint8 y;
        bool isAlive;
        uint16 kills;
        uint16 damageDealt;
        bool hasActed;
    }

    /// @notice Loot drop
    struct Loot {
        uint8 x;
        uint8 y;
        uint16 amount; // In PLS
        bool collected;
    }

    /// @notice Game data
    struct GameData {
        uint256 gameId;
        GameState state;
        uint8 turn;
        uint8 zoneSize;
        uint256 prizePool;
        uint256 startTime;
        uint8 playerCount;
        uint8 playersAlive;
        address winner;
        address secondPlace;
        address thirdPlace;
    }

    /// @notice Player action
    struct Action {
        uint8 targetX;
        uint8 targetY;
        bool isAttack;
    }
}
