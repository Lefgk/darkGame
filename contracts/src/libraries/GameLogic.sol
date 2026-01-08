// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Types} from "./Types.sol";
import {Constants} from "./Constants.sol";

library GameLogic {
    /// @notice Get ship stats for a given class
    function getShipStats(Types.ShipClass shipClass) internal pure returns (Types.ShipStats memory) {
        if (shipClass == Types.ShipClass.Titan) {
            return Types.ShipStats({maxHP: 500, speed: 2, range: 2, damage: 50});
        } else if (shipClass == Types.ShipClass.Dreadnought) {
            return Types.ShipStats({maxHP: 350, speed: 3, range: 3, damage: 40});
        } else if (shipClass == Types.ShipClass.Cruiser) {
            return Types.ShipStats({maxHP: 200, speed: 4, range: 2, damage: 30});
        } else if (shipClass == Types.ShipClass.Frigate) {
            return Types.ShipStats({maxHP: 120, speed: 5, range: 2, damage: 20});
        } else {
            // Fighter
            return Types.ShipStats({maxHP: 50, speed: 6, range: 1, damage: 15});
        }
    }

    /// @notice Calculate distance between two points
    function distance(uint8 x1, uint8 y1, uint8 x2, uint8 y2) internal pure returns (uint8) {
        uint8 dx = x1 > x2 ? x1 - x2 : x2 - x1;
        uint8 dy = y1 > y2 ? y1 - y2 : y2 - y1;
        return dx > dy ? dx : dy; // Chebyshev distance (max of dx, dy)
    }

    /// @notice Check if position is within zone
    function isInZone(uint8 x, uint8 y, uint8 zoneSize) internal pure returns (bool) {
        uint8 offset = (Constants.BOARD_SIZE - zoneSize) / 2;
        return x >= offset && x < offset + zoneSize && y >= offset && y < offset + zoneSize;
    }

    /// @notice Calculate zone size for a given turn
    function calculateZoneSize(uint8 turn) internal pure returns (uint8) {
        uint8 shrinks = turn / Constants.ZONE_SHRINK_INTERVAL;
        if (shrinks >= Constants.INITIAL_ZONE_SIZE) {
            return 0;
        }
        return Constants.INITIAL_ZONE_SIZE - shrinks;
    }

    /// @notice Generate random seed for a game
    function generateSeed(
        uint256 gameId,
        address[] memory players
    ) internal view returns (uint256) {
        bytes32 hash = keccak256(
            abi.encodePacked(
                block.prevrandao,
                block.timestamp,
                gameId,
                players
            )
        );
        return uint256(hash);
    }

    /// @notice Generate random position within zone
    function randomPosition(
        uint256 seed,
        uint256 nonce,
        uint8 zoneSize
    ) internal pure returns (uint8 x, uint8 y) {
        uint8 offset = (Constants.BOARD_SIZE - zoneSize) / 2;
        uint256 hash = uint256(keccak256(abi.encodePacked(seed, nonce)));
        x = offset + uint8(hash % zoneSize);
        y = offset + uint8((hash >> 8) % zoneSize);
    }

    /// @notice Check if move is valid
    function isValidMove(
        uint8 fromX,
        uint8 fromY,
        uint8 toX,
        uint8 toY,
        uint8 speed,
        uint8 zoneSize
    ) internal pure returns (bool) {
        // Check if destination is in zone
        if (!isInZone(toX, toY, zoneSize)) {
            return false;
        }
        
        // Check if distance is within speed
        uint8 dist = distance(fromX, fromY, toX, toY);
        return dist <= speed;
    }

    /// @notice Check if attack is valid
    function isValidAttack(
        uint8 attackerX,
        uint8 attackerY,
        uint8 targetX,
        uint8 targetY,
        uint8 range
    ) internal pure returns (bool) {
        uint8 dist = distance(attackerX, attackerY, targetX, targetY);
        return dist <= range && dist > 0;
    }

    /// @notice Calculate damage (basic implementation, can be extended)
    function calculateDamage(
        uint8 baseDamage,
        uint256 seed,
        uint256 nonce
    ) internal pure returns (uint16) {
        // Add 10% variance
        uint256 hash = uint256(keccak256(abi.encodePacked(seed, nonce)));
        int8 variance = int8(uint8(hash % 21)) - 10; // -10% to +10%
        int16 damage = int16(uint16(baseDamage)) + ((int16(uint16(baseDamage)) * int16(variance)) / 100);
        return damage > 0 ? uint16(damage) : 1;
    }
}
