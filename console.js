const MediaRegistry = artifacts.require("MediaRegistry");

module.exports = async function(callback) {
  try {
    const instance = await MediaRegistry.deployed();
    const accounts = await web3.eth.getAccounts();

    // Register 3 media houses
    await instance.registerMediaHouse("Alpha Media", { from: accounts[0] });
    await instance.registerMediaHouse("Bravo News", { from: accounts[1] });
    await instance.registerMediaHouse("Charlie Times", { from: accounts[2] });

    // Request verification for Alpha Media (tokenId = 1)
    await instance.requestVerification(1, { from: accounts[0] });

    // Bravo and Charlie vote for Alpha
    await instance.voteOnVerification(1, true, { from: accounts[1] });
    await instance.voteOnVerification(1, true, { from: accounts[2] });

    // Log verification status
    const mediaHouse = await instance.tokenIdToMediaHouses(1);
    console.log("Alpha Media verified:", mediaHouse.isVerified);

    // Log reputation updates
    const rep2 = await instance.tokenIdToMediaHouses(2);
    const rep3 = await instance.tokenIdToMediaHouses(3);
    console.log("Bravo News reputation:", rep2.reputation.toString());
    console.log("Charlie Times reputation:", rep3.reputation.toString());

    callback();
  } catch (err) {
    console.error("Script failed:", err);
    callback(err);
  }
};
