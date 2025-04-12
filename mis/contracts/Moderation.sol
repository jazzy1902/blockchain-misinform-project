// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "./IUserRegistry.sol";
import "./ContentRegistry.sol";

contract Moderation {
    IUserRegistry public userRegistry;
    ContentRegistry public contentRegistry;

    struct ModerationVote {
        uint256 tokenId;
        bool isCorrect; // whether content should be flagged or not
    }

    mapping(uint256 => ModerationVote[]) public moderationVotes;
    uint256 public constant MIN_REP = 100;
    uint256 public constant MOD_THRESHOLD = 40;

    constructor(address _userRegistry, address _contentRegistry) {
        userRegistry = IUserRegistry(_userRegistry);
        contentRegistry = ContentRegistry(_contentRegistry);
    }

    function getTop50PercentUsers() public view returns (uint256[] memory) {
        uint256[] memory tokenIds = userRegistry.getAllTokenIds();
        uint256 total = tokenIds.length;

        require(total > 0, "No users");

        uint256[] memory reputations = new uint256[](total);
        uint256 sum = 0;

        for (uint i = 0; i < total; i++) {
            uint256 rep = userRegistry.getUser(msg.sender).reputation;
            reputations[i] = rep;
            sum += rep;
        }

        uint256 avg = sum / total;

        uint256 count = 0;
        for (uint i = 0; i < total; i++) {
            if (reputations[i] >= avg) count++;
        }

        uint256[] memory topUsers = new uint256[](count);
        uint256 idx = 0;
        for (uint i = 0; i < total; i++) {
            if (reputations[i] >= avg) {
                topUsers[idx++] = tokenIds[i];
            }
        }

        return topUsers;
    }


    function moderateContent(uint256 contentId, bool isCorrect) external {
        uint256 tokenId = userRegistry.getUser(msg.sender).tokenId;
        uint256[] memory topModerators = getTop50PercentUsers();
        (,,,,bool flagged) = contentRegistry.contents(contentId);
        require(userRegistry.getUser(msg.sender).reputation >= MIN_REP, "Low rep");
        require(flagged, "Not flagged");

        bool isTop = false;
        for (uint i = 0; i < topModerators.length; i++) {
            if (topModerators[i] == tokenId) {
                isTop = true;
                break;
            }
        }
        require(isTop, "Not in top 50% reputed users.");

        // Check duplicate votes
        for (uint i = 0; i < moderationVotes[contentId].length; i++) {
            require(moderationVotes[contentId][i].tokenId != tokenId, "Already voted");
        }

        moderationVotes[contentId].push(ModerationVote(tokenId, isCorrect));

        if (moderationVotes[contentId].length >= topModerators.length / 2) {
            _finalizeModeration(contentId);
        }
    }

    function _finalizeModeration(uint256 contentId) private {
        uint256 correctVotes;
        ModerationVote[] storage votes = moderationVotes[contentId];
        
        for (uint i = 0; i < votes.length; i++) {
            if (votes[i].isCorrect) correctVotes++;
        }

        bool verdict = correctVotes >= 2;
        _updateReputations(contentId, verdict);
    }

    function _updateReputations(uint256 contentId, bool isCorrect) private {
        // Update voters
        uint256[] memory ups = contentRegistry.getUpvoters(contentId);
        uint256[] memory downs = contentRegistry.getDownvoters(contentId);

        for (uint i = 0; i < ups.length; i++) {
            userRegistry.adjustReputation(ups[i], isCorrect ? int8(5) : -3);
        }

        for (uint i = 0; i < downs.length; i++) {
            userRegistry.adjustReputation(downs[i], isCorrect ? -3 : int8(5));
        }

        // Update moderators
        ModerationVote[] storage votes = moderationVotes[contentId];
        for (uint i = 0; i < votes.length; i++) {
            bool votedCorrectly = votes[i].isCorrect == isCorrect;
            userRegistry.adjustReputation(votes[i].tokenId, votedCorrectly ? int8(10) : -5);
        }
    }
}