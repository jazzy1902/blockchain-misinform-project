import { ethers } from "ethers";

import contentRegistryJSON from "../../../build/contracts/ContentRegistry.json" assert { type: "json" };
import moderationJSON from "../../../build/contracts/Moderation.json" assert { type: "json" };
import userRegistryJSON from "../../../build/contracts/UserRegistry.json" assert { type: "json" };

const contentRegistryABI = contentRegistryJSON.abi;
const moderationABI = moderationJSON.abi;
const userRegistryABI = userRegistryJSON.abi;

// Update these after running `truffle test ./test/registerUsers.js`
const contentRegistryAddress = "0x1c691E6eB2D68f074048bA3636Bf8C2af96F979c"; 
const moderationAddress = "0x94Afad6F4424504609f0E4c5826710f66612c13D"; 
const userRegistryAddress = "0xFDDB63810C571D8729899579686b4cA4e5CE64AF"; 

let provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
let contentRegistry, moderation, userRegistry;
let signer = null;

// Initialize contracts with provider by default
const initializeContracts = (contractSigner = provider) => {
  contentRegistry = new ethers.Contract(contentRegistryAddress, contentRegistryABI, contractSigner);
  moderation = new ethers.Contract(moderationAddress, moderationABI, contractSigner);
  userRegistry = new ethers.Contract(userRegistryAddress, userRegistryABI, contractSigner);
};

// Initial setup
initializeContracts();

export const connectWallet = async () => {
  if (!window.ethereum) {
    throw new Error("MetaMask not detected. Please install MetaMask.");
  }
  try {
    await window.ethereum.request({ method: "eth_requestAccounts" });
    const browserProvider = new ethers.BrowserProvider(window.ethereum);
    signer = await browserProvider.getSigner();
    const address = await signer.getAddress();

    // Reinitialize contracts with signer
    initializeContracts(signer);

    const network = await browserProvider.getNetwork();
    console.log("Network chain ID:", network.chainId);
    // Check for either Ganache's default ID or the one shown in your environment
    if (network.chainId !== 1337n && network.chainId !== BigInt(1744814035948) && network.chainId !== BigInt(1744832632024)) {
      throw new Error("Please connect MetaMask to Ganache. Current chain ID: " + network.chainId);
    }

    console.log("Connected wallet:", address);
    console.log("UserRegistry contract:", userRegistry.runner?.address);
    return address;
  } catch (error) {
    console.error("Error connecting to MetaMask:", error);
    throw error;
  }
};

export const getContracts = () => {
  if (!contentRegistry || !moderation || !userRegistry) {
    initializeContracts(signer || provider);
  }
  return { contentRegistry, moderation, userRegistry };
};

