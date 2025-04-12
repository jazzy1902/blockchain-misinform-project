const UserRegistry = artifacts.require("UserRegistry");

contract("UserRegistry", (accounts) => {
  let userRegistry;

  before(async () => {
    userRegistry = await UserRegistry.deployed();
  });

  it("should register a user", async () => {
    await userRegistry.registerUser("testuser", { from: accounts[0] });
    const user = await userRegistry.users(accounts[0]);
    assert.equal(user.username, "testuser");
    assert.equal(user.reputation, 0);
    assert.equal(user.isRegistered, true);
  });

  it("should update reputation", async () => {
    await userRegistry.updateReputation(accounts[0], 10, { from: accounts[0] });
    const reputation = await userRegistry.getUserReputation(accounts[0]);
    assert.equal(reputation, 10);
  });
});