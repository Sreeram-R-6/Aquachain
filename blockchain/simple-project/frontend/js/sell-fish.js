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

document.getElementById('sellFishForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const statusDiv = document.getElementById('status');
    
    try {
        const isOnline = await checkBlockchainStatus();
        const data = {
            catchId: parseInt(document.getElementById('catchId').value),
            buyer: document.getElementById('buyerAddress').value,
            weight: parseFloat(document.getElementById('sellWeight').value),
            price: parseFloat(document.getElementById('price').value),
            address: document.getElementById('sellerAddress').value
        };

        // Validate input
        if (!data.catchId || isNaN(data.catchId)) {
            throw new Error('Please enter a valid catch ID');
        }
        if (!data.buyer || !data.buyer.startsWith('0x')) {
            throw new Error('Please enter a valid buyer address (should start with 0x)');
        }
        if (!data.weight || data.weight <= 0) {
            throw new Error('Please enter a valid weight');
        }
        if (!data.price || data.price <= 0) {
            throw new Error('Please enter a valid price');
        }
        if (!data.address || !data.address.startsWith('0x')) {
            throw new Error('Please enter a valid seller address (should start with 0x)');
        }

        const response = await fetch('http://localhost:3000/api/sell-fish', {
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
                statusDiv.textContent = result.message || 'Fish sale recorded successfully!';
                statusDiv.className = 'status-message success';
            }
            e.target.reset();
        } else {
            throw new Error(result.message || result.error || 'Failed to record fish sale');
        }
    } catch (error) {
        console.error('Error in sell-fish:', error);
        statusDiv.textContent = error.message;
        statusDiv.className = 'status-message error';
    }
}); 