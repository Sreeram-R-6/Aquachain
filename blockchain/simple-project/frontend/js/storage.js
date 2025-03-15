// Check blockchain status
async function checkBlockchainStatus() {
    try {
        const response = await fetch('http://localhost:3000/api/blockchain-status');
        const result = await response.json();
        const statusElement = document.getElementById('blockchainStatus');
        
        if (result.isOnline) {
            statusElement.textContent = 'Blockchain: Connected';
            statusElement.style.backgroundColor = '#c6f6d5';
            statusElement.style.color = '#2f855a';
        } else {
            statusElement.textContent = 'Blockchain: Offline';
            statusElement.style.backgroundColor = '#fed7d7';
            statusElement.style.color = '#c53030';
        }
        return result.isOnline;
    } catch (error) {
        console.error('Error checking blockchain status:', error);
        return false;
    }
}

// Validate Ethereum address
function isValidAddress(address) {
    return /^0x[0-9a-fA-F]{40}$/.test(address);
}

// Get default address from blockchain
async function getDefaultAddress() {
    try {
        const response = await fetch('http://localhost:3000/api/blockchain-status');
        const result = await response.json();
        
        // Get accounts from blockchain
        const accountsResponse = await fetch('http://localhost:3000/api/accounts');
        const accountsResult = await accountsResponse.json();
        
        if (accountsResult.success && accountsResult.accounts && accountsResult.accounts.length > 0) {
            return accountsResult.accounts[0]; // Use the first available account
        }
        
        // Fallback to contract admin if accounts not available
        if (result.success && result.contractData && result.contractData.state && result.contractData.state.admin) {
            return result.contractData.state.admin;
        }
        
        throw new Error('Could not get default address');
    } catch (error) {
        console.error('Error getting default address:', error);
        return null;
    }
}

