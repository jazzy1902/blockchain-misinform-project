// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

interface IUserRegistry {
    struct User {
        uint256 reputation;
        uint256 contentCount;
        uint256 ethDeposit;
    }
    
    function getUser(address account) external view returns (User memory, uint256);
    function getUserCount() external view returns (uint256);
    function getAllTokenIds() external view returns (uint256[] memory);
    function adjustReputation(uint256 tokenId, int256 change) external;
    function applyPenalty(uint256 tokenId, uint256 amount) external;
    // function mintToken(address to) external returns (uint256);
    function ownerOf(uint256 tokenId) external view returns (address);
    function users(uint256 tokenId) external view returns (uint256, uint256, uint256);
    function isRegistered(address user) external view returns (bool);
}