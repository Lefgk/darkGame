// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../src/DarkArena.sol";
import "../src/libraries/Addresses.sol";

contract DeployDarkArena is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        // Use deployer as treasury (receives 10% protocol fees)
        address treasury = deployer;

        vm.startBroadcast(deployerPrivateKey);

        // Deploy Dark Arena with real FuelCell NFT address
        // FuelCell NFT: 0x2187816076a1a129d03b4c14c88983AAf54052e3
        DarkArena arena = new DarkArena(treasury, 0x2187816076a1a129d03b4c14c88983AAf54052e3);

        console.log("Dark Arena deployed at:", address(arena));
        console.log("Treasury:", treasury);
        console.log("FuelCell NFT:", address(arena.fuelCellNFT()));

        vm.stopBroadcast();
    }
}
