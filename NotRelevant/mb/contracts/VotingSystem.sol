pragma solidity ^0.8.0;

import "./UserRegistry.sol";
import "./ContentRegistry.sol";

contract VotingSystem {
    UserRegistry public userRegistry;
    ContentRegistry public contentRegistry;
    
    uint256 public constant REPUTATION_CHANGE = 10;
    uint256 public constant TOP_USERS_COUNT = 51;

    constructor(address _userRegistry, address _contentRegistry) {
        userRegistry = UserRegistry(_userRegistry);
        contentRegistry = ContentRegistry(_contentRegistry);
    }

    function registerUser(string memory _username) public {
        userRegistry.registerUser(_username);
    }

    function addContent(string memory _contentHash) public returns (uint256) {
        require(userRegistry.getUserReputation(msg.sender) >= 0, "Not registered");
        return contentRegistry.addContent(_contentHash);
    }

    function voteContent(uint256 _contentId, bool _isUpvote) public {
        require(userRegistry.getUserReputation(msg.sender) >= 0, "Not registered");
        contentRegistry.voteContent(_contentId, _isUpvote);
        
        // Check if we have enough votes to trigger verification
        (,, uint256 upvotes, uint256 downvotes,,) = contentRegistry.getContent(_contentId);
        if (upvotes + downvotes >= TOP_USERS_COUNT) {
            verifyContent(_contentId);
        }
    }

    function verifyContent(uint256 _contentId) private {
        address[] memory topUsers = userRegistry.getTopUsers(TOP_USERS_COUNT);
        uint256 trueVotes = 0;
        uint256 falseVotes = 0;
        
        // In a real implementation, you'd collect votes from top users
        // For simplicity, we're just using a mock verification
        (, string memory contentHash,,,,) = contentRegistry.getContent(_contentId);
        bool verificationResult = bytes(contentHash).length > 10; // Mock verification
        
        contentRegistry.verifyContent(_contentId, verificationResult);
        
        // Update reputations based on verification
        (address creator,, uint256 upvotes, uint256 downvotes,,) = contentRegistry.getContent(_contentId);
        
        if (verificationResult) {
            // Content is true - reward upvoters, punish downvoters
            userRegistry.updateReputation(creator, REPUTATION_CHANGE);
            // In a real implementation, you'd update all voters' reputations
        } else {
            // Content is false - reward downvoters, punish upvoters
            userRegistry.updateReputation(creator, -int256(REPUTATION_CHANGE));
            // In a real implementation, you'd update all voters' reputations
        }
    }

    function getUserReputation(address _user) public view returns (uint256) {
        return userRegistry.getUserReputation(_user);
    }
}