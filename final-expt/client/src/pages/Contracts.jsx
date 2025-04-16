import { useState, useEffect } from "react";
import { callContractFunction, callViewFunction, connectWallet } from "../utils/ethers";
import { ethers } from "ethers";

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
  const [userInfo, setUserInfo] = useState(null);
  const [depositAmount, setDepositAmount] = useState("0.01");
  const [withdrawAmount, setWithdrawAmount] = useState("0.01");

  useEffect(() => {
    const checkWalletAndRegistration = async () => {
      if (window.ethereum && window.ethereum.selectedAddress) {
        try {
          const address = window.ethereum.selectedAddress;
          setWalletAddress(address);
          setWalletConnected(true);
          
          // First check if user is registered
          const isUserRegistered = await callViewFunction("userRegistry", "isRegistered", address);
          setIsRegistered(isUserRegistered);
          
          // Only try to get user details if registered
          if (isUserRegistered) {
            try {
              const userResult = await callViewFunction("userRegistry", "getUser", address);
              const userData = {
                reputation: userResult[0].reputation.toString(),
                contentCount: userResult[0].contentCount.toString(),
                ethDeposit: ethers.formatEther(userResult[0].ethDeposit),
                tokenId: userResult[1].toString()
              };
              setUserInfo(userData);
            } catch (userErr) {
              console.error("Error getting user data:", userErr);
              setError("Failed to get user data. Please try again.");
            }
          }
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
      
      // First check if user is registered
      const isUserRegistered = await callViewFunction("userRegistry", "isRegistered", address);
      setIsRegistered(isUserRegistered);
      
      // Only try to get user details if registered
      if (isUserRegistered) {
        try {
          const userResult = await callViewFunction("userRegistry", "getUser", address);
          const userData = {
            reputation: userResult[0].reputation.toString(),
            contentCount: userResult[0].contentCount.toString(),
            ethDeposit: ethers.formatEther(userResult[0].ethDeposit),
            tokenId: userResult[1].toString()
          };
          setUserInfo(userData);
        } catch (userErr) {
          console.error("Error getting user data:", userErr);
        }
      }
      
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
      
      console.log("Register receipt:", receipt);
      let tokenId = "Unknown";
      
      // Find TokenId from logs - simplified version
      try {
        // Wait a moment for blockchain to stabilize
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if registration was successful
        const isRegistered = await callViewFunction("userRegistry", "isRegistered", walletAddress);
        setIsRegistered(isRegistered);
        
        if (isRegistered) {
          // Get user data
          const userResult = await callViewFunction("userRegistry", "getUser", walletAddress);
          tokenId = userResult[1].toString();
          
          const userData = {
            reputation: userResult[0].reputation.toString(),
            contentCount: userResult[0].contentCount.toString(),
            ethDeposit: ethers.formatEther(userResult[0].ethDeposit),
            tokenId: tokenId
          };
          setUserInfo(userData);
        }
        
        setResult(`Registered successfully! Token ID: ${tokenId}`);
      } catch (userErr) {
        console.error("Error getting user data after registration:", userErr);
        setResult("Registration transaction succeeded, but couldn't get token ID.");
      }
    } catch (err) {
      setError(`Registration failed: ${err.message}`);
    }
    setLoading(false);
  };

  const depositETH = async () => {
    if (!walletConnected || !isRegistered || !userInfo) {
      setError("Please connect wallet and register first.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await callContractFunction(
        "userRegistry", 
        "depositETH", 
        userInfo.tokenId, 
        { value: ethers.parseEther(depositAmount) }
      );
      
      // Get updated user data
      try {
        const userResult = await callViewFunction("userRegistry", "getUser", walletAddress);
        const userData = {
          reputation: userResult[0].reputation.toString(),
          contentCount: userResult[0].contentCount.toString(),
          ethDeposit: ethers.formatEther(userResult[0].ethDeposit),
          tokenId: userResult[1].toString()
        };
        setUserInfo(userData);
      } catch (userErr) {
        console.error("Error getting updated user data:", userErr);
      }
      
      setResult(`Deposited ${depositAmount} ETH successfully`);
    } catch (err) {
      setError(`Deposit failed: ${err.message}`);
    }
    setLoading(false);
  };

  const withdrawETH = async () => {
    if (!walletConnected || !isRegistered || !userInfo) {
      setError("Please connect wallet and register first.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await callContractFunction(
        "userRegistry", 
        "withdrawETH", 
        userInfo.tokenId, 
        ethers.parseEther(withdrawAmount)
      );
      
      // Get updated user data
      try {
        const userResult = await callViewFunction("userRegistry", "getUser", walletAddress);
        const userData = {
          reputation: userResult[0].reputation.toString(),
          contentCount: userResult[0].contentCount.toString(),
          ethDeposit: ethers.formatEther(userResult[0].ethDeposit),
          tokenId: userResult[1].toString()
        };
        setUserInfo(userData);
      } catch (userErr) {
        console.error("Error getting updated user data:", userErr);
      }
      
      setResult(`Withdrew ${withdrawAmount} ETH successfully`);
    } catch (err) {
      setError(`Withdrawal failed: ${err.message}`);
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
      console.log("Submit content receipt:", receipt);
      
      try {
        // Wait a moment for blockchain to stabilize
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Get content count to determine the ID
        const contentCount = await callViewFunction("contentRegistry", "getContentsCount");
        const contentId = (parseInt(contentCount.toString()) - 1).toString();
        
        // Update user info after submitting content
        const userResult = await callViewFunction("userRegistry", "getUser", walletAddress);
        const userData = {
          reputation: userResult[0].reputation.toString(),
          contentCount: userResult[0].contentCount.toString(),
          ethDeposit: ethers.formatEther(userResult[0].ethDeposit),
          tokenId: userResult[1].toString()
        };
        setUserInfo(userData);
        
        setResult(`Content submitted with ID: ${contentId}`);
      } catch (contentErr) {
        console.error("Error getting content data:", contentErr);
        setResult("Content submitted successfully, but couldn't get the content ID.");
      }
      
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
      
      // Update user info after voting
      const userResult = await callViewFunction("userRegistry", "getUser", walletAddress);
      const userData = {
        reputation: userResult[0].reputation.toString(),
        contentCount: userResult[0].contentCount.toString(),
        ethDeposit: ethers.formatEther(userResult[0].ethDeposit),
        tokenId: userResult[1].toString()
      };
      setUserInfo(userData);
      
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
      
      // Update user info after moderation
      const userResult = await callViewFunction("userRegistry", "getUser", walletAddress);
      const userData = {
        reputation: userResult[0].reputation.toString(),
        contentCount: userResult[0].contentCount.toString(),
        ethDeposit: ethers.formatEther(userResult[0].ethDeposit),
        tokenId: userResult[1].toString()
      };
      setUserInfo(userData);
      
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
                  {loading ? "Registering..." : "Register (0.01 ETH deposit)"}
                </button>
              </div>
            )}

            {isRegistered && userInfo && (
              <>
                <div className="mb-6 p-4 bg-gray-50 rounded-md">
                  <h2 className="text-lg font-medium mb-2">Your Account</h2>
                  <p><span className="font-medium">Token ID:</span> {userInfo.tokenId}</p>
                  <p><span className="font-medium">Reputation:</span> {userInfo.reputation}</p>
                  <p><span className="font-medium">ETH Deposit:</span> {userInfo.ethDeposit} ETH</p>
                </div>
                
                <div className="mb-6">
                  <h2 className="text-lg font-medium mb-2">Manage Deposit</h2>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="flex-grow p-2 border rounded-md"
                      placeholder="ETH Amount"
                    />
                    <button
                      onClick={depositETH}
                      disabled={loading}
                      className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-blue-300"
                    >
                      Deposit
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="flex-grow p-2 border rounded-md"
                      placeholder="ETH Amount"
                    />
                    <button
                      onClick={withdrawETH}
                      disabled={loading}
                      className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-blue-300"
                    >
                      Withdraw
                    </button>
                  </div>
                </div>

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
                    {loading ? "Submitting..." : "Submit Content (0.005 ETH)"}
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
                    {loading ? "Voting..." : "Vote (0.001 ETH)"}
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
                    {loading ? "Moderating..." : "Moderate (0.01 ETH)"}
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