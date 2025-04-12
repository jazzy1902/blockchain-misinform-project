// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./IUserRegistry.sol";

contract UserRegistry is ERC721 {
    struct User {
        uint256 reputation;
        uint256 contentCount;
        uint256 ethDeposit;
    }

    mapping(uint256 => User) public users;
    mapping(address => uint256) public addressToTokenId;
    uint256 private _tokenCounter = 0;
    address public contentRegistry;
    address public moderation;
    uint256[] public allTokenIds;

    event ReputationAdjusted(uint256 tokenId, int256 change);
    event DepositMade(uint256 tokenId, uint256 amount);
    event WithdrawalMade(uint256 tokenId, uint256 amount);
    event PenaltyApplied(uint256 tokenId, uint256 amount);

    constructor() ERC721("UserToken", "UTKN") {}

    modifier onlyApproved() {
        require(msg.sender == contentRegistry || msg.sender == moderation, "Unauthorized");
        _;
    }

    function register() external payable returns (uint256) {
        require(balanceOf(msg.sender) == 0, "Already registered");
        require(msg.value >= 0.01 ether, "Minimum 0.01 ETH deposit required");
        
        uint256 tokenId = _tokenCounter++;
        _mint(msg.sender, tokenId);
        addressToTokenId[msg.sender] = tokenId;
        users[tokenId] = User(0, 0, msg.value);
        allTokenIds.push(tokenId);
        
        emit DepositMade(tokenId, msg.value);
        return tokenId;
    }

    function isRegistered(address user) external view returns (bool) {
        return (balanceOf(user) != 0);
    }

    function depositETH(uint256 tokenId) external payable {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        users[tokenId].ethDeposit += msg.value;
        emit DepositMade(tokenId, msg.value);
    }

    function withdrawETH(uint256 tokenId, uint256 amount) external {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        require(users[tokenId].ethDeposit >= amount, "Insufficient balance");
        
        users[tokenId].ethDeposit -= amount;
        payable(msg.sender).transfer(amount);
        emit WithdrawalMade(tokenId, amount);
    }

    function applyPenalty(uint256 tokenId, uint256 amount) external onlyApproved {
        require(users[tokenId].ethDeposit >= amount, "Insufficient balance for penalty");
        users[tokenId].ethDeposit -= amount;
        emit PenaltyApplied(tokenId, amount);
    }

    function getUser(address userAddr) external view returns (User memory, uint256) {
        uint256 tokenId = addressToTokenId[userAddr];
        require(balanceOf(userAddr) > 0, "User not registered");
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