// Sync temporary storage to blockchain
async function syncToBlockchain() {
    try {
        const isOnline = await checkBlockchainStatus();
        if (!isOnline) {
            alert('Cannot sync: Blockchain is offline');
            return;
        }

        const defaultAddress = await getDefaultAddress();
        if (!defaultAddress) {
            alert('Could not get a valid blockchain address');
            return;
        }

        const response = await fetch('http://localhost:3000/api/temp-storage');
        const result = await response.json();
        
        if (!result.success || !result.data || result.data.length === 0) {
            alert('No data to sync');
            return;
        }

        let successCount = 0;
        let failCount = 0;
        let errors = [];

        for (const item of result.data) {
            try {
                let endpoint;
                let isValid = true;
                let validationErrors = [];

                // Validate data based on type
                switch (item.type) {
                    case 'register-fisherman':
                        endpoint = '/api/register-fisherman';
                        if (!item.data.name || item.data.name.trim().length === 0) {
                            validationErrors.push('Name is required');
                            isValid = false;
                        }
                        if (!item.data.licenseId || item.data.licenseId.trim().length === 0) {
                            validationErrors.push('License ID is required');
                            isValid = false;
                        }
                        item.data.address = defaultAddress; // Use default address for registration
                        break;

                    case 'log-catch':
                        endpoint = '/api/log-catch';
                        if (!item.data.species || item.data.species.trim().length === 0) {
                            validationErrors.push('Species is required');
                            isValid = false;
                        }
                        if (!item.data.weight || isNaN(item.data.weight) || item.data.weight <= 0) {
                            validationErrors.push('Valid weight is required');
                            isValid = false;
                        }
                        if (!item.data.gpsLocation || item.data.gpsLocation.trim().length === 0) {
                            validationErrors.push('GPS location is required');
                            isValid = false;
                        }
                        item.data.address = defaultAddress; // Use default address for catch logging
                        break;

                    case 'sell-fish':
                        endpoint = '/api/sell-fish';
                        if (!item.data.catchId || isNaN(item.data.catchId)) {
                            validationErrors.push('Valid catch ID is required');
                            isValid = false;
                        }
                        if (!item.data.weight || isNaN(item.data.weight) || item.data.weight <= 0) {
                            validationErrors.push('Valid weight is required');
                            isValid = false;
                        }
                        if (!item.data.price || isNaN(item.data.price) || item.data.price <= 0) {
                            validationErrors.push('Valid price is required');
                            isValid = false;
                        }
                        item.data.address = defaultAddress; // Use default address for seller
                        item.data.buyer = defaultAddress; // Use default address for buyer (temporary)
                        break;

                    default:
                        console.warn('Unknown item type:', item.type);
                        continue;
                }

                if (!isValid) {
                    console.error(`Validation failed for ${item.type}:`, validationErrors);
                    errors.push(`${item.type}: ${validationErrors.join(', ')}`);
                    failCount++;
                    continue;
                }

                const response = await fetch(`http://localhost:3000${endpoint}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(item.data)
                });

                const syncResult = await response.json();
                if (syncResult.success) {
                    successCount++;
                } else {
                    console.error('Sync failed for item:', item, 'Error:', syncResult.error);
                    errors.push(`${item.type}: ${syncResult.message || syncResult.error}`);
                    failCount++;
                }
            } catch (error) {
                console.error('Error syncing item:', error);
                errors.push(`${item.type}: ${error.message}`);
                failCount++;
            }
        }

        let message = `Sync complete!\nSuccessful: ${successCount}\nFailed: ${failCount}`;
        if (errors.length > 0) {
            message += '\n\nErrors:\n' + errors.join('\n');
        }
        alert(message);
        refreshStorage(); // Refresh the display after sync
    } catch (error) {
        console.error('Error during sync:', error);
        alert('Error during sync: ' + error.message);
    }
}

// Display temporary storage data
async function displayTempStorage() {
    try {
        const response = await fetch('http://localhost:3000/api/temp-storage');
        const result = await response.json();
        
        if (result.success && result.data) {
            // Group data by type
            const fishermen = result.data.filter(item => item.type === 'register-fisherman');
            const catches = result.data.filter(item => item.type === 'log-catch');
            const sales = result.data.filter(item => item.type === 'sell-fish');

            // Display fishermen
            document.getElementById('fishermanData').innerHTML = fishermen.length > 0 
                ? fishermen.map(item => `
                    <div class="data-item">
                        <p><strong>Name:</strong> ${item.data.name}</p>
                        <p><strong>License ID:</strong> ${item.data.licenseId}</p>
                        <p><strong>Wallet:</strong> ${item.data.address}</p>
                        <p><strong>Timestamp:</strong> ${new Date(item.timestamp).toLocaleString()}</p>
                    </div>
                `).join('')
                : '<p>No registered fishermen in temporary storage</p>';

            // Display catches
            document.getElementById('catchData').innerHTML = catches.length > 0
                ? catches.map(item => `
                    <div class="data-item">
                        <p><strong>Species:</strong> ${item.data.species}</p>
                        <p><strong>Weight:</strong> ${item.data.weight} kg</p>
                        <p><strong>Location:</strong> ${item.data.gpsLocation}</p>
                        <p><strong>Fisherman:</strong> ${item.data.address}</p>
                        <p><strong>Timestamp:</strong> ${new Date(item.timestamp).toLocaleString()}</p>
                    </div>
                `).join('')
                : '<p>No catches in temporary storage</p>';

            // Display sales
            document.getElementById('saleData').innerHTML = sales.length > 0
                ? sales.map(item => `
                    <div class="data-item">
                        <p><strong>Catch ID:</strong> ${item.data.catchId}</p>
                        <p><strong>Buyer:</strong> ${item.data.buyer}</p>
                        <p><strong>Weight:</strong> ${item.data.weight} kg</p>
                        <p><strong>Price:</strong> ${item.data.price} ETH</p>
                        <p><strong>Seller:</strong> ${item.data.address}</p>
                        <p><strong>Timestamp:</strong> ${new Date(item.timestamp).toLocaleString()}</p>
                    </div>
                `).join('')
                : '<p>No sales in temporary storage</p>';
        }
    } catch (error) {
        console.error('Error loading temporary storage:', error);
    }
}

// Refresh all data
async function refreshStorage() {
    await Promise.all([
        checkBlockchainStatus(),
        displayTempStorage()
    ]);
}

// Initial load
refreshStorage();

// Format timestamp
function formatTimestamp(timestamp) {
    return new Date(timestamp).toLocaleString();
}

// Add some CSS for the data items
const style = document.createElement('style');
style.textContent = `
    .data-item {
        background-color: #f8fafc;
        padding: 1rem;
        margin-bottom: 1rem;
        border-radius: 0.375rem;
        border: 1px solid #e2e8f0;
    }
    .data-item p {
        margin: 0.5rem 0;
    }
`;
document.head.appendChild(style); 