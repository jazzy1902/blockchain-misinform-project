import { ethers } from "ethers";

<<<<<<< HEAD
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

=======
// Contract details (update with your paths and addresses)
const contractA_ABI = require("../../../build/contracts/ContentRegistry.json").abi;
const contractB_ABI = require("../../../build/contracts/IUserRegistry.json").abi;
const contractC_ABI = require("../../../build/contracts/UserRegistry.json").abi;

const contractA_Address = "0xYourContractAAddress";
const contractB_Address = "0xYourContractBAddress";
const contractC_Address = "0xYourContractCAddress";

const privateKey = "0xYourGanachePrivateKey"; // From Ganache UI

// Connect to Ganache
const provider = new ethers.JsonRpcProvider("http://127.0.0.1:7545");

// Initialize wallet
const wallet = new ethers.Wallet(privateKey, provider);

// Initialize contract instances
const contractA = new ethers.Contract(contractA_Address, contractA_ABI, wallet);
const contractB = new ethers.Contract(contractB_Address, contractB_ABI, wallet);
const contractC = new ethers.Contract(contractC_Address, contractC_ABI, wallet);

// Export contracts
export const getContracts = () => ({
  contractA,
  contractB,
  contractC,
});

// Generic function to call any contract method
>>>>>>> 763f1b6b588b5894c067a8e8bee0f2393a73edef
export const callContractFunction = async (contractName, functionName, ...args) => {
  const contracts = getContracts();
  const contract = contracts[contractName];
  if (!contract) throw new Error(`Contract ${contractName} not found`);
<<<<<<< HEAD
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
=======

  try {
    const tx = await contract[functionName](...args);
    if (tx.wait) await tx.wait(); // Wait for transaction confirmation for write calls
    return tx;
>>>>>>> 763f1b6b588b5894c067a8e8bee0f2393a73edef
  } catch (error) {
    console.error(`Error calling ${contractName}.${functionName}:`, error);
    throw error;
  }
};

<<<<<<< HEAD
=======
// Generic function for read-only (view/pure) calls
>>>>>>> 763f1b6b588b5894c067a8e8bee0f2393a73edef
export const callViewFunction = async (contractName, functionName, ...args) => {
  const contracts = getContracts();
  const contract = contracts[contractName];
  if (!contract) throw new Error(`Contract ${contractName} not found`);
<<<<<<< HEAD
=======

>>>>>>> 763f1b6b588b5894c067a8e8bee0f2393a73edef
  try {
    const result = await contract[functionName](...args);
    return result;
  } catch (error) {
    console.error(`Error calling ${contractName}.${functionName}:`, error);
    throw error;
  }
};