// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../src/DarkArena.sol";

contract DeployDarkArena is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address treasury = vm.envAddress("TREASURY_ADDRESS");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy Dark Arena
        DarkArena arena = new DarkArena(treasury);
        
        console.log("Dark Arena deployed at:", address(arena));
        console.log("Treasury:", treasury);
        console.log("FuelCell NFT:", address(arena.fuelCellNFT()));
        
        vm.stopBroadcast();
    }
}
