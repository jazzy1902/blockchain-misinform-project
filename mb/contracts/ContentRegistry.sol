pragma solidity ^0.8.0;

contract ContentRegistry {
    struct Content {
        uint256 id;
        address creator;
        string contentHash;
        uint256 upvotes;
        uint256 downvotes;
        bool isVerified;
        bool verificationResult;
        address[] voters;
    }

    Content[] public contents;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    event ContentAdded(uint256 indexed id, address indexed creator, string contentHash);
    event ContentVoted(uint256 indexed id, address indexed voter, bool isUpvote);
    event ContentVerified(uint256 indexed id, bool result);

    function addContent(string memory _contentHash) public returns (uint256) {
        uint256 id = contents.length;
        contents.push(Content({
            id: id,
            creator: msg.sender,
            contentHash: _contentHash,
            upvotes: 0,
            downvotes: 0,
            isVerified: false,
            verificationResult: false,
            voters: new address[](0)
        }));
        
        emit ContentAdded(id, msg.sender, _contentHash);
        return id;
    }

    function voteContent(uint256 _id, bool _isUpvote) public {
        require(_id < contents.length, "Invalid content ID");
        require(!hasVoted[_id][msg.sender], "Already voted");
        
        if (_isUpvote) {
            contents[_id].upvotes++;
        } else {
            contents[_id].downvotes++;
        }
        
        hasVoted[_id][msg.sender] = true;
        contents[_id].voters.push(msg.sender);
        emit ContentVoted(_id, msg.sender, _isUpvote);
    }

    function verifyContent(uint256 _id, bool _result) public {
        require(_id < contents.length, "Invalid content ID");
        contents[_id].isVerified = true;
        contents[_id].verificationResult = _result;
        emit ContentVerified(_id, _result);
    }

    function getContent(uint256 _id) public view returns (
        address, string memory, uint256, uint256, bool, bool
    ) {
        require(_id < contents.length, "Invalid content ID");
        Content memory c = contents[_id];
        return (c.creator, c.contentHash, c.upvotes, c.downvotes, c.isVerified, c.verificationResult);
    }
}