import { ethers } from "ethers";

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
export const callContractFunction = async (contractName, functionName, ...args) => {
  const contracts = getContracts();
  const contract = contracts[contractName];
  if (!contract) throw new Error(`Contract ${contractName} not found`);

  try {
    const tx = await contract[functionName](...args);
    if (tx.wait) await tx.wait(); // Wait for transaction confirmation for write calls
    return tx;
  } catch (error) {
    console.error(`Error calling ${contractName}.${functionName}:`, error);
    throw error;
  }
};

// Generic function for read-only (view/pure) calls
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