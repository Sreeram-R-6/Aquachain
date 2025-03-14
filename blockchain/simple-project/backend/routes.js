const express = require('express');
const router = express.Router();

// Example route to handle data submission
router.post('/sendData', async (req, res) => {
    const data = req.body;
    const contract = req.app.locals.contract;

    try {
        // Example function call to the smart contract
        const accounts = await web3.eth.getAccounts();
        await contract.methods.addFishCatch(
            data.id,
            data.fisherman,
            data.species,
            data.weight,
            data.gpsLocation,
            data.timestamp
        ).send({ from: accounts[0] });

        console.log('Data sent to blockchain:', data);
        res.json({ message: 'Data sent to blockchain' });
    } catch (error) {
        console.error('Error sending data to blockchain:', error);
        res.status(500).json({ message: 'Error sending data to blockchain' });
    }
});

module.exports = router;