// Initialize Web3
const web3 = new Web3('http://localhost:8546');

// Format timestamp
function formatTimestamp(timestamp) {
    return new Date(timestamp * 1000).toLocaleString();
}

// Format address
function formatAddress(address) {
    if (!address) return 'N/A';
    return `${address.substring(0, 6)}...${address.substring(38)}`;
}

// Format ETH value
function formatEth(wei) {
    return web3.utils.fromWei(wei, 'ether') + ' ETH';
}

// Update last refreshed time
function updateLastRefreshed() {
    document.getElementById('lastUpdated').textContent = `Last updated: ${new Date().toLocaleString()}`;
}

// Check blockchain connection
async function checkConnection() {
    try {
        await web3.eth.net.isListening();
        return true;
    } catch (error) {
        console.error('Blockchain connection error:', error);
        return false;
    }
}

// Fetch and display network info
async function displayNetworkInfo() {
    try {
        const networkInfo = document.getElementById('networkInfo');
        
        // Check connection first
        const isConnected = await checkConnection();
        if (!isConnected) {
            networkInfo.innerHTML = '<div class="error-message">Error: Cannot connect to blockchain. Please check if Ganache is running on port 8546.</div>';
            return;
        }

        const [networkId, blockNumber, gasPrice, accounts] = await Promise.all([
            web3.eth.net.getId().catch(() => 'Not connected'),
            web3.eth.getBlockNumber().catch(() => 'Not available'),
            web3.eth.getGasPrice().catch(() => '0'),
            web3.eth.getAccounts().catch(() => [])
        ]);

        networkInfo.innerHTML = `
            <div class="info-item">
                <strong>Network ID:</strong> ${networkId}
            </div>
            <div class="info-item">
                <strong>Current Block:</strong> ${blockNumber}
            </div>
            <div class="info-item">
                <strong>Gas Price:</strong> ${web3.utils.fromWei(gasPrice.toString(), 'gwei')} Gwei
            </div>
            <div class="info-item">
                <strong>Available Accounts:</strong>
                ${accounts.length > 0 ? `
                    <ul class="account-list">
                        ${accounts.map(acc => `<li>${formatAddress(acc)}</li>`).join('')}
                    </ul>
                ` : 'No accounts available'}
            </div>
        `;
    } catch (error) {
        console.error('Error displaying network info:', error);
        document.getElementById('networkInfo').innerHTML = `<div class="error-message">Error: ${error.message}</div>`;
    }
}

// Fetch and display latest blocks
async function displayLatestBlocks() {
    try {
        const latestBlock = await web3.eth.getBlockNumber();
        if (latestBlock === null) throw new Error('Cannot connect to blockchain');

        const blocks = await Promise.all(
            Array.from({ length: 5 }, async (_, i) => {
                try {
                    return await web3.eth.getBlock(latestBlock - i);
                } catch {
                    return null;
                }
            })
        );

        const blocksHtml = blocks
            .filter(block => block !== null)
            .map(block => `
                <div class="block-item">
                    <div class="block-header">
                        <strong>Block #${block.number}</strong>
                        <span class="timestamp">${formatTimestamp(block.timestamp)}</span>
                    </div>
                    <div class="block-details">
                        <div><strong>Hash:</strong> ${formatAddress(block.hash)}</div>
                        <div><strong>Miner:</strong> ${formatAddress(block.miner)}</div>
                        <div><strong>Transactions:</strong> ${block.transactions.length}</div>
                        <div><strong>Gas Used:</strong> ${block.gasUsed}</div>
                    </div>
                </div>
            `).join('');

        document.getElementById('latestBlocks').innerHTML = blocksHtml || '<div>No blocks available</div>';
    } catch (error) {
        document.getElementById('latestBlocks').innerHTML = `<div class="error">Error: ${error.message}</div>`;
    }
}

// Fetch and display contract state
async function displayContractState() {
    try {
        const response = await fetch('http://localhost:3000/api/blockchain-status');
        const result = await response.json();
        
        if (result.success && result.contractData) {
            const { address, state } = result.contractData;
            document.getElementById('contractState').innerHTML = `
                <div class="contract-info">
                    <div><strong>Contract Address:</strong> ${formatAddress(address)}</div>
                    <div class="state-data">
                        <strong>State:</strong>
                        <pre>${JSON.stringify(state, null, 2)}</pre>
                    </div>
                </div>
            `;
        } else {
            throw new Error('Contract data not available');
        }
    } catch (error) {
        document.getElementById('contractState').innerHTML = `<div class="error">Error: ${error.message}</div>`;
    }
}

// Fetch and display recent transactions
async function displayRecentTransactions() {
    try {
        const latestBlock = await web3.eth.getBlockNumber();
        if (latestBlock === null) throw new Error('Cannot connect to blockchain');

        const blocks = await Promise.all(
            Array.from({ length: 3 }, async (_, i) => {
                try {
                    return await web3.eth.getBlock(latestBlock - i, true);
                } catch {
                    return null;
                }
            })
        );

        const transactions = blocks
            .filter(block => block !== null)
            .flatMap(block => block.transactions)
            .slice(0, 10)
            .map(tx => `
                <div class="transaction-item">
                    <div class="transaction-header">
                        <strong>Tx: ${formatAddress(tx.hash)}</strong>
                    </div>
                    <div class="transaction-details">
                        <div><strong>From:</strong> ${formatAddress(tx.from)}</div>
                        <div><strong>To:</strong> ${tx.to ? formatAddress(tx.to) : 'Contract Creation'}</div>
                        <div><strong>Value:</strong> ${formatEth(tx.value)}</div>
                        <div><strong>Gas Used:</strong> ${tx.gas}</div>
                    </div>
                </div>
            `);

        document.getElementById('recentTransactions').innerHTML = transactions.join('') || '<div>No recent transactions</div>';
    } catch (error) {
        document.getElementById('recentTransactions').innerHTML = `<div class="error">Error: ${error.message}</div>`;
    }
}

// Refresh all blockchain data
async function refreshBlockchainData() {
    await Promise.all([
        displayNetworkInfo(),
        displayLatestBlocks(),
        displayContractState(),
        displayRecentTransactions()
    ]);
    updateLastRefreshed();
}

// Initial load
refreshBlockchainData();

// Auto-refresh every 30 seconds
setInterval(refreshBlockchainData, 30000); 