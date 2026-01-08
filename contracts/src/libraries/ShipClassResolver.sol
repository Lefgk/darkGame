// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Types} from "./Types.sol";

library ShipClassResolver {
    /// @notice Determine ship class based on FuelCell NFT journey ID
    /// @dev Journey ID maps to rarity which determines ship class
    /// @param journeyId The journey ID from the FuelCell NFT
    /// @return shipClass The ship class for that journey
    function getShipClassFromJourney(uint256 journeyId) internal pure returns (Types.ShipClass) {
        // Journey 1-2: Titan (Legendary - Rarest)
        if (journeyId <= 2) {
            return Types.ShipClass.Titan;
        }
        // Journey 3-5: Dreadnought (Epic)
        else if (journeyId <= 5) {
            return Types.ShipClass.Dreadnought;
        }
        // Journey 6-10: Cruiser (Rare)
        else if (journeyId <= 10) {
            return Types.ShipClass.Cruiser;
        }
        // Journey 11-20: Frigate (Uncommon)
        else if (journeyId <= 20) {
            return Types.ShipClass.Frigate;
        }
        // Journey 21+: Fighter (Common)
        else {
            return Types.ShipClass.Fighter;
        }
    }

    /// @notice Get rarity name for a journey ID
    function getRarityName(uint256 journeyId) internal pure returns (string memory) {
        if (journeyId <= 2) return "Legendary";
        if (journeyId <= 5) return "Epic";
        if (journeyId <= 10) return "Rare";
        if (journeyId <= 20) return "Uncommon";
        return "Common";
    }
}
