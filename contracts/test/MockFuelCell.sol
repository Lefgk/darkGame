// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../src/interfaces/IFuelCell.sol";

/**
 * @title MockFuelCell
 * @notice Mock FuelCell NFT contract for testing
 */
contract MockFuelCell is IFuelCell {
    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => bool)) private _operatorApprovals;
    mapping(uint256 => uint256) private _journeyIds;
    uint256 private _totalSupply;

    function mint(address to, uint256 tokenId, uint256 journeyId) external {
        _owners[tokenId] = to;
        _balances[to]++;
        _journeyIds[tokenId] = journeyId;
        _totalSupply++;
    }

    function balanceOf(address owner) external view override returns (uint256) {
        return _balances[owner];
    }

    function ownerOf(uint256 tokenId) external view override returns (address) {
        address owner = _owners[tokenId];
        require(owner != address(0), "Token does not exist");
        return owner;
    }

    function totalSupply() external view override returns (uint256) {
        return _totalSupply;
    }

    function tokenURI(uint256 tokenId) external pure override returns (string memory) {
        return string(abi.encodePacked("https://fuelcell.app/token/", tokenId));
    }

    function isApprovedForAll(address owner, address operator) external view override returns (bool) {
        return _operatorApprovals[owner][operator];
    }

    function tokenOfOwnerByIndex(address owner, uint256 index) external view override returns (uint256) {
        require(index < _balances[owner], "Index out of bounds");
        // Simplified implementation for testing
        uint256 count = 0;
        for (uint256 i = 1; i <= _totalSupply; i++) {
            if (_owners[i] == owner) {
                if (count == index) {
                    return i;
                }
                count++;
            }
        }
        revert("Token not found");
    }

    function journeyPhaseManager() external pure override returns (address) {
        return address(0);
    }

    function getJourneyId(uint256 tokenId) external view returns (uint256) {
        return _journeyIds[tokenId];
    }
}
