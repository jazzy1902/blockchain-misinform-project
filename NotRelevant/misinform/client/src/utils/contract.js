import { ethers } from 'ethers'
import MediaRegistry from '../../../build/contracts/MediaRegistry.json'

// Ganache provider URL (default)
const GANACHE_URL = 'http://127.0.0.1:7545'

export const loadContract = async (useMetaMask = false) => {
  let provider
  
  if (useMetaMask && window.ethereum) {
    provider = new ethers.providers.Web3Provider(window.ethereum)
    await window.ethereum.enable()
  } else {
    provider = new ethers.providers.JsonRpcProvider(GANACHE_URL)
  }

  const network = await provider.getNetwork()
  const contractAddress = MediaRegistry.networks[network.chainId]?.address
  
  if (!contractAddress) {
    // Fallback to manually set address (copy from truffle migrate output)
    const FALLBACK_ADDRESS = "0x123..." // Replace with your contract address
    console.warn("Using fallback contract address")
    return new ethers.Contract(
      FALLBACK_ADDRESS,
      MediaRegistry.abi,
      provider.getSigner()
    )
  }
  
  return new ethers.Contract(
    contractAddress,
    MediaRegistry.abi,
    provider.getSigner()
  )
}