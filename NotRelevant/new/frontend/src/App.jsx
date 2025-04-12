// src/App.jsx
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Web3 from 'web3';
import MisinformationCombatABI from './abis/MisinformationCombat.json'; // ABI from compiled contract

// Replace with your deployed contract address after deployment
const CONTRACT_ADDRESS = '0xa33DA0775DeBcA7989B98fC8eD7eFd726F5AfaF2';

// Home Component
function Home() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-4xl font-bold text-gray-800 mb-6">Misinformation Combat Platform</h1>
      <p className="text-lg text-gray-600 mb-4">
        Connect your MetaMask wallet to fight misinformation. Submit IPFS content and vote on published content to flag potential misinformation.
      </p>
      <nav className="flex space-x-4">
        <Link
          to="/submit"
          className="text-blue-600 hover:text-blue-800 font-medium transition duration-200"
        >
          Submit Content
        </Link>
        <Link
          to="/contents"
          className="text-blue-600 hover:text-blue-800 font-medium transition duration-200"
        >
          View Contents
        </Link>
      </nav>
    </div>
  );
}

// Wallet Connection Component
function WalletConnect({ account, setAccount, setContract }) {
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const web3 = new Web3(window.ethereum);
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const userAccount = accounts[0];
        setAccount(userAccount);

        const contract = new web3.eth.Contract(MisinformationCombatABI.abi, CONTRACT_ADDRESS);
        setContract(contract);

        // Check if user is registered
        const isRegistered = await contract.methods.registeredUsers(userAccount).call();
        if (!isRegistered) {
          await contract.methods.registerUser().send({ from: userAccount });
          alert('User registered successfully!');
        }
      } catch (error) {
        console.error('Error connecting wallet:', error);
        alert('Failed to connect wallet or register user.');
      }
    } else {
      alert('Please install MetaMask!');
    }
  };

  return (
    <button
      onClick={connectWallet}
      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-200"
    >
      {account ? `Connected: ${account.slice(0, 6)}...${account.slice(-4)}` : 'Connect Wallet'}
    </button>
  );
}

