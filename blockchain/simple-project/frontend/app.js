// frontend/app.js

// Initialize Web3
let web3;
let contract;
const API_URL = 'http://localhost:3000/api';

async function initWeb3() {
    if (window.ethereum) {
        web3 = new Web3(window.ethereum);
        try {
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            updateBlockchainStatus(true);
        } catch (error) {
            console.error('User denied account access');
            updateBlockchainStatus(false);
        }
    } else {
        console.log('No Ethereum browser extension detected');
        updateBlockchainStatus(false);
    }
}

function updateBlockchainStatus(isOnline) {
    const statusElement = document.getElementById('blockchainStatus');
    statusElement.textContent = isOnline ? 'Blockchain: Connected' : 'Blockchain: Offline';
    statusElement.className = isOnline ? 'status-online' : 'status-offline';
}

function updateStatus(message, isError = false) {
    const statusElement = document.getElementById('status');
    statusElement.textContent = message;
    statusElement.className = isError ? 'error' : 'success';
}

// Register Fisherman
document.getElementById('fishermanForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        name: document.getElementById('name').value,
        licenseId: document.getElementById('licenseId').value,
        address: document.getElementById('walletAddress').value
    };

    try {
        const response = await fetch(`${API_URL}/register-fisherman`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        
        if (result.success) {
            updateStatus('Fisherman registered successfully!');
        } else {
            updateStatus('Failed to register fisherman: ' + result.error, true);
        }
    } catch (error) {
        updateStatus('Error: ' + error.message, true);
    }
});

// Log Catch
document.getElementById('logCatchForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        species: document.getElementById('species').value,
        weight: document.getElementById('weight').value,
        gpsLocation: document.getElementById('gpsLocation').value,
        address: web3.eth.defaultAccount
    };

    try {
        const response = await fetch(`${API_URL}/log-catch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        
        if (result.success) {
            updateStatus('Catch logged successfully!');
        } else {
            updateStatus('Failed to log catch: ' + result.error, true);
        }
    } catch (error) {
        updateStatus('Error: ' + error.message, true);
    }
});

// Sell Fish
document.getElementById('sellFishForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        catchId: document.getElementById('catchId').value,
        buyer: document.getElementById('buyerAddress').value,
        weight: document.getElementById('sellWeight').value,
        price: document.getElementById('price').value,
        address: web3.eth.defaultAccount
    };

    try {
        const response = await fetch(`${API_URL}/sell-fish`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        
        if (result.success) {
            updateStatus('Fish sold successfully!');
        } else {
            updateStatus('Failed to sell fish: ' + result.error, true);
        }
    } catch (error) {
        updateStatus('Error: ' + error.message, true);
    }
});

// View Temporary Storage
document.getElementById('viewTempStorage').addEventListener('click', async () => {
    try {
        const response = await fetch(`${API_URL}/temp-storage`);
        const result = await response.json();
        
        if (result.success) {
            const tempStorageElement = document.getElementById('tempStorageData');
            tempStorageElement.innerHTML = '<pre>' + JSON.stringify(result.data, null, 2) + '</pre>';
        } else {
            updateStatus('Failed to fetch temporary storage: ' + result.error, true);
        }
    } catch (error) {
        updateStatus('Error: ' + error.message, true);
    }
});

// Initialize Web3 on page load
initWeb3();