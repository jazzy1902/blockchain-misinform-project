// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract MediaRegistry is ERC721("MediaHouseBadge", "MHB") {
    // Structures
    struct MediaHouse {
        string name;
        uint256 reputation; // 0-100 scale
        bool isVerified;
        uint256 verificationRequestTimestamp;
    }
    
    struct VerificationVote {
        address voter;
        bool approved;
        uint256 votingPower;
    }
    
    // Constants
    uint256 public constant VERIFICATION_THRESHOLD = 300; // 300 = 3 votes at 100 rep each
    uint256 public constant VOTING_PERIOD = 3 days;
    uint256 public constant REPUTATION_DELTA = 10; // Reputation change per vote
    
    // State
    uint256 private _tokenCounter = 1;
    
    // Mappings
    mapping(uint256 => MediaHouse) public tokenIdToMediaHouses;
    mapping(address => uint256) public addressToTokenId;
    // address -> token -> Media house details
    mapping(uint256 => VerificationVote[]) public verificationVotes;
    mapping(address => mapping(uint256 => bool)) public hasVoted;
    
    // Events
    event VerificationRequested(uint256 tokenId, address mediaHouse);
    event Voted(uint256 tokenId, address voter, bool approved, uint256 votingPower);
    event MediaHouseVerified(uint256 tokenId);
    event ReputationChanged(uint256 tokenId, int256 change);

    // ========== CORE FUNCTIONS ========== //
    function registerMediaHouse(string memory name) external {
        require(balanceOf(msg.sender) == 0, "Already registered");
        
        uint256 newTokenId = _tokenCounter;
        _safeMint(msg.sender, newTokenId);
        
        tokenIdToMediaHouses[newTokenId] = MediaHouse({
            name: name,
            reputation: 50, // Start with neutral reputation
            isVerified: false,
            verificationRequestTimestamp: 0
        });
        
        addressToTokenId[msg.sender] = newTokenId;
        _tokenCounter++;
    }

    function requestVerification(uint256 tokenId) external {
        // can request verification for only its token
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        // already verified
        require(!tokenIdToMediaHouses[tokenId].isVerified, "Already verified");
        
        // verification timestamp set, with an event triggered
        tokenIdToMediaHouses[tokenId].verificationRequestTimestamp = block.timestamp;
        emit VerificationRequested(tokenId, msg.sender);
    }

    function voteOnVerification(uint256 tokenId, bool approved) external {
        require(balanceOf(msg.sender) > 0, "Only registered media can vote");
        require(!hasVoted[msg.sender][tokenId], "Already voted");
        require(tokenIdToMediaHouses[tokenId].verificationRequestTimestamp > 0, "No active request");
        require(block.timestamp <= tokenIdToMediaHouses[tokenId].verificationRequestTimestamp + VOTING_PERIOD, "Voting period ended");
        
        uint256 voterTokenId = addressToTokenId[msg.sender];
        uint256 votingPower = tokenIdToMediaHouses[voterTokenId].reputation;
        
        verificationVotes[tokenId].push(VerificationVote({
            voter: msg.sender,
            approved: approved,
            votingPower: votingPower
        }));
        
        hasVoted[msg.sender][tokenId] = true;
        emit Voted(tokenId, msg.sender, approved, votingPower);
        
        _checkVerificationStatus(tokenId);
    }

    // ========== INTERNAL FUNCTIONS ========== //
    function _checkVerificationStatus(uint256 tokenId) private {
        (uint256 totalApprovalPower, ) = _calculateVotingPower(tokenId);
        
        if (totalApprovalPower >= VERIFICATION_THRESHOLD) {
            tokenIdToMediaHouses[tokenId].isVerified = true;
            _updateReputations(tokenId, true);
            emit MediaHouseVerified(tokenId);
        } else if (block.timestamp > tokenIdToMediaHouses[tokenId].verificationRequestTimestamp + VOTING_PERIOD) {
            _updateReputations(tokenId, false);
        }
    }
    
    function _calculateVotingPower(uint256 tokenId) private view returns (uint256 totalApprovalPower, uint256 totalVotingPower) {
        for (uint i = 0; i < verificationVotes[tokenId].length; i++) {
            totalVotingPower += verificationVotes[tokenId][i].votingPower;
            if (verificationVotes[tokenId][i].approved) {
                totalApprovalPower += verificationVotes[tokenId][i].votingPower;
            }
        }
    }
    
    function _updateReputations(uint256 tokenId, bool verificationPassed) private {

        for (uint i = 0; i < verificationVotes[tokenId].length; i++) {
            address voter = verificationVotes[tokenId][i].voter;
            uint256 voterTokenId = addressToTokenId[voter];
            bool voteCorrect = (verificationVotes[tokenId][i].approved == verificationPassed);
            
            if (voteCorrect) {
                // reputation max of 100
                tokenIdToMediaHouses[voterTokenId].reputation = 
                    _min(100, tokenIdToMediaHouses[voterTokenId].reputation + REPUTATION_DELTA);
                emit ReputationChanged(voterTokenId, int256(REPUTATION_DELTA));
            } else {
                tokenIdToMediaHouses[voterTokenId].reputation = 
                    _max(0, tokenIdToMediaHouses[voterTokenId].reputation - REPUTATION_DELTA);
                emit ReputationChanged(voterTokenId, -int256(REPUTATION_DELTA));
            }
            
            hasVoted[voter][tokenId] = false;
        }
    }

    // ========== HELPER FUNCTIONS ========== //
    function _min(uint256 a, uint256 b) private pure returns (uint256) {
        return a < b ? a : b;
    }
    
    function _max(uint256 a, uint256 b) private pure returns (uint256) {
        return a > b ? a : b;
    }
    
    // ========== VIEW FUNCTIONS ========== //
    function totalMediaHouses() public view returns (uint256) {
        return _tokenCounter - 1;
    }
    
    function getVerificationVotes(uint256 tokenId) public view returns (VerificationVote[] memory) {
        return verificationVotes[tokenId];
    }
}