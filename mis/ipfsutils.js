// ipfsUtils.js
const { create } = require('ipfs-http-client');
const fs = require('fs');

// Connect to local IPFS node
const ipfs = create({ url: 'http://localhost:5002/api/v0' });

async function uploadContent(content) {
  const { cid } = await ipfs.add(content);
  return cid.toString();
}

module.exports = { uploadContent };
