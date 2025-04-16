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

    // Set the moderation contract in content registry
    console.log("\nSetting moderation contract in ContentRegistry...");
    try {
      await contentRegistry.setModerationContract(moderation.address, { from: accounts[0] });
      console.log("Successfully set moderation contract in ContentRegistry");
    } catch (err) {
      console.log("Error setting moderation contract:", err.message);
    }

    // Verify the setup
    const contentRegistryModeration = await contentRegistry.moderation();
    console.log("Content Registry moderation address:", contentRegistryModeration);
    console.log("Should match:", moderation.address);

    callback();
  } catch (error) {
    console.error("Error during setup:", error);
    callback(error);
  }
}; 