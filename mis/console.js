const UserRegistry = artifacts.require("UserRegistry");
const ContentRegistry = artifacts.require("ContentRegistry");
const Moderation = artifacts.require("Moderation");
const { create } = require("ipfs-http-client");

module.exports = async function (callback) {
  try {
    console.log("Starting console script for Misinformation Blockchain Project with local IPFS...\n");

    // Initialize IPFS client for local node
    console.log("Connecting to local IPFS node...");
    let ipfs;
    try {
      ipfs = await create({ host: "127.0.0.1", port: 5001, protocol: "http" });
      console.log("Connected to local IPFS node at http://127.0.0.1:5001");
    } catch (error) {
      throw new Error(
        "Failed to connect to local IPFS node. Ensure `ipfs daemon` is running (run `ipfs daemon` in a terminal)."
      );
    }

    // Get accounts from Ganache
    const accounts = await web3.eth.getAccounts();
    const deployer = accounts[0];
    const user1 = accounts[1];
    const user2 = accounts[2];
    const user3 = accounts[3];
    const tempUser1 = accounts[4];
    const tempUser2 = accounts[5];
    const tempUser3 = accounts[6];
    const tempUser4 = accounts[7];

    console.log("Deployer address:", deployer);
    console.log("User1 address:", user1);
    console.log("User2 address:", user2);
    console.log("User3 address:", user3);
    console.log("TempUser1 address:", tempUser1);
    console.log("TempUser2 address:", tempUser2);
    console.log("TempUser3 address:", tempUser3);
    console.log("TempUser4 address:", tempUser4);
    console.log("\n");

    // Deploy contracts
    console.log("Deploying UserRegistry...");
    const userRegistry = await UserRegistry.new({ from: deployer });
    console.log("UserRegistry deployed at:", userRegistry.address);

    console.log("Deploying ContentRegistry...");
    const contentRegistry = await ContentRegistry.new(userRegistry.address, { from: deployer });
    console.log("ContentRegistry deployed at:", contentRegistry.address);

    console.log("Deploying Moderation...");
    const moderation = await Moderation.new(userRegistry.address, contentRegistry.address, { from: deployer });
    console.log("Moderation deployed at:", moderation.address);

    // Set approved contracts in UserRegistry
    console.log("Setting approved contracts in UserRegistry...");
    await userRegistry.setApprovedContracts(contentRegistry.address, moderation.address, { from: deployer });
    console.log("Approved contracts set.\n");

    // Test 1: Register users
    console.log("=== Test 1: Registering Users ===");
    console.log("Registering user1...");
    let tx = await userRegistry.register({ from: user1 });
    let tokenId1 = tx.logs.find(log => log.event === "Transfer").args.tokenId.toString();
    console.log(`User1 registered with tokenId: ${tokenId1}`);

    console.log("Registering user2...");
    tx = await userRegistry.register({ from: user2 });
    let tokenId2 = tx.logs.find(log => log.event === "Transfer").args.tokenId.toString();
    console.log(`User2 registered with tokenId: ${tokenId2}`);

    console.log("Registering user3...");
    tx = await userRegistry.register({ from: user3 });
    let tokenId3 = tx.logs.find(log => log.event === "Transfer").args.tokenId.toString();
    console.log(`User3 registered with tokenId: ${tokenId3}`);

    console.log("Registering tempUser1...");
    tx = await userRegistry.register({ from: tempUser1 });
    let tokenIdTemp1 = tx.logs.find(log => log.event === "Transfer").args.tokenId.toString();
    console.log(`TempUser1 registered with tokenId: ${tokenIdTemp1}`);

    console.log("Registering tempUser2...");
    tx = await userRegistry.register({ from: tempUser2 });
    let tokenIdTemp2 = tx.logs.find(log => log.event === "Transfer").args.tokenId.toString();
    console.log(`TempUser2 registered with tokenId: ${tokenIdTemp2}`);

    console.log("Registering tempUser3...");
    tx = await userRegistry.register({ from: tempUser3 });
    let tokenIdTemp3 = tx.logs.find(log => log.event === "Transfer").args.tokenId.toString();
    console.log(`TempUser3 registered with tokenId: ${tokenIdTemp3}`);

    console.log("Registering tempUser4...");
    tx = await userRegistry.register({ from: tempUser4 });
    let tokenIdTemp4 = tx.logs.find(log => log.event === "Transfer").args.tokenId.toString();
    console.log(`TempUser4 registered with tokenId: ${tokenIdTemp4}`);

    // Check user count
    const userCount = await userRegistry.getUserCount();
    console.log(`Total users registered: ${userCount.toString()}\n`);

    // Test 2: Submit content with IPFS
    console.log("=== Test 2: Submitting Content to IPFS ===");
    // Create sample content
    const content = {
      title: "Test Post",
      body: "This is a test post for the misinformation project.",
      author: user1,
      timestamp: Date.now(),
    };
    console.log("Uploading content to IPFS:", content);

    // Upload to IPFS
    const contentBuffer = Buffer.from(JSON.stringify(content));
    const ipfsResult = await ipfs.add(contentBuffer);
    const dataHash = ipfsResult.cid.toString();
    console.log(`Content uploaded to IPFS with CID: ${dataHash}`);

    // Submit content to blockchain
    console.log(`User1 submitting content with IPFS CID: ${dataHash}`);
    tx = await contentRegistry.submitContent(dataHash, { from: user1 });
    let contentId = tx.logs.find(log => log.event === "ContentSubmitted").args.id.toString();
    console.log(`Content submitted to blockchain with ID: ${contentId}`);

    // Verify user1's reputation (should increase by 1)
    let user1Data = await userRegistry.getUser(user1);
    console.log(`User1 reputation after submitting content: ${user1Data[0].reputation.toString()}\n`);

    // Test 3: Voting on content
    console.log("=== Test 3: Voting on Content ===");
    console.log(`User2 upvoting content ID ${contentId}...`);
    await contentRegistry.voteContent(contentId, true, { from: user2 });
    console.log(`User3 downvoting content ID ${contentId}...`);
    await contentRegistry.voteContent(contentId, false, { from: user3 });

    // Check content vote score
    let contentOnChain = await contentRegistry.contents(contentId);
    console.log(`Content vote score: ${contentOnChain.voteScore.toString()}`);

    // Simulate enough downvotes to flag content
    console.log("Simulating multiple downvotes to flag content...");
    const tempUsers = [tempUser1, tempUser2, tempUser3, tempUser4];
    for (let i = 0; i < tempUsers.length; i++) {
      console.log(`TempUser${i + 1} downvoting content ID ${contentId}...`);
      await contentRegistry.voteContent(contentId, false, { from: tempUsers[i] });
    }
    contentOnChain = await contentRegistry.contents(contentId);
    console.log(`Content vote score after downvotes: ${contentOnChain.voteScore.toString()}`);
    console.log(`Content flagged: ${contentOnChain.flagged}\n`);

    // Test 4: Moderation by high-reputation users
    console.log("=== Test 4: Moderating Content ===");
    // Boost user1 and user2 reputations to meet MIN_REP (100) and ensure top 50%
    console.log("Boosting user1 and user2 reputations to qualify as moderators...");
    await userRegistry.adjustReputation(tokenId1, 100, { from: contentRegistry.address });
    await userRegistry.adjustReputation(tokenId2, 101, { from: contentRegistry.address });
    user1Data = await userRegistry.getUser(user1);
    let user2Data = await userRegistry.getUser(user2);
    console.log(`User1 reputation: ${user1Data[0].reputation.toString()}`);
    console.log(`User2 reputation: ${user2Data[0].reputation.toString()}`);

    // Verify top 50% users
    console.log("Checking top 50% users...");
    const topUsers = await moderation.getTop50PercentUsers();
    console.log("Top 50% user token IDs:", topUsers.map(id => id.toString()));

    // Moderate content
    console.log(`User1 moderating content ID ${contentId} as incorrect...`);
    await moderation.moderateContent(contentId, false, { from: user1 });
    console.log(`User2 moderating content ID ${contentId} as incorrect...`);
    await moderation.moderateContent(contentId, false, { from: user2 });

    // Check reputations after moderation
    console.log("Checking reputations after moderation...");
    user1Data = await userRegistry.getUser(user1);
    user2Data = await userRegistry.getUser(user2);
    let user3Data = await userRegistry.getUser(user3);
    console.log(`User1 (author, moderator) reputation: ${user1Data[0].reputation.toString()}`);
    console.log(`User2 (upvoter, moderator) reputation: ${user2Data[0].reputation.toString()}`);
    console.log(`User3 (downvoter) reputation: ${user3Data[0].reputation.toString()}\n`);

    console.log("Testing complete!");
    callback();
  } catch (error) {
    console.error("Error:", error);
    callback(error);
  }
};