const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

async function testAPI() {
    try {
        // Test register fisherman
        console.log('\nTesting fisherman registration...');
        const fishermanData = {
            name: "John Smith",
            licenseId: "FL123456",
            address: "0x123456789abcdef"
        };
        const registerResponse = await axios.post(`${API_URL}/register-fisherman`, fishermanData);
        console.log('Register response:', registerResponse.data);

        // Test log catch
        console.log('\nTesting catch logging...');
        const catchData = {
            species: "Tuna",
            weight: 100,
            gpsLocation: "25.7617° N, 80.1918° W",
            address: "0x123456789abcdef"
        };
        const catchResponse = await axios.post(`${API_URL}/log-catch`, catchData);
        console.log('Catch response:', catchResponse.data);

        // Test sell fish
        console.log('\nTesting fish sale...');
        const saleData = {
            catchId: 1,
            buyer: "0xabcdef123456",
            weight: 50,
            price: 1000,
            address: "0x123456789abcdef"
        };
        const saleResponse = await axios.post(`${API_URL}/sell-fish`, saleData);
        console.log('Sale response:', saleResponse.data);

        // Get temporary storage data
        console.log('\nGetting temporary storage data...');
        const storageResponse = await axios.get(`${API_URL}/temp-storage`);
        console.log('Storage contents:', JSON.stringify(storageResponse.data, null, 2));

    } catch (error) {
        console.error('Error during testing:', error.response?.data || error.message);
    }
}

testAPI(); 