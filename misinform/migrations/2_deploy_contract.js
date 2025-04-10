const MediaRegistry = artifacts.require("MediaRegistry");

module.exports = function(deployer) {
    deployer.deploy(MediaRegistry);
}