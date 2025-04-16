// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "./IUserRegistry.sol";
import "./ContentRegistry.sol";

contract Moderation {
    IUserRegistry public userRegistry;
    address public contentRegistryAddress;
    
    // For deposit tracking
    uint256 public totalDeposits;

    struct ModerationVote {
        uint256 tokenId;
        bool isCorrect;
    }

    mapping(uint256 => ModerationVote[]) public moderationVotes;
    uint256 public constant MIN_REP = 10; // Lowered for testing
    uint256 public constant MOD_THRESHOLD = 40;
    
    // New events
    event ModerationRewarded(uint256 indexed contentId, uint256 moderatorTokenId, uint256 amount);
    event ModerationPenalized(uint256 indexed contentId, uint256 moderatorTokenId, uint256 amount);
    
    receive() external payable {
        // Accept ETH transfers
        totalDeposits += msg.value;
    }
    
    fallback() external payable {
        // Fallback function to accept ETH
        totalDeposits += msg.value;
    }

    constructor(address _userRegistry, address _contentRegistry) {
        userRegistry = IUserRegistry(_userRegistry);
        contentRegistryAddress = _contentRegistry;
    }
    
    function getContentRegistry() internal view returns (ContentRegistry) {
        return ContentRegistry(payable(contentRegistryAddress));
    }

    function moderateContent(uint256 contentId, bool isCorrect) external payable {
        require(msg.value >= 0.01 ether, "Moderation requires 0.01 ETH deposit");
        
        ContentRegistry contentRegistry = getContentRegistry();
        
        // Check if content exists and is flagged
        (,,,,bool flagged,) = contentRegistry.contents(contentId);
        require(flagged, "Content not flagged or doesn't exist");
        
        // Check if user is registered
        require(userRegistry.isRegistered(msg.sender), "User not registered");
        
        // Get user reputation and token ID
        (IUserRegistry.User memory user, uint256 tokenId) = userRegistry.getUser(msg.sender);
        uint256[] memory topModerators = getTop50PercentUsers();
        require(user.reputation >= MIN_REP, "Low rep");

        bool isTop = false;
        for (uint i = 0; i < topModerators.length; i++) {
            if (topModerators[i] == tokenId) {
                isTop = true;
                break;
            }
        }
        require(isTop, "Not in top 50% reputed users");

        for (uint i = 0; i < moderationVotes[contentId].length; i++) {
            require(moderationVotes[contentId][i].tokenId != tokenId, "Already voted");
        }

        moderationVotes[contentId].push(ModerationVote(tokenId, isCorrect));
        
        // Keep track of deposits
        totalDeposits += msg.value;

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

        bool verdict = correctVotes >= votes.length / 2;
        _updateReputations(contentId, verdict);
        _distributeFunds(contentId, verdict);
    }

    function _distributeFunds(uint256 contentId, bool isCorrect) private {
        uint256 totalPool = address(this).balance;
        if (totalPool == 0) return; // No funds to distribute
        
        // Reward moderators (50% of pool)
        ModerationVote[] storage votes = moderationVotes[contentId];
        if (votes.length == 0) return; // No votes to reward
        
        uint256 modRewardPerVoter = totalPool * 50 / 100 / votes.length;
        
        for (uint i = 0; i < votes.length; i++) {
            bool votedCorrectly = votes[i].isCorrect == isCorrect;
            if (votedCorrectly) {
                address payable voter = payable(userRegistry.ownerOf(votes[i].tokenId));
                if (modRewardPerVoter > 0) {
                    (bool success, ) = voter.call{value: modRewardPerVoter}("");
                    if (success) {
                        emit ModerationRewarded(contentId, votes[i].tokenId, modRewardPerVoter);
                    }
                }
            } else {
                userRegistry.applyPenalty(votes[i].tokenId, modRewardPerVoter);
                emit ModerationPenalized(contentId, votes[i].tokenId, modRewardPerVoter);
            }
        }
    }

    function getTop50PercentUsers() public view returns (uint256[] memory) {
        uint256[] memory tokenIds = userRegistry.getAllTokenIds();
        uint256 total = tokenIds.length;

        require(total > 0, "No users");

        uint256[] memory reputations = new uint256[](total);
        uint256 sum = 0;

        for (uint i = 0; i < total; i++) {
            (uint256 rep, ,) = userRegistry.users(tokenIds[i]);
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

    function _updateReputations(uint256 contentId, bool isCorrect) private {
        ContentRegistry contentRegistry = getContentRegistry();
        
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