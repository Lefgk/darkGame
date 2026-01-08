// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title IFuelCell Interface
/// @notice Interface for the FuelCell NFT contract
interface IFuelCell {
    /// @notice Check if an address owns a FuelCell NFT
    /// @param owner The address to check
    /// @return balance The number of FuelCells owned
    function balanceOf(address owner) external view returns (uint256 balance);

    /// @notice Get the owner of a specific token
    /// @param tokenId The token ID to query
    /// @return owner The address of the token owner
    function ownerOf(uint256 tokenId) external view returns (address owner);

    /// @notice Get the total supply of FuelCell NFTs
    /// @return supply The total number of minted tokens
    function totalSupply() external view returns (uint256 supply);

    /// @notice Get the token URI for metadata
    /// @param tokenId The token ID to query
    /// @return uri The metadata URI
    function tokenURI(uint256 tokenId) external view returns (string memory uri);

    /// @notice Check if an address is approved to transfer a token
    /// @param owner The owner address
    /// @param operator The operator address
    /// @return approved Whether the operator is approved
    function isApprovedForAll(address owner, address operator) external view returns (bool approved);

    /// @notice Get the journey ID for a token (determines rarity/ship class)
    /// @param tokenId The token ID to query
    /// @return journeyId The journey this token was minted in
    function journeyPhaseManager() external view returns (address);
    
    /// @notice Get token of owner by index
    /// @param owner The owner address
    /// @param index The index in the owner's token list
    /// @return tokenId The token ID at that index
    function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256 tokenId);
}

