// src/components/DevWalletSelector.jsx
import { useState } from 'react'

export default function DevWalletSelector({ onSelect }) {
  const [privateKey, setPrivateKey] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    onSelect(privateKey)
  }

  return (
    <div>
      <h3>Ganache Wallet Access</h3>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Paste private key from Ganache"
          value={privateKey}
          onChange={(e) => setPrivateKey(e.target.value)}
        />
        <button type="submit">Connect</button>
      </form>
      <p>Use one of Ganache's accounts (check Ganache CLI output)</p>
    </div>
  )
}