// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "./MediaRegistry.sol";

contract ContentRegistry is MediaRegistry {

    struct Article {
        string title;
        string ipfsHash; // Content stored on IPFS
        uint256 timestamp;
    }


    // mapping token id to articles
    mapping(uint256 => Article[]) public publishedArticles;

    event ArticlePosted(uint256 tokenId, string title, string ipfsHash);

    function postArticle(string memory title, string memory ipfsHash) external {
        require(bytes(title).length > 0, "Title is required");
        require(bytes(ipfsHash).length > 0, "IPFS hash is required");
        require(balanceOf(msg.sender) > 0, "Not a registered media house");

        uint256 tokenId = addressToTokenId[msg.sender];

        publishedArticles[tokenId].push(
            Article({
                title: title,
                ipfsHash: ipfsHash,
                timestamp: block.timestamp
            })
        );

        emit ArticlePosted(tokenId, title, ipfsHash);
    }

    function getArticlesbyToken(uint256 tokenId ) public view returns (Article[] memory) {
        return publishedArticles[tokenId];
    }
}
