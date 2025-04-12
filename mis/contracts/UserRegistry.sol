// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract UserRegistry is ERC721 {
    struct User {
        uint256 reputation;
        uint256 contentCount;
    }

    mapping(uint256 => User) public users;
    mapping(address => uint256) public addressToTokenId;
    uint256 private _tokenCounter = 0;
    address public contentRegistry;
    address public moderation;
    uint256[] public allTokenIds;

    event ReputationAdjusted(uint256 tokenId, int256 change);

    constructor() ERC721("UserToken", "UTKN") {}

    modifier onlyApproved() {
        require(msg.sender == contentRegistry || msg.sender == moderation, "Unauthorized");
        _;
    }

    function register() external returns (uint256) {
        require(balanceOf(msg.sender) == 0, "Already registered");
        uint256 tokenId = _tokenCounter++;
        _mint(msg.sender, tokenId);
        addressToTokenId[msg.sender] = tokenId;
        users[tokenId] = User(0, 0); // 0 initial reputation
        allTokenIds.push(tokenId);
        return tokenId;
    }

    function getUser(address userAddr) external view returns (User memory, uint256) {
        uint256 tokenId = addressToTokenId[userAddr];
        return (users[tokenId], tokenId);
    }

    function adjustReputation(uint256 tokenId, int256 change) external onlyApproved {
        if (change > 0) {
            users[tokenId].reputation += uint256(change);
        } else {
            uint256 decrease = uint256(-change);
            users[tokenId].reputation = decrease > users[tokenId].reputation ? 0 : users[tokenId].reputation - decrease;
        }
        emit ReputationAdjusted(tokenId, change);
    }

    function setApprovedContracts(address _content, address _moderation) external {
        require(contentRegistry == address(0), "Already set");
        contentRegistry = _content;
        moderation = _moderation;
    }

    function getUserCount() external view returns(uint256) {
        return (_tokenCounter);
    }

    function getAllTokenIds() external view returns (uint256[] memory) {
        return allTokenIds;
    }

}