// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Types} from "./libraries/Types.sol";
import {Constants} from "./libraries/Constants.sol";
import {GameLogic} from "./libraries/GameLogic.sol";
import {Addresses} from "./libraries/Addresses.sol";
import {ShipClassResolver} from "./libraries/ShipClassResolver.sol";
import {IFuelCell} from "./interfaces/IFuelCell.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title Dark Arena
/// @notice Turn-based battle royale on PulseChain
/// @author Dark Arena Team
contract DarkArena is ReentrancyGuard {
    /// ========== ERRORS ========== ///
    error InvalidShipClass();
    error GameNotInLobby();
    error GameFull();
    error InsufficientEntryFee();
    error AlreadyJoined();
    error GameNotActive();
    error NotYourTurn();
    error ShipAlreadyActed();
    error InvalidMove();
    error InvalidTarget();
    error ShipDead();
    error GameNotFinished();
    error UnauthorizedCaller();
    error NoFuelCellNFT();
    error InvalidTokenId();
    error NotTokenOwner();

    /// ========== EVENTS ========== ///
    event GameCreated(uint256 indexed gameId, uint256 startTime);
    event PlayerJoined(uint256 indexed gameId, address indexed player, Types.ShipClass shipClass, uint256 tokenId, uint256 journeyId);
    event GameStarted(uint256 indexed gameId, uint8 playerCount);
    event TurnAdvanced(uint256 indexed gameId, uint8 turn, uint8 zoneSize);
    event PlayerMoved(uint256 indexed gameId, address indexed player, uint8 fromX, uint8 fromY, uint8 toX, uint8 toY);
    event PlayerAttacked(uint256 indexed gameId, address indexed attacker, address indexed target, uint16 damage);
    event PlayerKilled(uint256 indexed gameId, address indexed victim, address indexed killer);
    event LootDropped(uint256 indexed gameId, uint8 x, uint8 y, uint16 amount);
    event LootCollected(uint256 indexed gameId, address indexed player, uint16 amount);
    event GameFinished(uint256 indexed gameId, address indexed winner, uint256 prizeAmount);

    /// ========== STATE VARIABLES ========== ///
    uint256 public gameCounter;
    address public treasury;
    IFuelCell public immutable fuelCellNFT; // FuelCell NFT contract for gating

    mapping(uint256 => Types.GameData) public games;
    mapping(uint256 => Types.Ship[]) public gameShips;
    mapping(uint256 => mapping(address => uint256)) public playerShipIndex;
    mapping(uint256 => mapping(uint256 => bool)) public usedTokenIds; // gameId => tokenId => used
    mapping(uint256 => mapping(uint8 => mapping(uint8 => bool))) public occupiedTiles;
    mapping(uint256 => Types.Loot[]) public gameLoot;
    mapping(uint256 => uint256) public gameSeed;

    /// ========== CONSTRUCTOR ========== ///
    constructor(address _treasury, address _fuelCellNFT) {
        treasury = _treasury;
        fuelCellNFT = IFuelCell(_fuelCellNFT);
    }

    /// ========== GAME CREATION ========== ///
    
    /// @notice Create a new game
    function createGame() external returns (uint256 gameId) {
        gameId = ++gameCounter;
        
        games[gameId] = Types.GameData({
            gameId: gameId,
            state: Types.GameState.Lobby,
            turn: 0,
            zoneSize: Constants.INITIAL_ZONE_SIZE,
            prizePool: 0,
            startTime: block.timestamp,
            playerCount: 0,
            playersAlive: 0,
            winner: address(0),
            secondPlace: address(0),
            thirdPlace: address(0)
        });

        emit GameCreated(gameId, block.timestamp);
    }

    /// @notice Join a game with your FuelCell NFT
    /// @param gameId The game to join
    /// @param tokenId The FuelCell token ID to use (determines ship class)
    /// @param journeyId The journey ID of your FuelCell (for verification)
    function joinGame(uint256 gameId, uint256 tokenId, uint256 journeyId) external payable {
        Types.GameData storage game = games[gameId];

        // NOTE: NFT verification disabled for testing
        // Uncomment for production:
        // if (fuelCellNFT.balanceOf(msg.sender) == 0) revert NoFuelCellNFT();
        // if (fuelCellNFT.ownerOf(tokenId) != msg.sender) revert NotTokenOwner();
        // if (usedTokenIds[gameId][tokenId]) revert InvalidTokenId(); // Can't use same NFT twice

        if (game.state != Types.GameState.Lobby) revert GameNotInLobby();
        if (game.playerCount >= Constants.MAX_PLAYERS) revert GameFull();
        if (msg.value < Constants.ENTRY_FEE) revert InsufficientEntryFee();
        if (playerShipIndex[gameId][msg.sender] != 0 ||
            (gameShips[gameId].length > 0 && gameShips[gameId][0].player == msg.sender)) {
            revert AlreadyJoined();
        }

        // Determine ship class from NFT journey ID
        Types.ShipClass shipClass = ShipClassResolver.getShipClassFromJourney(journeyId);
        Types.ShipStats memory stats = GameLogic.getShipStats(shipClass);
        
        // Add player ship
        gameShips[gameId].push(Types.Ship({
            player: msg.sender,
            shipClass: shipClass,
            currentHP: stats.maxHP,
            x: 0,
            y: 0,
            isAlive: true,
            kills: 0,
            damageDealt: 0,
            hasActed: false
        }));

        playerShipIndex[gameId][msg.sender] = game.playerCount;
        usedTokenIds[gameId][tokenId] = true;
        game.playerCount++;
        game.prizePool += msg.value;

        emit PlayerJoined(gameId, msg.sender, shipClass, tokenId, journeyId);

        // Auto-start if full
        if (game.playerCount == Constants.MAX_PLAYERS) {
            _startGame(gameId);
        }
    }

    /// @notice Start the game (can be called by anyone after min players reached)
    function startGame(uint256 gameId) external {
        Types.GameData storage game = games[gameId];

        if (game.state != Types.GameState.Lobby) revert GameNotInLobby();
        if (game.playerCount < Constants.MIN_PLAYERS) revert UnauthorizedCaller();

        // NOTE: Lobby timeout check disabled for testing - anyone can start once min players reached
        // Uncomment for production:
        // if (block.timestamp < game.startTime + (Constants.LOBBY_TIME_LIMIT * 10)) {
        //     revert UnauthorizedCaller();
        // }

        _startGame(gameId);
    }

    /// @notice Internal function to start game
    function _startGame(uint256 gameId) internal {
        Types.GameData storage game = games[gameId];
        game.state = Types.GameState.Active;
        game.playersAlive = game.playerCount;
        game.startTime = block.timestamp;

        // Generate random seed and spawn players
        address[] memory players = new address[](game.playerCount);
        for (uint8 i = 0; i < game.playerCount; i++) {
            players[i] = gameShips[gameId][i].player;
        }
        
        uint256 seed = GameLogic.generateSeed(gameId, players);
        gameSeed[gameId] = seed;

        // Spawn players at random positions
        for (uint8 i = 0; i < game.playerCount; i++) {
            (uint8 x, uint8 y) = GameLogic.randomPosition(seed, i, game.zoneSize);
            
            // Ensure no overlap
            uint256 attempts = 0;
            while (occupiedTiles[gameId][x][y] && attempts < 100) {
                (x, y) = GameLogic.randomPosition(seed, i + attempts + 100, game.zoneSize);
                attempts++;
            }
            
            gameShips[gameId][i].x = x;
            gameShips[gameId][i].y = y;
            occupiedTiles[gameId][x][y] = true;
        }

        emit GameStarted(gameId, game.playerCount);
    }

    /// ========== GAME ACTIONS ========== ///

    /// @notice Perform action (move or attack)
    function performAction(
        uint256 gameId,
        uint8 targetX,
        uint8 targetY,
        bool isAttack
    ) external nonReentrant {
        Types.GameData storage game = games[gameId];
        
        if (game.state != Types.GameState.Active) revert GameNotActive();
        
        uint256 shipIdx = playerShipIndex[gameId][msg.sender];
        Types.Ship storage ship = gameShips[gameId][shipIdx];
        
        if (!ship.isAlive) revert ShipDead();
        if (ship.hasActed) revert ShipAlreadyActed();

        Types.ShipStats memory stats = GameLogic.getShipStats(ship.shipClass);

        if (isAttack) {
            _performAttack(gameId, shipIdx, targetX, targetY, stats);
        } else {
            _performMove(gameId, shipIdx, targetX, targetY, stats, game.zoneSize);
        }

        ship.hasActed = true;

        // Check if all players have acted this turn
        _checkTurnComplete(gameId);
    }

    /// @notice Internal move function
    function _performMove(
        uint256 gameId,
        uint256 shipIdx,
        uint8 targetX,
        uint8 targetY,
        Types.ShipStats memory stats,
        uint8 zoneSize
    ) internal {
        Types.Ship storage ship = gameShips[gameId][shipIdx];
        
        if (!GameLogic.isValidMove(ship.x, ship.y, targetX, targetY, stats.speed, zoneSize)) {
            revert InvalidMove();
        }
        if (occupiedTiles[gameId][targetX][targetY]) revert InvalidMove();

        uint8 fromX = ship.x;
        uint8 fromY = ship.y;

        occupiedTiles[gameId][fromX][fromY] = false;
        ship.x = targetX;
        ship.y = targetY;
        occupiedTiles[gameId][targetX][targetY] = true;

        // Check for loot collection
        _checkLootCollection(gameId, shipIdx);

        emit PlayerMoved(gameId, ship.player, fromX, fromY, targetX, targetY);
    }

    /// @notice Internal attack function
    function _performAttack(
        uint256 gameId,
        uint256 attackerIdx,
        uint8 targetX,
        uint8 targetY,
        Types.ShipStats memory stats
    ) internal {
        Types.Ship storage attacker = gameShips[gameId][attackerIdx];
        
        if (!GameLogic.isValidAttack(attacker.x, attacker.y, targetX, targetY, stats.range)) {
            revert InvalidTarget();
        }

        // Find target at position
        uint256 targetIdx = type(uint256).max;
        for (uint256 i = 0; i < gameShips[gameId].length; i++) {
            Types.Ship storage ship = gameShips[gameId][i];
            if (ship.isAlive && ship.x == targetX && ship.y == targetY) {
                targetIdx = i;
                break;
            }
        }

        if (targetIdx == type(uint256).max) revert InvalidTarget();

        Types.Ship storage target = gameShips[gameId][targetIdx];
        
        uint16 damage = GameLogic.calculateDamage(stats.damage, gameSeed[gameId], block.timestamp);
        
        attacker.damageDealt += damage;

        if (target.currentHP <= damage) {
            target.currentHP = 0;
            target.isAlive = false;
            attacker.kills++;
            games[gameId].playersAlive--;
            
            occupiedTiles[gameId][target.x][target.y] = false;
            
            // Drop loot (25% of entry fee per kill)
            uint16 lootAmount = uint16(Constants.KILL_BOUNTY / 1 ether);
            gameLoot[gameId].push(Types.Loot({
                x: target.x,
                y: target.y,
                amount: lootAmount,
                collected: false
            }));

            emit PlayerKilled(gameId, target.player, attacker.player);
            emit LootDropped(gameId, target.x, target.y, lootAmount);

            // Check for game end
            if (games[gameId].playersAlive <= 3) {
                _endGame(gameId);
            }
        } else {
            target.currentHP -= damage;
        }

        emit PlayerAttacked(gameId, attacker.player, target.player, damage);
    }

    /// @notice Check if loot can be collected
    function _checkLootCollection(uint256 gameId, uint256 shipIdx) internal {
        Types.Ship storage ship = gameShips[gameId][shipIdx];
        
        for (uint256 i = 0; i < gameLoot[gameId].length; i++) {
            Types.Loot storage loot = gameLoot[gameId][i];
            if (!loot.collected && loot.x == ship.x && loot.y == ship.y) {
                loot.collected = true;
                games[gameId].prizePool += uint256(loot.amount) * 1 ether;
                emit LootCollected(gameId, ship.player, loot.amount);
            }
        }
    }

    /// @notice Check if turn is complete
    function _checkTurnComplete(uint256 gameId) internal {
        Types.GameData storage game = games[gameId];
        
        bool allActed = true;
        for (uint256 i = 0; i < gameShips[gameId].length; i++) {
            if (gameShips[gameId][i].isAlive && !gameShips[gameId][i].hasActed) {
                allActed = false;
                break;
            }
        }

        if (allActed) {
            _advanceTurn(gameId);
        }
    }

    /// @notice Advance to next turn
    function _advanceTurn(uint256 gameId) internal {
        Types.GameData storage game = games[gameId];
        game.turn++;

        // Reset hasActed flags
        for (uint256 i = 0; i < gameShips[gameId].length; i++) {
            gameShips[gameId][i].hasActed = false;
        }

        // Update zone size
        game.zoneSize = GameLogic.calculateZoneSize(game.turn);

        // Damage players outside zone
        for (uint256 i = 0; i < gameShips[gameId].length; i++) {
            Types.Ship storage ship = gameShips[gameId][i];
            if (ship.isAlive && !GameLogic.isInZone(ship.x, ship.y, game.zoneSize)) {
                uint16 zoneDamage = 10; // 10 damage per turn outside zone
                if (ship.currentHP <= zoneDamage) {
                    ship.currentHP = 0;
                    ship.isAlive = false;
                    game.playersAlive--;
                    occupiedTiles[gameId][ship.x][ship.y] = false;
                } else {
                    ship.currentHP -= zoneDamage;
                }
            }
        }

        emit TurnAdvanced(gameId, game.turn, game.zoneSize);

        // Check if game should end
        if (game.playersAlive <= 3) {
            _endGame(gameId);
        }
    }

    /// @notice End the game
    function _endGame(uint256 gameId) internal {
        Types.GameData storage game = games[gameId];
        game.state = Types.GameState.Finished;

        // Find top 3 players
        address[] memory topPlayers = new address[](3);
        uint16[] memory topScores = new uint16[](3);

        for (uint256 i = 0; i < gameShips[gameId].length; i++) {
            Types.Ship storage ship = gameShips[gameId][i];
            uint16 score = ship.kills * 100 + ship.damageDealt;
            
            if (ship.isAlive) score += 500; // Bonus for being alive

            for (uint8 j = 0; j < 3; j++) {
                if (score > topScores[j]) {
                    // Shift down
                    for (uint8 k = 2; k > j; k--) {
                        topScores[k] = topScores[k-1];
                        topPlayers[k] = topPlayers[k-1];
                    }
                    topScores[j] = score;
                    topPlayers[j] = ship.player;
                    break;
                }
            }
        }

        game.winner = topPlayers[0];
        game.secondPlace = topPlayers[1];
        game.thirdPlace = topPlayers[2];

        _distributePrizes(gameId);
    }

    /// @notice Distribute prizes
    function _distributePrizes(uint256 gameId) internal {
        Types.GameData storage game = games[gameId];
        uint256 pool = game.prizePool;

        uint256 protocolFee = (pool * Constants.PROTOCOL_FEE_BPS) / 10000;
        uint256 firstPrize = (pool * Constants.FIRST_PLACE_BPS) / 10000;
        uint256 secondPrize = (pool * Constants.SECOND_PLACE_BPS) / 10000;
        uint256 thirdPrize = (pool * Constants.THIRD_PLACE_BPS) / 10000;

        payable(treasury).transfer(protocolFee);
        
        if (game.winner != address(0)) {
            payable(game.winner).transfer(firstPrize);
            emit GameFinished(gameId, game.winner, firstPrize);
        }
        if (game.secondPlace != address(0)) {
            payable(game.secondPlace).transfer(secondPrize);
        }
        if (game.thirdPlace != address(0)) {
            payable(game.thirdPlace).transfer(thirdPrize);
        }
    }

    /// ========== VIEW FUNCTIONS ========== ///

    /// @notice Get game data
    function getGame(uint256 gameId) external view returns (Types.GameData memory) {
        return games[gameId];
    }

    /// @notice Get all ships in a game
    function getGameShips(uint256 gameId) external view returns (Types.Ship[] memory) {
        return gameShips[gameId];
    }

    /// @notice Get all loot in a game
    function getGameLoot(uint256 gameId) external view returns (Types.Loot[] memory) {
        return gameLoot[gameId];
    }

    /// @notice Get player's ship in a game
    function getPlayerShip(uint256 gameId, address player) external view returns (Types.Ship memory) {
        uint256 idx = playerShipIndex[gameId][player];
        return gameShips[gameId][idx];
    }
}
