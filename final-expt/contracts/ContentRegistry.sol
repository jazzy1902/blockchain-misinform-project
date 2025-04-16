// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "./IUserRegistry.sol";

contract ContentRegistry {
    IUserRegistry public userRegistry;
    address public moderation;

    struct Content {
        uint256 id;
        uint256 authorTokenId;
        string dataHash;
        int256 voteScore;
        bool flagged;
        uint256 creationTime;
    }

    Content[] public contents;
    mapping(uint256 => mapping(uint256 => bool)) public votes;
    mapping(uint256 => uint256[]) public upvoters;
    mapping(uint256 => uint256[]) public downvoters;
    
    event ContentRewarded(uint256 indexed id, uint256 amount);
    event VoteRewarded(uint256 indexed contentId, uint256 voterTokenId, uint256 amount);
    event ContentSubmitted(uint256 indexed id, uint256 authorTokenId);
    event ContentVoted(uint256 indexed id, uint256 voterTokenId, bool isUpvote);
    
    // For deposit tracking
    uint256 public totalDeposits;
    
    receive() external payable {
        // Accept ETH transfers
        totalDeposits += msg.value;
    }
    
    fallback() external payable {
        // Fallback function to accept ETH
        totalDeposits += msg.value;
    }

    constructor(address _userRegistry) {
        userRegistry = IUserRegistry(_userRegistry); 
    }
    
    modifier onlyModeration() {
        require(msg.sender == moderation, "Only moderation contract");
        _;
    }

    function setModerationContract(address _moderation) external {
        require(moderation == address(0), "Already set");
        moderation = _moderation;
    }

    function submitContent(string memory dataHash) external payable {
        require(msg.value >= 0.005 ether, "Submission requires 0.005 ETH deposit");
        
        // Check if user is registered
        require(userRegistry.isRegistered(msg.sender), "User not registered");
        
        // Get user info & token ID
        (, uint256 tokenId) = userRegistry.getUser(msg.sender);
        
        // Create content
        uint256 id = contents.length;
        contents.push(Content(id, tokenId, dataHash, 0, false, block.timestamp));
        
        // Adjust reputation
        userRegistry.adjustReputation(tokenId, 1);
        
        // Keep track of deposits directly
        totalDeposits += msg.value;
        
        // Emit event
        emit ContentSubmitted(id, tokenId);
    }

    function voteContent(uint256 contentId, bool isUpvote) external payable {
        require(msg.value >= 0.001 ether, "Voting requires 0.001 ETH deposit");
        require(contentId < contents.length, "Content does not exist");
        
        // Check if user is registered
        require(userRegistry.isRegistered(msg.sender), "User not registered");
        
        // Get user token ID
        (, uint256 tokenId) = userRegistry.getUser(msg.sender);
        require(!votes[tokenId][contentId], "Already voted");

        Content storage content = contents[contentId];
        content.voteScore += isUpvote ? int256(1) : int256(-1);
        votes[tokenId][contentId] = true;

        if (isUpvote) {
            upvoters[contentId].push(tokenId);
        } else {
            downvoters[contentId].push(tokenId);
            if (content.voteScore <= -5 && !content.flagged) {
                content.flagged = true;
            }
        }

        // Keep track of deposits directly
        totalDeposits += msg.value;
        
        emit VoteRewarded(contentId, tokenId, msg.value);
        emit ContentVoted(contentId, tokenId, isUpvote);
    }

    function getContentsCount() external view returns (uint256) {
        return contents.length;
    }

    function getUpvoters(uint256 contentId) external view returns (uint256[] memory) {
        require(contentId < contents.length, "Content does not exist");
        return upvoters[contentId];
    }

    function getDownvoters(uint256 contentId) external view returns (uint256[] memory) {
        require(contentId < contents.length, "Content does not exist");
        return downvoters[contentId];
    }
}