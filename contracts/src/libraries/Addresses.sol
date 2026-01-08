// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title Addresses
/// @notice Contains all important contract addresses for Dark Arena
library Addresses {
    /// @notice FuelCell NFT contract address (required to play)
    /// @dev Players must hold at least 1 FuelCell to enter games
    address internal constant FUELCELL_NFT = 0xb18D8af16f3Ef44B790d214AB4e3a42Dfe8c3c34;

    /// @notice Dark Token contract address
    /// @dev Native token for the Dark ecosystem
    address internal constant DARK_TOKEN = 0x1578F4De7fCb3Ac9e8925ac690228EDcA3BBc7c5;
}
