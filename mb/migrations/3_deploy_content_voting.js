const ContentRegistry = artifacts.require("ContentRegistry");
const VotingSystem = artifacts.require("VotingSystem");

module.exports = async function(deployer) {
  await deployer.deploy(ContentRegistry);
  const crInstance = await ContentRegistry.deployed();
  
  await deployer.deploy(UserRegistry);
  const urInstance = await UserRegistry.deployed();
  
  await deployer.deploy(VotingSystem, urInstance.address, crInstance.address);
};