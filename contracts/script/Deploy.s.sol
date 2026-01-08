// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../src/DarkArena.sol";
import "../src/libraries/Addresses.sol";

contract DeployDarkArena is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address treasury = vm.envAddress("TREASURY_ADDRESS");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy Dark Arena with real FuelCell NFT address
        // FuelCell NFT: 0xb18D8af16f3Ef44B790d214AB4e3a42Dfe8c3c34
        DarkArena arena = new DarkArena(treasury, 0xb18D8af16f3Ef44B790d214AB4e3a42Dfe8c3c34);
        
        console.log("Dark Arena deployed at:", address(arena));
        console.log("Treasury:", treasury);
        console.log("FuelCell NFT:", address(arena.fuelCellNFT()));
        
        vm.stopBroadcast();
    }
}
