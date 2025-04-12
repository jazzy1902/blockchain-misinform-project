const { create } = require('ipfs-http-client');

const IPFS_API = {
  host: 'localhost',
  port: 5001,
  protocol: 'http'
};

const useIPFS = () => {
  let ipfs;

  try {
    ipfs = create(IPFS_API);
    console.log('Connected to Local IPFS Node');
  } catch (err) {
    console.error('Failed to connect to Local IPFS Node:', err);
    throw new Error('IPFS connection failed.');
  }

  const uploadToIPFS = async (content, options = {}) => {
    try {
      const { onProgress } = options;
      let file;

      if (typeof content === 'string') {
        file = {
          content: Buffer.from(content),
          path: 'data.txt',
        };
      } else if (Buffer.isBuffer(content) || (content.content && content.path)) {
        file = content;
      } else {
        throw new Error('Invalid content: must be string, buffer, or file object');
      }

      const { path: cid } = await ipfs.add(file, {
        progress: onProgress
          ? (bytes) => onProgress(bytes / (file.content.length || file.size))
          : undefined,
      });

      return cid;
    } catch (err) {
      console.error('IPFS upload error:', err);
      throw new Error('Failed to upload to IPFS. Please check your local node.');
    }
  };

  const getFromIPFS = async (cid) => {
    try {
      const chunks = [];
      for await (const chunk of ipfs.cat(cid)) {
        chunks.push(chunk);
      }
      const data = Buffer.concat(chunks);
      return data;
    } catch (err) {
      console.error('IPFS retrieval error:', err);
      throw new Error('Failed to retrieve data from IPFS. Please check the CID or node.');
    }
  };

  return { uploadToIPFS, getFromIPFS };
};

module.exports = useIPFS;