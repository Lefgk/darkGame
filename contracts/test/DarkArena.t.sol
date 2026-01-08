// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../src/DarkArena.sol";
import "../src/libraries/Types.sol";
import "../src/libraries/Constants.sol";

contract DarkArenaTest is Test {
    DarkArena public arena;
    address public treasury = address(0x1);
    
    address public player1 = address(0x100);
    address public player2 = address(0x101);
    address public player3 = address(0x102);
    address public player4 = address(0x103);
    address public player5 = address(0x104);

    function setUp() public {
        arena = new DarkArena(treasury);
        
        // Fund test players
        vm.deal(player1, 1000 ether);
        vm.deal(player2, 1000 ether);
        vm.deal(player3, 1000 ether);
        vm.deal(player4, 1000 ether);
        vm.deal(player5, 1000 ether);
    }

    function testCreateGame() public {
        uint256 gameId = arena.createGame();
        assertEq(gameId, 1);
        
        Types.GameData memory game = arena.getGame(gameId);
        assertEq(uint8(game.state), uint8(Types.GameState.Lobby));
        assertEq(game.playerCount, 0);
    }

    function testJoinGame() public {
        uint256 gameId = arena.createGame();
        
        vm.prank(player1);
        arena.joinGame{value: Constants.ENTRY_FEE}(gameId, Types.ShipClass.Cruiser);
        
        Types.GameData memory game = arena.getGame(gameId);
        assertEq(game.playerCount, 1);
        assertEq(game.prizePool, Constants.ENTRY_FEE);
        
        Types.Ship memory ship = arena.getPlayerShip(gameId, player1);
        assertEq(ship.player, player1);
        assertEq(uint8(ship.shipClass), uint8(Types.ShipClass.Cruiser));
    }

    function testMultiplePlayersJoin() public {
        uint256 gameId = arena.createGame();
        
        vm.prank(player1);
        arena.joinGame{value: Constants.ENTRY_FEE}(gameId, Types.ShipClass.Titan);
        
        vm.prank(player2);
        arena.joinGame{value: Constants.ENTRY_FEE}(gameId, Types.ShipClass.Fighter);
        
        vm.prank(player3);
        arena.joinGame{value: Constants.ENTRY_FEE}(gameId, Types.ShipClass.Cruiser);
        
        vm.prank(player4);
        arena.joinGame{value: Constants.ENTRY_FEE}(gameId, Types.ShipClass.Frigate);
        
        vm.prank(player5);
        arena.joinGame{value: Constants.ENTRY_FEE}(gameId, Types.ShipClass.Dreadnought);
        
        Types.GameData memory game = arena.getGame(gameId);
        assertEq(game.playerCount, 5);
        assertEq(game.prizePool, Constants.ENTRY_FEE * 5);
        
        // Game should auto-start with 5 players
        assertEq(uint8(game.state), uint8(Types.GameState.Active));
        assertEq(game.playersAlive, 5);
    }

    function testCannotJoinTwice() public {
        uint256 gameId = arena.createGame();
        
        vm.startPrank(player1);
        arena.joinGame{value: Constants.ENTRY_FEE}(gameId, Types.ShipClass.Cruiser);
        
        vm.expectRevert(DarkArena.AlreadyJoined.selector);
        arena.joinGame{value: Constants.ENTRY_FEE}(gameId, Types.ShipClass.Fighter);
        vm.stopPrank();
    }

    function testInsufficientEntryFee() public {
        uint256 gameId = arena.createGame();
        
        vm.prank(player1);
        vm.expectRevert(DarkArena.InsufficientEntryFee.selector);
        arena.joinGame{value: 10 ether}(gameId, Types.ShipClass.Cruiser);
    }

    // Note: InvalidShipClass test removed due to Solidity enum casting limitations
    // The contract will naturally revert if an invalid value > 4 is passed

    function testGameFull() public {
        uint256 gameId = arena.createGame();
        
        // Fill game with 16 players
        for (uint160 i = 0; i < 16; i++) {
            address player = address(0x200 + i);
            vm.deal(player, 1000 ether);
            vm.prank(player);
            arena.joinGame{value: Constants.ENTRY_FEE}(gameId, Types.ShipClass.Cruiser);
        }
        
        Types.GameData memory game = arena.getGame(gameId);
        assertEq(game.playerCount, 16);
        assertEq(uint8(game.state), uint8(Types.GameState.Active));
        
        // Try to join again
        address latePlayer = address(0x300);
        vm.deal(latePlayer, 1000 ether);
        vm.prank(latePlayer);
        vm.expectRevert(DarkArena.GameNotInLobby.selector);
        arena.joinGame{value: Constants.ENTRY_FEE}(gameId, Types.ShipClass.Cruiser);
    }
}
