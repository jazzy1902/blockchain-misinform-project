// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

contract UserRegistry {
    mapping(address => bool) public isRegistered;
    mapping(address => uint256) public reputation;

    event UserRegistered(address user);
    
    modifier onlyRegistered() {
        require(isRegistered[msg.sender], "Not registered");
        _;
    }

    function register() external {
        require(!isRegistered[msg.sender], "Already registered");
        isRegistered[msg.sender] = true;
        reputation[msg.sender] = 0;
        emit UserRegistered(msg.sender);
    }

    function getReputation(address user) external view returns (uint256) {
        return reputation[user];
    }

    function _adjustReputation(address user, int256 change) internal {
        uint256 current = reputation[user];
        if (change >= 0) {
            reputation[user] = current + uint256(change);
        } else {
            uint256 decrease = uint256(-change);
            reputation[user] = (current > decrease) ? current - decrease : 0;
        }
    }
}
