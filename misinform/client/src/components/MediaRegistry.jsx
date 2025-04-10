// src/components/MediaRegistry.jsx
import { useEffect, useState } from 'react'
import { ethers } from 'ethers'

export default function MediaRegistry({ provider }) {
  const [mediaHouses, setMediaHouses] = useState([])
  const [newName, setNewName] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      if (!provider) return
      
      const contract = new ethers.Contract(
        "0x123...", // Your contract address
        [
          // Minimal ABI for testing
          "function nextTokenId() view returns (uint256)",
          "function mediaHouses(uint256) view returns (string name, uint256 reputation, bool isVerified)",
          "function registerMediaHouse(string memory name)"
        ],
        provider
      )

      const count = await contract.nextTokenId()
      const houses = []
      
      for (let i = 1; i < count; i++) {
        houses.push(await contract.mediaHouses(i))
      }
      
      setMediaHouses(houses)
    }
    
    fetchData()
  }, [provider])

  const registerMedia = async () => {
    const signer = provider.getSigner()
    const contract = new ethers.Contract(
      "0x123...", // Your contract address
      [
        "function registerMediaHouse(string memory name)"
      ],
      signer
    )
    
    await contract.registerMediaHouse(newName)
    setNewName('')
  }

  return (
    <div>
      <h2>Registered Media Houses</h2>
      
      <div>
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New media house name"
        />
        <button onClick={registerMedia}>Register</button>
      </div>
      
      <ul>
        {mediaHouses.map((house, i) => (
          <li key={i}>
            {house.name} - {house.isVerified ? '✅ Verified' : '❌ Unverified'}
          </li>
        ))}
      </ul>
    </div>
  )
}