export const callContractFunction = async (contractName, functionName, ...args) => {
  const contracts = getContracts();
  const contract = contracts[contractName];
  if (!contract) throw new Error(`Contract ${contractName} not found`);
  
  // Ensure we have a signer
  if (!signer) {
    const browserProvider = new ethers.BrowserProvider(window.ethereum);
    signer = await browserProvider.getSigner();
    // Reinitialize contracts with signer
    initializeContracts(signer);
  }
  
  console.log(`Calling ${contractName}.${functionName}`, args);
  console.log("Contract runner:", contract.runner);
  
  try {
    // For register function, we need to send some ETH
    if (contractName === "userRegistry" && functionName === "register") {
      // First get gas limit explicitly
      const gasLimit = await contract[functionName].estimateGas({ value: ethers.parseEther("0.01") });
      console.log("Estimated gas limit for register:", gasLimit.toString());
      
      // Then call the function with both value and gas limit
      const tx = await contract[functionName]({ 
        value: ethers.parseEther("0.01"),
        gasLimit: BigInt(Math.floor(Number(gasLimit) * 1.2)) // Add 20% buffer for gas
      });
      const receipt = await tx.wait();
      return { transaction: tx, receipt };
    } else if (contractName === "contentRegistry" && functionName === "submitContent") {
      console.log("Submitting content with hash:", args[0]);

      try {
        // First check if we're registered
        const isRegistered = await contracts.userRegistry.isRegistered(await signer.getAddress());
        if (!isRegistered) {
          throw new Error("You must register before submitting content");
        }
        
        // Try to estimate gas first (this might fail, but we'll handle it)
        let gasEstimate;
        try {
          gasEstimate = await contract.submitContent.estimateGas(args[0], { 
            value: ethers.parseEther("0.005") 
          });
          console.log("Gas estimate for submitContent:", gasEstimate.toString());
        } catch (gasEstimateError) {
          console.warn("Failed to estimate gas, using manual limit:", gasEstimateError);
          // If gas estimation fails, use a manual gas limit
          gasEstimate = ethers.toBigInt("500000"); // Manual gas limit
        }
        
        // Send transaction with gas limit and value
        const txOptions = {
          value: ethers.parseEther("0.005"),
          gasLimit: gasEstimate
        };
        console.log("Sending transaction with options:", txOptions);
        
        const tx = await contract.submitContent(args[0], txOptions);
        const receipt = await tx.wait();
        return { transaction: tx, receipt };
      } catch (innerError) {
        console.error("Inner error in submitContent:", innerError);
        throw innerError;
      }
    } else if (contractName === "contentRegistry" && functionName === "voteContent") {
      // First try to estimate gas
      const gasEstimate = await contract.voteContent.estimateGas(args[0], args[1], { 
        value: ethers.parseEther("0.001") 
      });
      
      const tx = await contract[functionName](args[0], args[1], { 
        value: ethers.parseEther("0.001"),
        gasLimit: BigInt(Math.floor(Number(gasEstimate) * 1.2)) // Add 20% buffer
      });
      const receipt = await tx.wait();
      return { transaction: tx, receipt };
    } else if (contractName === "moderation" && functionName === "moderateContent") {
      // First try to estimate gas
      const gasEstimate = await contract.moderateContent.estimateGas(args[0], args[1], { 
        value: ethers.parseEther("0.01") 
      });
      
      const tx = await contract[functionName](args[0], args[1], { 
        value: ethers.parseEther("0.01"),
        gasLimit: BigInt(Math.floor(Number(gasEstimate) * 1.2)) // Add 20% buffer
      });
      const receipt = await tx.wait();
      return { transaction: tx, receipt };
    } else if (contractName === "userRegistry" && functionName === "depositETH") {
      // Special handling for depositETH function
      // The last argument might be an options object with value
      let options = {};
      let functionArgs = [...args]; // Clone args array
      
      if (args.length > 0 && typeof args[args.length - 1] === 'object' && args[args.length - 1].value) {
        options = functionArgs.pop(); // Remove the options object from function args
      }
      
      // Try to estimate gas
      const gasEstimate = await contract[functionName].estimateGas(...functionArgs, options);
      options.gasLimit = BigInt(Math.floor(Number(gasEstimate) * 1.2)); // Add 20% buffer
      
      const tx = await contract[functionName](...functionArgs, options);
      const receipt = await tx.wait();
      return { transaction: tx, receipt };
    } else {
      const tx = await contract[functionName](...args);
      if (tx.wait) {
        const receipt = await tx.wait();
        return { transaction: tx, receipt };
      }
      return { transaction: tx };
    }
  } catch (error) {
    console.error(`Error calling ${contractName}.${functionName}:`, error);
    throw error;
  }
};

export const callViewFunction = async (contractName, functionName, ...args) => {
  const contracts = getContracts();
  const contract = contracts[contractName];
  if (!contract) throw new Error(`Contract ${contractName} not found`);
  try {
    const result = await contract[functionName](...args);
    return result;
  } catch (error) {
    console.error(`Error calling ${contractName}.${functionName}:`, error);
    throw error;
  }
};