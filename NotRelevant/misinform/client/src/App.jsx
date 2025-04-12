// src/App.jsx
import { useState } from 'react'
import { ethers } from 'ethers'
import { loadContract } from './utils/contract'
import DevWalletSelector from './components/DevWalletSelector'
import MediaRegistry from './components/MediaRegistry'

function App() {
  const [provider, setProvider] = useState(null)
  const [account, setAccount] = useState('')

  const connectMetaMask = async () => {
    const contract = await loadContract(true)
    const signer = contract.provider.getSigner()
    setAccount(await signer.getAddress())
    setProvider(contract.provider)
  }

  const connectGanache = async (privateKey) => {
    const contract = await loadContract(false)
    const wallet = new ethers.Wallet(privateKey, contract.provider)
    const connectedContract = contract.connect(wallet)
    setAccount(wallet.address)
    setProvider(connectedContract.provider)
  }

  return (
    <div>
      <h1>Media Verification dApp (Ganache)</h1>
      
      {!account ? (
        <div>
          <button onClick={connectMetaMask}>Connect MetaMask</button>
          <DevWalletSelector onSelect={connectGanache} />
        </div>
      ) : (
        <div>
          <p>Connected: {account}</p>
          <MediaRegistry provider={provider} />
        </div>
      )}
    </div>
  )
}

export default App