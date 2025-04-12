import Web3 from 'web3';

let web3;
let votingSystem;
let userRegistry;

// Initialize Web3
window.addEventListener('load', async () => {
    if (window.ethereum) {
        web3 = new Web3(window.ethereum);
        try {
            await window.ethereum.enable();
            initContracts();
        } catch (error) {
            console.error("User denied account access");
        }
    } else {
        console.log("No Ethereum browser extension detected");
    }
});

function initContracts() {
    const votingSystemABI = [/* ABI from compiled contract */];
    const votingSystemAddress = "0x..."; // Deployed address
    
    votingSystem = new web3.eth.Contract(votingSystemABI, votingSystemAddress);
    
    // Set up UI event listeners
    document.getElementById('registerBtn').addEventListener('click', registerUser);
    document.getElementById('addContentBtn').addEventListener('click', addContent);
    document.getElementById('voteBtn').addEventListener('click', voteContent);
}

async function registerUser() {
    const username = document.getElementById('username').value;
    await votingSystem.methods.registerUser(username).send({ from: web3.eth.defaultAccount });
    alert("User registered successfully!");
}

async function addContent() {
    const contentHash = document.getElementById('contentHash').value;
    await votingSystem.methods.addContent(contentHash).send({ from: web3.eth.defaultAccount });
    alert("Content added successfully!");
}

async function voteContent() {
    const contentId = document.getElementById('contentId').value;
    const isUpvote = document.getElementById('voteType').checked;
    await votingSystem.methods.voteContent(contentId, isUpvote).send({ from: web3.eth.defaultAccount });
    alert("Vote recorded successfully!");
}