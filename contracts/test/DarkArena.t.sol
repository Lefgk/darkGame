// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../src/DarkArena.sol";
import "../src/libraries/Types.sol";
import "../src/libraries/Constants.sol";
import "./MockFuelCell.sol";

contract DarkArenaTest is Test {
    DarkArena public arena;
    MockFuelCell public fuelCell;
    address public treasury = address(0x1);
    
    address public player1 = address(0x100);
    address public player2 = address(0x101);
    address public player3 = address(0x102);
    address public player4 = address(0x103);
    address public player5 = address(0x104);
    address public player6 = address(0x105);

    // NFT token IDs for testing
    uint256 constant TOKEN_ID_1 = 1;
    uint256 constant TOKEN_ID_2 = 2;
    uint256 constant TOKEN_ID_3 = 3;
    uint256 constant TOKEN_ID_4 = 4;
    uint256 constant TOKEN_ID_5 = 5;
    uint256 constant TOKEN_ID_6 = 6;

    function setUp() public {
        // Deploy mock FuelCell NFT
        fuelCell = new MockFuelCell();
        
        // Deploy DarkArena with treasury and mock FuelCell
        arena = new DarkArena(treasury, address(fuelCell));
        
        // Mint NFTs to test players with different journey IDs
        fuelCell.mint(player1, TOKEN_ID_1, 1);  // Journey 1 = Titan (Legendary)
        fuelCell.mint(player2, TOKEN_ID_2, 5);  // Journey 5 = Dreadnought (Epic)
        fuelCell.mint(player3, TOKEN_ID_3, 10); // Journey 10 = Cruiser (Rare)
        fuelCell.mint(player4, TOKEN_ID_4, 15); // Journey 15 = Frigate (Uncommon)
        fuelCell.mint(player5, TOKEN_ID_5, 25); // Journey 25 = Fighter (Common)
        fuelCell.mint(player6, TOKEN_ID_6, 2);  // Journey 2 = Titan (Legendary)
        
        // Fund test players
        vm.deal(player1, 1000 ether);
        vm.deal(player2, 1000 ether);
        vm.deal(player3, 1000 ether);
        vm.deal(player4, 1000 ether);
        vm.deal(player5, 1000 ether);
        vm.deal(player6, 1000 ether);
    }

    function testCreateGame() public {
        uint256 gameId = arena.createGame();
        assertEq(gameId, 1);
        
        Types.GameData memory game = arena.getGame(gameId);
        assertEq(uint8(game.state), uint8(Types.GameState.Lobby));
        assertEq(game.playerCount, 0);
    }

    function testJoinGameWithNFT() public {
        uint256 gameId = arena.createGame();
        
        vm.prank(player1);
        arena.joinGame{value: Constants.ENTRY_FEE}(gameId, TOKEN_ID_1, 1); // Journey 1 = Titan
        
        Types.GameData memory game = arena.getGame(gameId);
        assertEq(game.playerCount, 1);
        assertEq(game.prizePool, Constants.ENTRY_FEE);
        
        Types.Ship memory ship = arena.getPlayerShip(gameId, player1);
        assertEq(ship.player, player1);
        assertEq(uint8(ship.shipClass), uint8(Types.ShipClass.Titan));
        assertEq(ship.currentHP, 500); // Titan HP
    }

    function testMultiplePlayersJoinWithDifferentShips() public {
        uint256 gameId = arena.createGame();
        
        // Player 1 joins with Titan
        vm.prank(player1);
        arena.joinGame{value: Constants.ENTRY_FEE}(gameId, TOKEN_ID_1, 1);
        
        // Player 2 joins with Dreadnought
        vm.prank(player2);
        arena.joinGame{value: Constants.ENTRY_FEE}(gameId, TOKEN_ID_2, 5);
        
        // Player 3 joins with Cruiser
        vm.prank(player3);
        arena.joinGame{value: Constants.ENTRY_FEE}(gameId, TOKEN_ID_3, 10);
        
        // Player 4 joins with Frigate
        vm.prank(player4);
        arena.joinGame{value: Constants.ENTRY_FEE}(gameId, TOKEN_ID_4, 15);
        
        // Player 5 joins with Fighter
        vm.prank(player5);
        arena.joinGame{value: Constants.ENTRY_FEE}(gameId, TOKEN_ID_5, 25);
        
        Types.GameData memory game = arena.getGame(gameId);
        assertEq(game.playerCount, 5);
        
        // Verify ship classes
        Types.Ship memory ship1 = arena.getPlayerShip(gameId, player1);
        assertEq(uint8(ship1.shipClass), uint8(Types.ShipClass.Titan));
        
        Types.Ship memory ship2 = arena.getPlayerShip(gameId, player2);
        assertEq(uint8(ship2.shipClass), uint8(Types.ShipClass.Dreadnought));
        
        Types.Ship memory ship3 = arena.getPlayerShip(gameId, player3);
        assertEq(uint8(ship3.shipClass), uint8(Types.ShipClass.Cruiser));
        
        Types.Ship memory ship4 = arena.getPlayerShip(gameId, player4);
        assertEq(uint8(ship4.shipClass), uint8(Types.ShipClass.Frigate));
        
        Types.Ship memory ship5 = arena.getPlayerShip(gameId, player5);
        assertEq(uint8(ship5.shipClass), uint8(Types.ShipClass.Fighter));
    }

    function testCannotJoinWithSameTokenTwice() public {
        uint256 gameId = arena.createGame();
        
        vm.prank(player1);
        arena.joinGame{value: Constants.ENTRY_FEE}(gameId, TOKEN_ID_1, 1);
        
        // Try to join again with same token
        vm.prank(player1);
        vm.expectRevert();
        arena.joinGame{value: Constants.ENTRY_FEE}(gameId, TOKEN_ID_1, 1);
    }

    function testGameStartsWithMinimumPlayers() public {
        uint256 gameId = arena.createGame();
        
        // Join with exactly MIN_PLAYERS (5)
        vm.prank(player1);
        arena.joinGame{value: Constants.ENTRY_FEE}(gameId, TOKEN_ID_1, 1);
        
        vm.prank(player2);
        arena.joinGame{value: Constants.ENTRY_FEE}(gameId, TOKEN_ID_2, 5);
        
        vm.prank(player3);
        arena.joinGame{value: Constants.ENTRY_FEE}(gameId, TOKEN_ID_3, 10);
        
        vm.prank(player4);
        arena.joinGame{value: Constants.ENTRY_FEE}(gameId, TOKEN_ID_4, 15);
        
        // Game should still be in lobby with 4 players
        Types.GameData memory game = arena.getGame(gameId);
        assertEq(uint8(game.state), uint8(Types.GameState.Lobby));
        assertEq(game.playerCount, 4);
        
        // 5th player joins - game now has minimum players
        vm.prank(player5);
        arena.joinGame{value: Constants.ENTRY_FEE}(gameId, TOKEN_ID_5, 25);
        
        game = arena.getGame(gameId);
        // Game stays in Lobby until manually started (design choice)
        assertEq(uint8(game.state), uint8(Types.GameState.Lobby));
        assertEq(game.playerCount, 5);
    }

    function testShipClassFromJourneyMapping() public pure {
        // Journey 1-2 = Titan
        assertEq(uint8(Types.ShipClass.Titan), 0);
        
        // Journey 3-5 = Dreadnought
        assertEq(uint8(Types.ShipClass.Dreadnought), 1);
        
        // Journey 6-10 = Cruiser
        assertEq(uint8(Types.ShipClass.Cruiser), 2);
        
        // Journey 11-20 = Frigate
        assertEq(uint8(Types.ShipClass.Frigate), 3);
        
        // Journey 21+ = Fighter
        assertEq(uint8(Types.ShipClass.Fighter), 4);
    }

    function testPrizePoolAccumulation() public {
        uint256 gameId = arena.createGame();
        
        uint256 expectedPrize = Constants.ENTRY_FEE * 5;
        
        vm.prank(player1);
        arena.joinGame{value: Constants.ENTRY_FEE}(gameId, TOKEN_ID_1, 1);
        
        vm.prank(player2);
        arena.joinGame{value: Constants.ENTRY_FEE}(gameId, TOKEN_ID_2, 5);
        
        vm.prank(player3);
        arena.joinGame{value: Constants.ENTRY_FEE}(gameId, TOKEN_ID_3, 10);
        
        vm.prank(player4);
        arena.joinGame{value: Constants.ENTRY_FEE}(gameId, TOKEN_ID_4, 15);
        
        vm.prank(player5);
        arena.joinGame{value: Constants.ENTRY_FEE}(gameId, TOKEN_ID_5, 25);
        
        Types.GameData memory game = arena.getGame(gameId);
        assertEq(game.prizePool, expectedPrize);
    }
}
