import { useState } from 'react'
import Web3Modal from 'web3modal'
import { ethers } from 'ethers'

export default function WalletConnector() {
  const [account, setAccount] = useState('')

  const connectWallet = async () => {
    const web3Modal = new Web3Modal()
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)
    const accounts = await provider.listAccounts()
    setAccount(accounts[0])
  }

  return (
    <div>
      {account ? (
        <p>Connected: {account}</p>
      ) : (
        <button onClick={connectWallet}>Connect Wallet</button>
      )}
    </div>
  )
}