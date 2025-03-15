// Check blockchain status before submitting
async function checkBlockchainStatus() {
    try {
        const response = await fetch('http://localhost:3000/api/blockchain-status');
        const result = await response.json();
        return result.isOnline;
    } catch (error) {
        console.error('Error checking blockchain status:', error);
        return false;
    }
}

document.getElementById('fishermanForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const statusDiv = document.getElementById('status');
    
    try {
        const isOnline = await checkBlockchainStatus();
        const data = {
            name: document.getElementById('name').value,
            licenseId: document.getElementById('licenseId').value,
            address: document.getElementById('walletAddress').value
        };

        // Validate input
        if (!data.name || data.name.trim().length === 0) {
            throw new Error('Please enter a valid name');
        }
        if (!data.licenseId || data.licenseId.trim().length === 0) {
            throw new Error('Please enter a valid license ID');
        }
        if (!data.address || !data.address.startsWith('0x')) {
            throw new Error('Please enter a valid wallet address (should start with 0x)');
        }

        const response = await fetch('http://localhost:3000/api/register-fisherman', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        
        if (result.success) {
            if (result.isOffline) {
                statusDiv.textContent = 'Blockchain is offline. Data saved to temporary storage.';
                statusDiv.className = 'status-message warning';
            } else {
                statusDiv.textContent = result.message || 'Registration successful!';
                statusDiv.className = 'status-message success';
            }
            e.target.reset();
        } else {
            throw new Error(result.message || result.error || 'Registration failed');
        }
    } catch (error) {
        console.error('Error in register-fisherman:', error);
        statusDiv.textContent = error.message;
        statusDiv.className = 'status-message error';
    }
}); 