const UserRegistry = artifacts.require("UserRegistry");
const ContentRegistry = artifacts.require("ContentRegistry");
const Moderation = artifacts.require("Moderation");

module.exports = async function (callback) {
  try {
    const accounts = await web3.eth.getAccounts();
    const deployer = accounts[0];
    const user1 = accounts[1];
    const user2 = accounts[2];

    console.log("Deploying UserRegistry...");
    const userRegistry = await UserRegistry.new({ from: deployer });
    console.log("UserRegistry deployed at:", userRegistry.address);

    console.log("Deploying ContentRegistry...");
    const contentRegistry = await ContentRegistry.new(userRegistry.address, { from: deployer });
    console.log("ContentRegistry deployed at:", contentRegistry.address);

    console.log("Deploying Moderation...");
    const moderation = await Moderation.new(userRegistry.address, contentRegistry.address, { from: deployer });
    console.log("Moderation deployed at:", moderation.address);

    console.log("Setting moderation contract in ContentRegistry...");
    await contentRegistry.setModerationContract(moderation.address, { from: deployer });
    console.log("Moderation contract set.");

    // Output addresses for ethers.js
    console.log("\n=== Contract Addresses for ethers.js ===");
    console.log(`const userRegistryAddress = "${userRegistry.address}";`);
    console.log(`const contentRegistryAddress = "${contentRegistry.address}";`);
    console.log(`const moderationAddress = "${moderation.address}";`);

    // Test 1: Register users
    console.log("\n=== Test 1: Registering Users ===");
    console.log("Registering user1...");
    let tx = await userRegistry.register({ from: user1 });
    let tokenId1 = tx.logs.find(log => log.event === "UserRegistered").args.tokenId.toString();
    console.log(`User1 registered with tokenId: ${tokenId1}`);

    console.log("Registering user2...");
    tx = await userRegistry.register({ from: user2 });
    let tokenId2 = tx.logs.find(log => log.event === "UserRegistered").args.tokenId.toString();
    console.log(`User2 registered with tokenId: ${tokenId2}`);

    console.log("\nAll tests completed successfully!");
    callback();
  } catch (error) {
    console.error("Error:", error);
    callback(error);
  }
};