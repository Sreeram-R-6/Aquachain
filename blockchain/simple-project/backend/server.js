// filepath: c:\hackaathon_2025\Aquachain\blockchain\simple-project\backend\server.js
const express = require('express');
const cors = require('cors');
const Web3 = require('web3');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// Temporary storage path
const TEMP_STORAGE_PATH = path.join(__dirname, 'temp_storage.json');

// Initialize Web3 with a fallback to local network
const web3 = new Web3('http://localhost:8546');

// Initialize contract ABI and address with fallback values
let contractABI = [];
let contractAddress = '';

// Try to load contract ABI from different possible locations
const possibleABIPaths = [
    path.join(__dirname, '..', 'sustainablefishing', 'artifacts', 'SeafoodTracking.json'),
    path.join(__dirname, '..', '..', 'sustainablefishing', 'artifacts', 'SeafoodTracking.json'),
    path.join(__dirname, '..', 'sustainablefishing', 'catchverify.json')
];

for (const abiPath of possibleABIPaths) {
    try {
        if (fs.existsSync(abiPath)) {
            const abiFile = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
            contractABI = abiFile.abi || abiFile;
            contractAddress = abiFile.address || '';
            console.log('Successfully loaded contract ABI from:', abiPath);
            if (contractAddress) {
                console.log('Contract address:', contractAddress);
            }
            break;
        }
    } catch (error) {
        console.log('Could not load ABI from:', abiPath);
    }
}

// Initialize contract with address
let seafoodContract = null;
if (contractABI.length > 0 && contractAddress) {
    seafoodContract = new web3.eth.Contract(contractABI, contractAddress);
    console.log('Contract initialized with address:', contractAddress);
} else {
    console.log('Contract initialization failed: Missing ABI or address');
}

// Middleware
app.use(cors());
app.use(express.json());

// Initialize temporary storage
const initTempStorage = () => {
    if (!fs.existsSync(TEMP_STORAGE_PATH)) {
        fs.writeFileSync(TEMP_STORAGE_PATH, JSON.stringify([]));
    }
};

// Load temporary storage
const loadTempStorage = () => {
    try {
        return JSON.parse(fs.readFileSync(TEMP_STORAGE_PATH));
    } catch (error) {
        console.error('Error loading temporary storage:', error);
        return [];
    }
};

// Save to temporary storage
const saveToTempStorage = (data) => {
    try {
        const storage = loadTempStorage();
        storage.push({ ...data, timestamp: Date.now() });
        fs.writeFileSync(TEMP_STORAGE_PATH, JSON.stringify(storage, null, 2));
    } catch (error) {
        console.error('Error saving to temporary storage:', error);
    }
};

// Check blockchain connection
const isBlockchainOnline = async () => {
    try {
        if (!seafoodContract) {
            return false;
        }
        await web3.eth.net.isListening();
        return true;
    } catch (error) {
        return false;
    }
};

// Make functions available to routes
app.locals.web3 = web3;
app.locals.seafoodContract = seafoodContract;
app.locals.isBlockchainOnline = isBlockchainOnline;
app.locals.saveToTempStorage = saveToTempStorage;
app.locals.loadTempStorage = loadTempStorage;

// Import and use routes
const routes = require('./routes');
app.use('/api', routes);

initTempStorage();

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log('Blockchain connection status:', seafoodContract ? 'Contract loaded' : 'Using fallback storage');
});