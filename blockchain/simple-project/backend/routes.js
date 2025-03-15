const express = require('express');
const router = express.Router();

// Validate blockchain connection
const validateBlockchain = async (req, res, next) => {
    try {
        const isOnline = await req.app.locals.isBlockchainOnline();
        const contract = req.app.locals.seafoodContract;
        
        if (!isOnline || !contract) {
            // Save to temporary storage if blockchain is offline
            return res.json({ 
                success: true, 
                message: 'Blockchain is offline. Data will be saved to temporary storage.',
                isOffline: true 
            });
        }
        next();
    } catch (error) {
        console.error('Blockchain validation error:', error);
        res.status(503).json({ 
            success: false, 
            error: 'Blockchain service unavailable',
            message: error.message 
        });
    }
};

// Get blockchain status and contract state
router.get('/blockchain-status', async (req, res) => {
    try {
        const isOnline = await req.app.locals.isBlockchainOnline();
        const web3 = req.app.locals.web3;
        const contract = req.app.locals.seafoodContract;

        let contractData = null;
        if (isOnline && contract) {
            try {
                const [catchCounter, admin] = await Promise.all([
                    contract.methods.catchCounter().call(),
                    contract.methods.admin().call()
                ]);

                contractData = {
                    address: contract.options.address,
                    state: {
                        catchCounter,
                        admin
                    }
                };
            } catch (contractError) {
                console.error('Contract interaction error:', contractError);
                contractData = { error: 'Could not fetch contract state' };
            }
        }

        res.json({ 
            success: true, 
            isOnline,
            contractData
        });
    } catch (error) {
        console.error('Error checking blockchain status:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error',
            message: error.message 
        });
    }
});

// Register fisherman
router.post('/register-fisherman', validateBlockchain, async (req, res) => {
    try {
        const { name, licenseId, address } = req.body;

        // Validate input
        if (!name || !licenseId || !address) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing required fields',
                required: ['name', 'licenseId', 'address']
            });
        }

        // If blockchain is offline, save to temporary storage
        if (!await req.app.locals.isBlockchainOnline()) {
            req.app.locals.saveToTempStorage({
                type: 'register-fisherman',
                data: { name, licenseId, address }
            });
            return res.json({ 
                success: true, 
                message: 'Saved to temporary storage'
            });
        }

        // Try to register on blockchain
        const contract = req.app.locals.seafoodContract;
        const result = await contract.methods.registerFisherman(name, licenseId)
            .send({ 
                from: address, 
                gas: 500000  // Increased gas limit
            });

        res.json({ 
            success: true, 
            data: result,
            message: 'Fisherman registered successfully'
        });
    } catch (error) {
        console.error('Error in register-fisherman:', error);
        if (error.message.includes('gas')) {
            return res.status(400).json({ 
                success: false, 
                error: 'Transaction error',
                message: 'Not enough gas or transaction rejected',
                details: error.message
            });
        }
        res.status(500).json({ 
            success: false, 
            error: 'Registration failed',
            message: error.message 
        });
    }
});

// Log catch
router.post('/log-catch', validateBlockchain, async (req, res) => {
    try {
        const { species, weight, gpsLocation, address } = req.body;

        // Validate input
        if (!species || !weight || !gpsLocation || !address) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing required fields',
                required: ['species', 'weight', 'gpsLocation', 'address']
            });
        }

        // If blockchain is offline, save to temporary storage
        if (!await req.app.locals.isBlockchainOnline()) {
            req.app.locals.saveToTempStorage({
                type: 'log-catch',
                data: { species, weight, gpsLocation, address }
            });
            return res.json({ 
                success: true, 
                message: 'Saved to temporary storage'
            });
        }

        // Try to log catch on blockchain
        const contract = req.app.locals.seafoodContract;
        const result = await contract.methods.logCatch(species, weight, gpsLocation)
            .send({ 
                from: address, 
                gas: 500000  // Increased gas limit
            });

        res.json({ 
            success: true, 
            data: result,
            message: 'Catch logged successfully'
        });
    } catch (error) {
        console.error('Error in log-catch:', error);
        if (error.message.includes('gas')) {
            return res.status(400).json({ 
                success: false, 
                error: 'Transaction error',
                message: 'Not enough gas or transaction rejected',
                details: error.message
            });
        }
        res.status(500).json({ 
            success: false, 
            error: 'Failed to log catch',
            message: error.message 
        });
    }
});

// Sell fish
router.post('/sell-fish', validateBlockchain, async (req, res) => {
    try {
        const { catchId, buyer, weight, price, address } = req.body;

        // Validate input
        if (!catchId || !buyer || !weight || !price || !address) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing required fields',
                required: ['catchId', 'buyer', 'weight', 'price', 'address']
            });
        }

        // If blockchain is offline, save to temporary storage
        if (!await req.app.locals.isBlockchainOnline()) {
            req.app.locals.saveToTempStorage({
                type: 'sell-fish',
                data: { catchId, buyer, weight, price, address }
            });
            return res.json({ 
                success: true, 
                message: 'Saved to temporary storage'
            });
        }

        // Try to sell fish on blockchain
        const contract = req.app.locals.seafoodContract;
        const result = await contract.methods.sellFish(catchId, buyer, weight, price)
            .send({ 
                from: address, 
                gas: 500000  // Increased gas limit
            });

        res.json({ 
            success: true, 
            data: result,
            message: 'Fish sold successfully'
        });
    } catch (error) {
        console.error('Error in sell-fish:', error);
        if (error.message.includes('gas')) {
            return res.status(400).json({ 
                success: false, 
                error: 'Transaction error',
                message: 'Not enough gas or transaction rejected',
                details: error.message
            });
        }
        res.status(500).json({ 
            success: false, 
            error: 'Failed to sell fish',
            message: error.message 
        });
    }
});

// Get catch details
router.get('/catch/:id', async (req, res) => {
  try {
    if (!req.app.locals.seafoodContract) {
      throw new Error('Blockchain connection not available');
    }
    const catchId = req.params.id;
    const result = await req.app.locals.seafoodContract.methods.getCatchDetails(catchId).call();
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error in get-catch:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get temporary storage data
router.get('/temp-storage', (req, res) => {
    try {
        const data = req.app.locals.loadTempStorage();
        res.json({ 
            success: true, 
            data,
            count: data.length
        });
    } catch (error) {
        console.error('Error in get-temp-storage:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to load temporary storage',
            message: error.message 
        });
    }
});

// Get available accounts
router.get('/accounts', async (req, res) => {
    try {
        const web3 = req.app.locals.web3;
        const accounts = await web3.eth.getAccounts();
        
        res.json({
            success: true,
            accounts
        });
    } catch (error) {
        console.error('Error getting accounts:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get accounts',
            message: error.message
        });
    }
});

module.exports = router;