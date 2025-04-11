// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "./ContentRegistry.sol";

contract Moderation is ContentRegistry {
    struct ModerationVote {
        address voter;
        bool isCorrect;
    }

    mapping(uint256 => ModerationVote[]) public modVotes;

    event ModerationSubmitted(uint256 contentId, address moderator, bool isCorrect);
    event ModerationResolved(uint256 contentId, bool finalVerdict);

    function moderateContent(uint256 contentId, bool isCorrect) external onlyRegistered {
        require(contents[contentId].flagged, "Not flagged");
        require(reputation[msg.sender] >= 50, "Not high reputation");
        
        // prevent duplicate moderation
        ModerationVote[] storage votesList = modVotes[contentId];
        for (uint i = 0; i < votesList.length; i++) {
            require(votesList[i].voter != msg.sender, "Already voted");
        }

        modVotes[contentId].push(ModerationVote(msg.sender, isCorrect));
        emit ModerationSubmitted(contentId, msg.sender, isCorrect);

        // Decide after 3 votes
        if (modVotes[contentId].length >= 3) {
            uint correct = 0;
            for (uint i = 0; i < 3; i++) {
                if (modVotes[contentId][i].isCorrect) correct++;
            }

            bool verdict = correct >= 2;
            contents[contentId].verified = verdict;
            emit ModerationResolved(contentId, verdict);

            _updateReputations(contentId, verdict);
        }
    }

    function _updateReputations(uint256 contentId, bool verdict) internal {
        for (uint i = 0; i < modVotes[contentId].length; i++) {
            address voter = modVotes[contentId][i].voter;
            bool votedCorrectly = modVotes[contentId][i].isCorrect == verdict;
            if (votedCorrectly) {
                _adjustReputation(voter, 1);
            } else {
                _adjustReputation(voter, -1);
            }
        }
    }
}
