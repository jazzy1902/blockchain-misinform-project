const UserRegistry = artifacts.require("UserRegistry");
const ContentRegistry = artifacts.require("ContentRegistry");
const Moderation = artifacts.require("Moderation");

module.exports = async function (deployer) {
  await deployer.deploy(UserRegistry);
  const userRegistry = await UserRegistry.deployed();

  await deployer.deploy(ContentRegistry, userRegistry.address);
  const contentRegistry = await ContentRegistry.deployed();

  await deployer.deploy(Moderation, userRegistry.address, contentRegistry.address);
};
