import { useState, useEffect } from "react";
import { callContractFunction, callViewFunction, connectWallet } from "../utils/ethers";

function Contracts() {
  const [dataHash, setDataHash] = useState("");
  const [contentId, setContentId] = useState("");
  const [isUpvote, setIsUpvote] = useState(true);
  const [moderateId, setModerateId] = useState("");
  const [isCorrect, setIsCorrect] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    const checkWalletAndRegistration = async () => {
      if (window.ethereum && window.ethereum.selectedAddress) {
        try {
          const address = window.ethereum.selectedAddress;
          setWalletAddress(address);
          setWalletConnected(true);
          const [user, tokenId] = await callViewFunction("userRegistry", "getUser", address);
          setIsRegistered(tokenId > 0 || user.reputation > 0 || user.contentCount > 0);
        } catch (err) {
          console.error("Error checking registration:", err);
          setError("Failed to check registration status. Please reconnect wallet.");
        }
      }
    };
    checkWalletAndRegistration();
  }, []);

  const connect = async () => {
    setLoading(true);
    setError(null);
    try {
      const address = await connectWallet();
      setWalletAddress(address);
      setWalletConnected(true);
      const [user, tokenId] = await callViewFunction("userRegistry", "getUser", address);
      setIsRegistered(tokenId > 0 || user.reputation > 0 || user.contentCount > 0);
      setResult(`Connected wallet: ${address}`);
    } catch (err) {
      setError(`Connection failed: ${err.message}`);
    }
    setLoading(false);
  };

  const registerUser = async () => {
    if (!walletConnected) {
      setError("Please connect MetaMask first.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { receipt } = await callContractFunction("userRegistry", "register");
      const userRegisteredEvent = receipt.logs.find(log => log.event === "UserRegistered");
      const tokenId = userRegisteredEvent ? userRegisteredEvent.args.tokenId.toString() : "Unknown";
      setIsRegistered(true);
      setResult(`Registered successfully! Token ID: ${tokenId}`);
    } catch (err) {
      setError(`Registration failed: ${err.message}`);
    }
    setLoading(false);
  };

  const submitContent = async () => {
    if (!walletConnected) {
      setError("Please connect MetaMask first.");
      return;
    }
    if (!dataHash) {
      setError("Please enter a data hash.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { receipt } = await callContractFunction("contentRegistry", "submitContent", dataHash);
      const contentId = receipt.logs.find(log => log.event === "ContentSubmitted").args.id.toString();
      setResult(`Content submitted with ID: ${contentId}`);
      setDataHash("");
    } catch (err) {
      setError(`Content submission failed: ${err.message}`);
    }
    setLoading(false);
  };

  const voteContent = async () => {
    if (!walletConnected) {
      setError("Please connect MetaMask first.");
      return;
    }
    if (!contentId) {
      setError("Please enter a content ID.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await callContractFunction("contentRegistry", "voteContent", contentId, isUpvote);
      setResult(`Voted ${isUpvote ? "up" : "down"} on content ID: ${contentId}`);
      setContentId("");
    } catch (err) {
      setError(`Voting failed: ${err.message}`);
    }
    setLoading(false);
  };

  const moderateContent = async () => {
    if (!walletConnected) {
      setError("Please connect MetaMask first.");
      return;
    }
    if (!moderateId) {
      setError("Please enter a content ID to moderate.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await callContractFunction("moderation", "moderateContent", moderateId, isCorrect);
      setResult(`Moderated content ID: ${moderateId} as ${isCorrect ? "correct" : "incorrect"}`);
      setModerateId("");
    } catch (err) {
      setError(`Moderation failed: ${err.message}`);
    }
    setLoading(false);
  };

  const getTopModerators = async () => {
    setLoading(true);
    setError(null);
    try {
      const topUsers = await callViewFunction("moderation", "getTop50PercentUsers");
      setResult(`Top moderators (token IDs): ${topUsers.map(id => id.toString()).join(", ")}`);
    } catch (err) {
      setError(`Failed to fetch top moderators: ${err.message}`);
    }
    setLoading(false);
  };

  return (
    <div className=" bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white shadow-sm rounded-lg p-6 max-w-lg w-full">
        <h1 className="text-2xl font-semibold mb-4 text-center">Decentralized Content Platform</h1>

        {!walletConnected && (
          <button
            onClick={connect}
            disabled={loading}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-blue-300 mb-4"
          >
            {loading ? "Connecting..." : "Connect Wallet"}
          </button>
        )}

        {walletConnected && (
          <>
            <p className="text-sm text-gray-600 mb-4">Wallet: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</p>

            {!isRegistered && (
              <div className="mb-6">
                <h2 className="text-lg font-medium mb-2">Register</h2>
                <button
                  onClick={registerUser}
                  disabled={loading}
                  className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-blue-300"
                >
                  {loading ? "Registering..." : "Register"}
                </button>
              </div>
            )}

            {isRegistered && (
              <>
                <div className="mb-6">
                  <h2 className="text-lg font-medium mb-2">Submit Content</h2>
                  <input
                    type="text"
                    value={dataHash}
                    onChange={(e) => setDataHash(e.target.value)}
                    placeholder="Enter data hash (e.g., Qm...)"
                    className="w-full p-2 border rounded-md mb-2"
                  />
                  <button
                    onClick={submitContent}
                    disabled={loading}
                    className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-blue-300"
                  >
                    {loading ? "Submitting..." : "Submit Content"}
                  </button>
                </div>

                <div className="mb-6">
                  <h2 className="text-lg font-medium mb-2">Vote Content</h2>
                  <input
                    type="number"
                    value={contentId}
                    onChange={(e) => setContentId(e.target.value)}
                    placeholder="Enter content ID"
                    className="w-full p-2 border rounded-md mb-2"
                  />
                  <select
                    value={isUpvote}
                    onChange={(e) => setIsUpvote(e.target.value === "true")}
                    className="w-full p-2 border rounded-md mb-2"
                  >
                    <option value={true}>Upvote</option>
                    <option value={false}>Downvote</option>
                  </select>
                  <button
                    onClick={voteContent}
                    disabled={loading}
                    className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-blue-300"
                  >
                    {loading ? "Voting..." : "Vote"}
                  </button>
                </div>

                <div className="mb-6">
                  <h2 className="text-lg font-medium mb-2">Moderate Content</h2>
                  <input
                    type="number"
                    value={moderateId}
                    onChange={(e) => setModerateId(e.target.value)}
                    placeholder="Enter content ID"
                    className="w-full p-2 border rounded-md mb-2"
                  />
                  <select
                    value={isCorrect}
                    onChange={(e) => setIsCorrect(e.target.value === "true")}
                    className="w-full p-2 border rounded-md mb-2"
                  >
                    <option value={true}>Correct</option>
                    <option value={false}>Incorrect</option>
                  </select>
                  <button
                    onClick={moderateContent}
                    disabled={loading}
                    className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-blue-300"
                  >
                    {loading ? "Moderating..." : "Moderate"}
                  </button>
                </div>

                <div className="mb-6">
                  <h2 className="text-lg font-medium mb-2">Get Top Moderators</h2>
                  <button
                    onClick={getTopModerators}
                    disabled={loading}
                    className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-blue-300"
                  >
                    {loading ? "Fetching..." : "Get Top Moderators"}
                  </button>
                </div>
              </>
            )}

            {result && (
              <div className="mt-4 p-3 bg-green-100 text-green-800 rounded-md">
                {result}
              </div>
            )}
            {error && (
              <div className="mt-4 p-3 bg-red-100 text-red-800 rounded-md">
                {error}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Contracts;