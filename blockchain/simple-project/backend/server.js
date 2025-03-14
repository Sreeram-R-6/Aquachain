// filepath: c:\hackaathon_2025\Aquachain\blockchain\simple-project\backend\server.js
const express = require('express');
const bodyParser = require('body-parser');
const routes = require('./routes');
const Web3 = require('web3');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// Connect to the Ethereum network
const web3 = new Web3('https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID');

// Load the smart contract ABI and address
const contractABI = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../sustainablefishing/artifacts/SeafoodTracking.json'), 'utf8')).abi;
const contractAddress = '0x53ca6334afa65365aff9a097147ee95524a251f5';
const contract = new web3.eth.Contract(contractABI, contractAddress);

app.use(bodyParser.json());
app.use('/api', routes);

// Make the contract accessible in routes
app.locals.contract = contract;

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});