// Submit Content Component
function SubmitContent({ account, contract }) {
  const [contentID, setContentID] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!account || !contract) {
      alert('Please connect your wallet first.');
      return;
    }

    setIsSubmitting(true);
    try {
      await contract.methods.submitContent(contentID).send({ from: account });
      alert('Content submitted successfully!');
      setContentID('');
    } catch (error) {
      console.error('Error submitting content:', error);
      alert('Failed to submit content. Please check the Content ID and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Submit Content</h2>
      {!account ? (
        <p className="text-gray-600">Please connect your wallet to submit content.</p>
      ) : (
        <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
          <div>
            <label htmlFor="contentID" className="block text-sm font-medium text-gray-700">
              IPFS Content ID
            </label>
            <input
              type="text"
              id="contentID"
              value={contentID}
              onChange={(e) => setContentID(e.target.value.trim())}
              className="mt-1 block w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter IPFS hash (e.g., Qm...)"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full bg-green-600 text-white px-4 py-3 rounded-md hover:bg-green-700 transition duration-200 ${
              isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Content'}
          </button>
        </form>
      )}
    </div>
  );
}

// Contents List Component
function ContentsList({ account, contract }) {
  const [contents, setContents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchContents = async () => {
      if (contract) {
        setIsLoading(true);
        try {
          const contentIDs = await contract.methods.getAllContentIDs().call();
          const contentDetails = await Promise.all(
            contentIDs.map(async (id) => {
              const details = await contract.methods.getContent(id).call();
              const hasVoted = account
                ? await contract.methods.hasUserVoted(id, account).call()
                : false;
              return {
                contentID: details.contentID,
                publisher: details.publisher,
                upvotes: Number(details.upvotes),
                downvotes: Number(details.downvotes),
                flagged: details.flagged,
                hasVoted,
              };
            })
          );
          setContents(contentDetails);
        } catch (error) {
          console.error('Error fetching contents:', error);
          alert('Failed to load contents.');
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchContents();
  }, [contract, account]);

  const handleVote = async (contentID, isUpvote) => {
    if (!account || !contract) {
      alert('Please connect your wallet first.');
      return;
    }

    try {
      const method = isUpvote ? 'upvote' : 'downvote';
      await contract.methods[method](contentID).send({
        from: account,
        value: Web3.utils.toWei('0.001', 'ether'),
      });
      alert(`Content ${isUpvote ? 'upvoted' : 'downvoted'} successfully!`);

      // Refresh content details
      const updatedDetails = await contract.methods.getContent(contentID).call();
      const hasVoted = await contract.methods.hasUserVoted(contentID, account).call();
      setContents((prev) =>
        prev.map((content) =>
          content.contentID === contentID
            ? {
                ...content,
                upvotes: Number(updatedDetails.upvotes),
                downvotes: Number(updatedDetails.downvotes),
                flagged: updatedDetails.flagged,
                hasVoted,
              }
            : content
        )
      );
    } catch (error) {
      console.error(`Error ${isUpvote ? 'upvoting' : 'downvoting'}:`, error);
      alert(`Failed to ${isUpvote ? 'upvote' : 'downvote'} content. Ensure you have enough ETH.`);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Published Contents</h2>
      {isLoading ? (
        <p className="text-gray-600">Loading contents...</p>
      ) : contents.length === 0 ? (
        <p className="text-gray-600">No contents available yet.</p>
      ) : (
        <div className="grid gap-6">
          {contents.map((content) => (
            <div
              key={content.contentID}
              className="border border-gray-200 p-6 rounded-lg shadow-sm hover:shadow-md transition duration-200"
            >
              <p className="text-sm text-gray-500">
                <strong>Content ID:</strong>{' '}
                <a
                  href={`https://ipfs.io/ipfs/${content.contentID}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {content.contentID.slice(0, 10)}...{content.contentID.slice(-10)}
                </a>
              </p>
              <p className="text-sm text-gray-500">
                <strong>Publisher:</strong> {content.publisher.slice(0, 6)}...{content.publisher.slice(-4)}
              </p>
              <p className="text-sm text-gray-500">
                <strong>Upvotes:</strong> {content.upvotes}
              </p>
              <p className="text-sm text-gray-500">
                <strong>Downvotes:</strong> {content.downvotes}
              </p>
              <p className="text-sm text-gray-500">
                <strong>Status:</strong>{' '}
                <span className={content.flagged ? 'text-red-600' : 'text-green-600'}>
                  {content.flagged ? 'Flagged' : 'Active'}
                </span>
              </p>
              {account && !content.hasVoted ? (
                <div className="mt-4 flex space-x-3">
                  <button
                    onClick={() => handleVote(content.contentID, true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-200"
                  >
                    Upvote (0.001 ETH)
                  </button>
                  <button
                    onClick={() => handleVote(content.contentID, false)}
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition duration-200"
                  >
                    Downvote (0.001 ETH)
                  </button>
                </div>
              ) : (
                <p className="mt-4 text-sm text-gray-500">
                  {account ? 'You have already voted.' : 'Connect wallet to vote.'}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Main App Component
function App() {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-blue-600 text-white p-4 shadow-md">
          <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-2xl font-bold">Misinformation Combat</h1>
            <WalletConnect account={account} setAccount={setAccount} setContract={setContract} />
          </div>
        </header>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/submit" element={<SubmitContent account={account} contract={contract} />} />
          <Route path="/contents" element={<ContentsList account={account} contract={contract} />} />
        </Routes>
        <footer className="bg-gray-800 text-white p-4 mt-8">
          <div className="container mx-auto text-center">
            <p>&copy; 2025 Misinformation Combat Platform. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
