pragma solidity ^0.8.0;

contract MisinformationCombat {
    // Structure to store content details
    struct Content {
        string contentID; // IPFS hash
        address publisher;
        uint256 upvotes;
        uint256 downvotes;
        bool flagged;
        mapping(address => bool) hasVoted; // Tracks if user has voted
    }

    // Mapping to store registered users
    mapping(address => bool) public registeredUsers;

    // Mapping to store content by contentID
    mapping(string => Content) public contents;

    // Store list of content IDs for iteration
    string[] public contentIDs;

    // Threshold for flagging content
    uint256 public constant FLAG_THRESHOLD = 10; // Adjustable

    // Voting fee (in wei)
    uint256 public constant VOTE_FEE = 0.001 ether;

    // Events
    event UserRegistered(address indexed user);
    event ContentSubmitted(string indexed contentID, address indexed publisher);
    event Upvoted(string indexed contentID, address indexed voter);
    event Downvoted(string indexed contentID, address indexed voter);
    event ContentFlagged(string indexed contentID);

    // Modifier to check if user is registered
    modifier onlyRegistered() {
        require(registeredUsers[msg.sender], "User not registered");
        _;
    }

    // Register a user
    function registerUser() external {
        require(!registeredUsers[msg.sender], "User already registered");
        registeredUsers[msg.sender] = true;
        emit UserRegistered(msg.sender);
    }

    // Submit content
    function submitContent(string memory _contentID) external onlyRegistered {
        require(bytes(_contentID).length > 0, "Invalid content ID");
        require(bytes(contents[_contentID].contentID).length == 0, "Content already exists");

        Content storage newContent = contents[_contentID];
        newContent.contentID = _contentID;
        newContent.publisher = msg.sender;
        newContent.upvotes = 0;
        newContent.downvotes = 0;
        newContent.flagged = false;

        contentIDs.push(_contentID);
        emit ContentSubmitted(_contentID, msg.sender);
    }

    // Upvote content
    function upvote(string memory _contentID) external payable onlyRegistered {
        require(bytes(contents[_contentID].contentID).length > 0, "Content does not exist");
        require(!contents[_contentID].hasVoted[msg.sender], "User already voted");
        require(msg.value == VOTE_FEE, "Incorrect fee amount");

        Content storage content = contents[_contentID];
        content.upvotes += 1;
        content.hasVoted[msg.sender] = true;

        emit Upvoted(_contentID, msg.sender);
    }

    // Downvote content
    function downvote(string memory _contentID) external payable onlyRegistered {
        require(bytes(contents[_contentID].contentID).length > 0, "Content does not exist");
        require(!contents[_contentID].hasVoted[msg.sender], "User already voted");
        require(msg.value == VOTE_FEE, "Incorrect fee amount");

        Content storage content = contents[_contentID];
        content.downvotes += 1;
        content.hasVoted[msg.sender] = true;

        // Check if content should be flagged
        if (content.downvotes >= FLAG_THRESHOLD && !content.flagged) {
            content.flagged = true;
            emit ContentFlagged(_contentID);
        }

        emit Downvoted(_contentID, msg.sender);
    }

    // Get content details
    function getContent(string memory _contentID) external view returns (
        string memory contentID,
        address publisher,
        uint256 upvotes,
        uint256 downvotes,
        bool flagged
    ) {
        require(bytes(contents[_contentID].contentID).length > 0, "Content does not exist");
        Content storage content = contents[_contentID];
        return (
            content.contentID,
            content.publisher,
            content.upvotes,
            content.downvotes,
            content.flagged
        );
    }

    // Get all content IDs
    function getAllContentIDs() external view returns (string[] memory) {
        return contentIDs;
    }

    // Check if user has voted on content
    function hasUserVoted(string memory _contentID, address _user) external view returns (bool) {
        require(bytes(contents[_contentID].contentID).length > 0, "Content does not exist");
        return contents[_contentID].hasVoted[_user];
    }

    // Withdraw collected fees (for contract owner, optional)
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        payable(owner).transfer(balance);
    }
}