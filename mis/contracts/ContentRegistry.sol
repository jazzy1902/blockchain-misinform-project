// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

contract ContentRegistry {
    struct Content {
        uint256 id;
        address author;
        string data;
        bool flagged;
        bool verified;
    }

    Content[] public contents;
    mapping(address => uint256) public reputation;
    mapping(uint256 => mapping(address => int8)) public votes; // 1 for upvote, -1 for downvote

    modifier onlyRegistered() {
        require(reputation[msg.sender] > 0, "Not registered");
        _;
    }

    function registerUser() external {
        require(reputation[msg.sender] == 0, "Already registered");
        reputation[msg.sender] = 50; // Default reputation
    }

    function submitContent(string memory data) external onlyRegistered {
        contents.push(Content(contents.length, msg.sender, data, false, false));
    }

    function flagContent(uint256 contentId) external onlyRegistered {
        require(contentId < contents.length, "Invalid ID");
        contents[contentId].flagged = true;
    }

    // Internal function to adjust reputation
    function _adjustReputation(address user, int256 delta) internal {
        if (delta >= 0) {
            reputation[user] += uint256(delta);
        } else {
            uint256 absDelta = uint256(-delta);
            if (reputation[user] > absDelta) {
                reputation[user] -= absDelta;
            } else {
                reputation[user] = 0;
            }
        }
    }
}
