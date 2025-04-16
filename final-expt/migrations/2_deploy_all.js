const UserRegistry = artifacts.require("UserRegistry");
const ContentRegistry = artifacts.require("ContentRegistry");
const Moderation = artifacts.require("Moderation");

module.exports = async function (deployer, network, accounts) {
  // 1. Deploy UserRegistry
  await deployer.deploy(UserRegistry);
  const userRegistry = await UserRegistry.deployed();

  // 2. Deploy ContentRegistry, passing UserRegistry address
  await deployer.deploy(ContentRegistry, userRegistry.address);
  const contentRegistry = await ContentRegistry.deployed();

  // 3. Deploy Moderation, passing UserRegistry and ContentRegistry addresses
  await deployer.deploy(Moderation, userRegistry.address, contentRegistry.address);
  const moderation = await Moderation.deployed();

  // 4. Set approved contracts in UserRegistry
  await userRegistry.setApprovedContracts(contentRegistry.address, moderation.address);
  console.log("Set approved contracts in UserRegistry");

  console.log("UserRegistry deployed at:", userRegistry.address);
  console.log("ContentRegistry deployed at:", contentRegistry.address);
  console.log("Moderation deployed at:", moderation.address);
};
