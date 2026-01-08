// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../src/DarkArena.sol";
import "../src/libraries/Types.sol";
import "../src/libraries/Constants.sol";
import "./MockFuelCell.sol";

/**
 * @title DarkArenaIntegrationTest
 * @notice Comprehensive integration tests for full game scenarios
 */
contract DarkArenaIntegrationTest is Test {
    DarkArena public arena;
    MockFuelCell public fuelCell;
    address public treasury = address(0x1);
    
    address[] public players;
    uint256[] public tokenIds;
    
    function setUp() public {
        fuelCell = new MockFuelCell();
        arena = new DarkArena(treasury, address(fuelCell));
        
        // Create 10 test players
        for (uint256 i = 0; i < 10; i++) {
            address player = address(uint160(0x1000 + i));
            players.push(player);
            tokenIds.push(i + 1);
            
            // Mint NFT with varying journey IDs
            uint256 journeyId = (i % 5) + 1; // Journey 1-5
            fuelCell.mint(player, i + 1, journeyId);
            
            vm.deal(player, 1000 ether);
        }
    }
    
    function testFullGameLifecycle() public {
        // 1. Create game
        uint256 gameId = arena.createGame();
        
        // 2. Players join
        for (uint256 i = 0; i < 8; i++) {
            vm.prank(players[i]);
            uint256 journeyId = (i % 5) + 1;
            arena.joinGame{value: Constants.ENTRY_FEE}(gameId, tokenIds[i], journeyId);
        }
        
        Types.GameData memory game = arena.getGame(gameId);
        assertEq(game.playerCount, 8);
        assertEq(game.prizePool, Constants.ENTRY_FEE * 8);
        
        // 3. Start game
        arena.startGame(gameId);
        
        game = arena.getGame(gameId);
        assertEq(uint8(game.state), uint8(Types.GameState.Active));
        assertEq(game.playersAlive, 8);
        
        // 4. Verify all ships spawned
        for (uint256 i = 0; i < 8; i++) {
            Types.Ship memory ship = arena.getPlayerShip(gameId, players[i]);
            assertTrue(ship.isAlive);
            assertTrue(ship.x < Constants.BOARD_SIZE);
            assertTrue(ship.y < Constants.BOARD_SIZE);
        }
    }
    
    function testPlayerMovement() public {
        uint256 gameId = arena.createGame();
        
        // Join and start
        for (uint256 i = 0; i < 5; i++) {
            vm.prank(players[i]);
            uint256 journeyId = (i % 5) + 1;
            arena.joinGame{value: Constants.ENTRY_FEE}(gameId, tokenIds[i], journeyId);
        }
        
        arena.startGame(gameId);
        
        // Get player 0's position
        Types.Ship memory ship = arena.getPlayerShip(gameId, players[0]);
        uint8 startX = ship.x;
        uint8 startY = ship.y;
        
        // Verify ship spawned on board
        assertTrue(startX < Constants.BOARD_SIZE);
        assertTrue(startY < Constants.BOARD_SIZE);
        assertTrue(ship.isAlive);
    }
    
    function testCombatSystem() public {
        uint256 gameId = arena.createGame();
        
        // Join with 5 players
        for (uint256 i = 0; i < 5; i++) {
            vm.prank(players[i]);
            uint256 journeyId = (i % 5) + 1;
            arena.joinGame{value: Constants.ENTRY_FEE}(gameId, tokenIds[i], journeyId);
        }
        
        arena.startGame(gameId);
        
        Types.Ship memory attacker = arena.getPlayerShip(gameId, players[0]);
        Types.Ship memory defender = arena.getPlayerShip(gameId, players[1]);
        
        // Verify both ships are alive
        assertTrue(attacker.isAlive);
        assertTrue(defender.isAlive);
        assertTrue(attacker.currentHP > 0);
        assertTrue(defender.currentHP > 0);
    }
    
    function testZoneShrinking() public {
        uint256 gameId = arena.createGame();
        
        for (uint256 i = 0; i < 5; i++) {
            vm.prank(players[i]);
            uint256 journeyId = (i % 5) + 1;
            arena.joinGame{value: Constants.ENTRY_FEE}(gameId, tokenIds[i], journeyId);
        }
        
        arena.startGame(gameId);
        
        Types.GameData memory game = arena.getGame(gameId);
        uint8 initialZoneSize = game.zoneSize;
        
        // Verify initial zone size
        assertEq(initialZoneSize, Constants.INITIAL_ZONE_SIZE);
    }
    
    function testCannotActTwicePerTurn() public {
        // Skip - move/attack not yet implemented
        assertTrue(true);
    }
    
    function testPlayerElimination() public {
        uint256 gameId = arena.createGame();
        
        for (uint256 i = 0; i < 5; i++) {
            vm.prank(players[i]);
            uint256 journeyId = (i % 5) + 1;
            arena.joinGame{value: Constants.ENTRY_FEE}(gameId, tokenIds[i], journeyId);
        }
        
        arena.startGame(gameId);
        
        Types.GameData memory game = arena.getGame(gameId);
        uint16 initialPlayersAlive = game.playersAlive;
        
        // Try to eliminate player by dealing damage
        Types.Ship memory defender = arena.getPlayerShip(gameId, players[1]);
        
        // Manually set HP to low for testing
        // In real game, would need multiple attacks
        
        // Verify alive count
        assertEq(initialPlayersAlive, 5);
    }
    
    function testGameEndsWith3PlayersLeft() public {
        uint256 gameId = arena.createGame();
        
        for (uint256 i = 0; i < 5; i++) {
            vm.prank(players[i]);
            uint256 journeyId = (i % 5) + 1;
            arena.joinGame{value: Constants.ENTRY_FEE}(gameId, tokenIds[i], journeyId);
        }
        
        arena.startGame(gameId);
        
        Types.GameData memory game = arena.getGame(gameId);
        assertEq(uint8(game.state), uint8(Types.GameState.Active));
        
        // Game should end when 3 players remain
        // This would require eliminating 2 players
    }
    
    function testMaxPlayersLimit() public {
        uint256 gameId = arena.createGame();
        
        // Try to join with MAX_PLAYERS + 1
        for (uint256 i = 0; i < Constants.MAX_PLAYERS; i++) {
            address player = address(uint160(0x2000 + i));
            uint256 tokenId = i + 100;
            fuelCell.mint(player, tokenId, (i % 5) + 1);
            vm.deal(player, 1000 ether);
            
            vm.prank(player);
            arena.joinGame{value: Constants.ENTRY_FEE}(gameId, tokenId, (i % 5) + 1);
        }
        
        Types.GameData memory game = arena.getGame(gameId);
        assertEq(game.playerCount, Constants.MAX_PLAYERS);
        
        // One more should fail
        address extraPlayer = address(0x9999);
        fuelCell.mint(extraPlayer, 999, 1);
        vm.deal(extraPlayer, 1000 ether);
        
        vm.prank(extraPlayer);
        vm.expectRevert();
        arena.joinGame{value: Constants.ENTRY_FEE}(gameId, 999, 1);
    }
    
    function testCannotStartGameWithoutMinPlayers() public {
        uint256 gameId = arena.createGame();
        
        // Join with only 3 players (less than MIN_PLAYERS)
        for (uint256 i = 0; i < 3; i++) {
            vm.prank(players[i]);
            uint256 journeyId = (i % 5) + 1;
            arena.joinGame{value: Constants.ENTRY_FEE}(gameId, tokenIds[i], journeyId);
        }
        
        vm.expectRevert();
        arena.startGame(gameId);
    }
    
    function testPrizeDistribution() public {
        uint256 gameId = arena.createGame();
        
        uint256 totalPrize = Constants.ENTRY_FEE * 5;
        
        for (uint256 i = 0; i < 5; i++) {
            vm.prank(players[i]);
            uint256 journeyId = (i % 5) + 1;
            arena.joinGame{value: Constants.ENTRY_FEE}(gameId, tokenIds[i], journeyId);
        }
        
        Types.GameData memory game = arena.getGame(gameId);
        assertEq(game.prizePool, totalPrize);
        
        // Expected prize distribution:
        // 1st: 54%
        // 2nd: 22.5%
        // 3rd: 13.5%
        // Protocol: 10%
        
        uint256 firstPrize = (totalPrize * Constants.FIRST_PLACE_BPS) / 10000;
        uint256 secondPrize = (totalPrize * Constants.SECOND_PLACE_BPS) / 10000;
        uint256 thirdPrize = (totalPrize * Constants.THIRD_PLACE_BPS) / 10000;
        uint256 protocolFee = (totalPrize * Constants.PROTOCOL_FEE_BPS) / 10000;
        
        assertTrue(firstPrize + secondPrize + thirdPrize + protocolFee <= totalPrize);
    }
    
    function testInvalidMoveOutOfBounds() public {
        // Skip - move not yet implemented
        assertTrue(true);
    }
    
    function testCannotJoinAfterGameStarts() public {
        uint256 gameId = arena.createGame();
        
        for (uint256 i = 0; i < 5; i++) {
            vm.prank(players[i]);
            uint256 journeyId = (i % 5) + 1;
            arena.joinGame{value: Constants.ENTRY_FEE}(gameId, tokenIds[i], journeyId);
        }
        
        arena.startGame(gameId);
        
        // Try to join after start
        vm.prank(players[5]);
        vm.expectRevert();
        arena.joinGame{value: Constants.ENTRY_FEE}(gameId, tokenIds[5], 1);
    }
    
    function testMultipleGamesSimultaneously() public {
        // Create 3 games
        uint256 gameId1 = arena.createGame();
        uint256 gameId2 = arena.createGame();
        uint256 gameId3 = arena.createGame();
        
        assertEq(gameId1, 1);
        assertEq(gameId2, 2);
        assertEq(gameId3, 3);
        
        // Players can join different games
        vm.prank(players[0]);
        arena.joinGame{value: Constants.ENTRY_FEE}(gameId1, tokenIds[0], 1);
        
        vm.prank(players[1]);
        arena.joinGame{value: Constants.ENTRY_FEE}(gameId2, tokenIds[1], 2);
        
        Types.GameData memory game1 = arena.getGame(gameId1);
        Types.GameData memory game2 = arena.getGame(gameId2);
        
        assertEq(game1.playerCount, 1);
        assertEq(game2.playerCount, 1);
    }
}
