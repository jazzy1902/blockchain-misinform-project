const ContentRegistry = artifacts.require("ContentRegistry");
const UserRegistry = artifacts.require("UserRegistry");
const Moderation = artifacts.require("Moderation");

module.exports = async function(callback) {
  try {
    const accounts = await web3.eth.getAccounts();
    const contentRegistry = await ContentRegistry.deployed();
    const userRegistry = await UserRegistry.deployed();
    const moderation = await Moderation.deployed();

    console.log("Content Registry address:", contentRegistry.address);
    console.log("User Registry address:", userRegistry.address);
    console.log("Moderation address:", moderation.address);

    // Check if the contracts are correctly linked
    const contentRegistryUserRegistry = await contentRegistry.userRegistry();
    console.log("Content Registry points to User Registry:", contentRegistryUserRegistry);
    console.log("Should match:", userRegistry.address);

    const contentRegistryModeration = await contentRegistry.moderation();
    console.log("Content Registry knows about Moderation:", contentRegistryModeration);

    const moderationUserRegistry = await moderation.userRegistry();
    console.log("Moderation points to User Registry:", moderationUserRegistry);
    console.log("Should match:", userRegistry.address);

    const userRegistryContentRegistry = await userRegistry.contentRegistry();
    console.log("User Registry knows about Content Registry:", userRegistryContentRegistry);
    console.log("Should match:", contentRegistry.address);

    const userRegistryModeration = await userRegistry.moderation();
    console.log("User Registry knows about Moderation:", userRegistryModeration);
    console.log("Should match:", moderation.address);

    // Try to register a user
    console.log("\nTrying to register a user...");
    try {
      const tx = await userRegistry.register({ from: accounts[0], value: web3.utils.toWei("0.01", "ether") });
      console.log("User registered successfully!");
      console.log("Transaction hash:", tx.tx);
    } catch (err) {
      console.log("Error registering user:", err.message);
    }

    // Check user registration
    const isRegistered = await userRegistry.isRegistered(accounts[0]);
    console.log("Is account[0] registered?", isRegistered);

    if (isRegistered) {
      const userData = await userRegistry.getUser(accounts[0]);
      console.log("User data:", userData);
      
      // Try to submit content
      console.log("\nTrying to submit content...");
      try {
        const tx = await contentRegistry.submitContent("QmTest123", { 
          from: accounts[0], 
          value: web3.utils.toWei("0.005", "ether"),
          gas: 500000
        });
        console.log("Content submitted successfully!");
        console.log("Transaction hash:", tx.tx);
      } catch (err) {
        console.log("Error submitting content:", err.message);
      }
    }

    callback();
  } catch (error) {
    console.error("Error during debugging:", error);
    callback(error);
  }
}; 