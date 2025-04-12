import { ethers } from "ethers";

import contentRegistryJSON from "../../../build/contracts/ContentRegistry.json" assert { type: "json" };
import moderationJSON from "../../../build/contracts/Moderation.json" assert { type: "json" };
import userRegistryJSON from "../../../build/contracts/UserRegistry.json" assert { type: "json" };

const contentRegistryABI = contentRegistryJSON.abi;
const moderationABI = moderationJSON.abi;
const userRegistryABI = userRegistryJSON.abi;

// Update these after running `truffle test ./test/registerUsers.js`
const contentRegistryAddress = "0xYourContentRegistryAddress"; // From test/registerUsers.js
const moderationAddress = "0xYourModerationAddress"; // From test/registerUsers.js
const userRegistryAddress = "0xYourUserRegistryAddress"; // From test/registerUsers.js

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
    if (network.chainId !== 1337n) {
      throw new Error("Please connect MetaMask to Ganache (Chain ID: 1337)");
    }

    console.log("Connected wallet:", address);
    console.log("UserRegistry signer:", !!userRegistry.signer);
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
  if (!contract.signer) {
    console.error("Contract instance:", contract);
    throw new Error("Please connect MetaMask to sign transactions.");
  }
  try {
    const tx = await contract[functionName](...args);
    if (tx.wait) {
      const receipt = await tx.wait();
      return { transaction: tx, receipt };
    }
    return { transaction: tx };
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