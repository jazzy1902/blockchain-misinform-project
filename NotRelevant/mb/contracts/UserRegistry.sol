pragma solidity ^0.8.0;

contract UserRegistry {
    struct User {
        address userAddress;
        string username;
        uint256 reputation;
        bool isRegistered;
    }

    mapping(address => User) public users;
    address[] public userAddresses;

    event UserRegistered(address indexed user, string username);
    event ReputationUpdated(address indexed user, uint256 newReputation);

    function registerUser(string memory _username) public {
        require(!users[msg.sender].isRegistered, "User already registered");
        
        users[msg.sender] = User({
            userAddress: msg.sender,
            username: _username,
            reputation: 0,
            isRegistered: true
        });
        
        userAddresses.push(msg.sender);
        emit UserRegistered(msg.sender, _username);
    }

    function updateReputation(address _user, uint256 _reputationChange) public {
        require(users[_user].isRegistered, "User not registered");
        users[_user].reputation += _reputationChange;
        emit ReputationUpdated(_user, users[_user].reputation);
    }

    function getUserReputation(address _user) public view returns (uint256) {
        return users[_user].reputation;
    }

    function getTopUsers(uint256 _count) public view returns (address[] memory) {
        require(_count <= userAddresses.length, "Count exceeds total users");
        
        address[] memory topUsers = new address[](_count);
        // In a real implementation, you'd sort by reputation
        // For simplicity, we're just returning the first _count users
        for (uint256 i = 0; i < _count; i++) {
            topUsers[i] = userAddresses[i];
        }
        return topUsers;
    }
}