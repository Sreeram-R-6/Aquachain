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

// Get current location function
function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const gpsInput = document.getElementById('gpsLocation');
                gpsInput.value = `${position.coords.latitude}° ${position.coords.longitude < 0 ? 'W' : 'E'}, ${Math.abs(position.coords.longitude)}°`;
            },
            (error) => {
                alert('Error getting location: ' + error.message);
            }
        );
    } else {
        alert('Geolocation is not supported by this browser.');
    }
}

// Form submission handler
document.getElementById('logCatchForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const statusDiv = document.getElementById('status');
    
    try {
        const isOnline = await checkBlockchainStatus();
        const data = {
            species: document.getElementById('species').value,
            weight: parseFloat(document.getElementById('weight').value),
            gpsLocation: document.getElementById('gpsLocation').value,
            address: document.getElementById('catchAddress').value
        };

        // Validate input
        if (!data.species || data.species.trim().length === 0) {
            throw new Error('Please enter a valid species');
        }
        if (!data.weight || data.weight <= 0) {
            throw new Error('Please enter a valid weight');
        }
        if (!data.gpsLocation || data.gpsLocation.trim().length === 0) {
            throw new Error('Please enter a valid GPS location');
        }
        if (!data.address || !data.address.startsWith('0x')) {
            throw new Error('Please enter a valid wallet address (should start with 0x)');
        }

        const response = await fetch('http://localhost:3000/api/log-catch', {
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
                statusDiv.textContent = result.message || 'Catch logged successfully!';
                statusDiv.className = 'status-message success';
            }
            e.target.reset();
        } else {
            throw new Error(result.message || result.error || 'Failed to log catch');
        }
    } catch (error) {
        console.error('Error in log-catch:', error);
        statusDiv.textContent = error.message;
        statusDiv.className = 'status-message error';
    }
}); 