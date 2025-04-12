const VotingSystem = artifacts.require("VotingSystem");

contract("VotingSystem", (accounts) => {
  let votingSystem;

  before(async () => {
    const vs = await VotingSystem.deployed();
    votingSystem = vs;
    await votingSystem.registerUser("testuser", { from: accounts[0] });
  });

  it("should add content", async () => {
    const contentId = await votingSystem.addContent("QmHash123", { from: accounts[0] });
    assert.equal(contentId, 0);
  });

  it("should vote on content", async () => {
    await votingSystem.voteContent(0, true, { from: accounts[1] });
    // Verify vote was recorded
    // Note: You'd need to add getter functions to ContentRegistry to properly test this
  });
});