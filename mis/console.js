const Moderation = artifacts.require("Moderation");

module.exports = async function (callback) {
    try {
        const accounts = await web3.eth.getAccounts();
        const modInstance = await Moderation.deployed();

        // 1. Register 10 users
        for (let i = 0; i < 10; i++) {
            const rep = await modInstance.reputation(accounts[i]);
            if (rep.toNumber() === 0) {
                await modInstance.registerUser({ from: accounts[i] });
                console.log(`✅ Registered user ${accounts[i]}`);
            }
        }

        // 2. Submit content from account[2]
        await modInstance.submitContent("Testing moderation system", { from: accounts[2] });
        console.log("📝 Content submitted by accounts[2]");

        // 3. Flag the content by account[1]
        await modInstance.flagContent(0, { from: accounts[1] });
        console.log("🚩 Content flagged by accounts[1]");

        // 4. Moderate using 3 different users
        await modInstance.moderateContent(0, true, { from: accounts[1] });
        console.log("🔍 Moderated by accounts[1] (true)");

        await modInstance.moderateContent(0, true, { from: accounts[3] });
        console.log("🔍 Moderated by accounts[3] (true)");

        await modInstance.moderateContent(0, true, { from: accounts[4] });
        console.log("🔍 Moderated by accounts[4] (true)");

        // 5. Check result
        const content = await modInstance.contents(0);
        console.log("📜 Final verdict (verified):", content.verified);

        callback();
    } catch (err) {
        console.error("❌ Error:", err);
        callback(err);
    }
};
