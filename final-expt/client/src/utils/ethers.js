import { ethers } from "ethers";

import contentRegistryJSON from "../../../build/contracts/ContentRegistry.json" assert { type: "json" };
import moderationJSON from "../../../build/contracts/Moderation.json" assert { type: "json" };
import userRegistryJSON from "../../../build/contracts/UserRegistry.json" assert { type: "json" };

const contentRegistryABI = contentRegistryJSON.abi;
const moderationABI = moderationJSON.abi;
const userRegistryABI = userRegistryJSON.abi;

// Update these after running `truffle test ./test/registerUsers.js`
const contentRegistryAddress = "0x95c8cdBc186dE81D66955dEf6e040b3F34fcB670"; // From test/registerUsers.js
const moderationAddress = "0xA4bFdDD6C884f7DE5D0b05722f633BdE69E437BF"; // From test/registerUsers.js
const userRegistryAddress = "0x2951db22A62dDd885003361b6a4374A43Ef51727"; // From test/registerUsers.js

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
    if (network.chainId !== 1337n && network.chainId !== BigInt(1744814035948)) {
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
      const tx = await contract[functionName]({ value: ethers.parseEther("0.01") });
      const receipt = await tx.wait();
      return { transaction: tx, receipt };
    } else if (contractName === "contentRegistry" && functionName === "submitContent") {
      const tx = await contract[functionName](args[0], { value: ethers.parseEther("0.005") });
      const receipt = await tx.wait();
      return { transaction: tx, receipt };
    } else if (contractName === "contentRegistry" && functionName === "voteContent") {
      const tx = await contract[functionName](args[0], args[1], { value: ethers.parseEther("0.001") });
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