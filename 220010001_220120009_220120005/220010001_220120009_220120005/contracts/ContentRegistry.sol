// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "./IUserRegistry.sol";

contract ContentRegistry {
    IUserRegistry public userRegistry;

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

    constructor(address _userRegistry) {
        userRegistry = IUserRegistry(_userRegistry); 
    }

    function submitContent(string memory dataHash) external payable {
        require(msg.value >= 0.005 ether, "Submission requires 0.005 ETH deposit");
        
        uint256 tokenId = userRegistry.getUser(msg.sender).tokenId;
        uint256 id = contents.length;
        contents.push(Content(id, tokenId, dataHash, 0, false, block.timestamp));
        userRegistry.adjustReputation(tokenId, 1);
        
        // Lock ETH deposit with content
        payable(address(userRegistry)).transfer(msg.value);
        emit ContentSubmitted(id, tokenId);
    }

    function voteContent(uint256 contentId, bool isUpvote) external payable {
        require(msg.value >= 0.001 ether, "Voting requires 0.001 ETH deposit");
        
        uint256 tokenId = userRegistry.getUser(msg.sender).tokenId;
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

        // Lock voting deposit
        payable(address(userRegistry)).transfer(msg.value);
        emit VoteRewarded(contentId, tokenId, msg.value);
        emit ContentVoted(contentId, tokenId, isUpvote);
    }

    function getUpvoters(uint256 contentId) external view returns (uint256[] memory) {
        return upvoters[contentId];
    }

    function getDownvoters(uint256 contentId) external view returns (uint256[] memory) {
        return downvoters[contentId];
    }
}