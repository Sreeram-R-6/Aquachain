const fs = require('fs');
const path = require('path');
const Web3 = require('web3');

// Connect to local blockchain
const web3 = new Web3('http://127.0.0.1:8545');

async function deploy() {
    try {
        // Get contract data
        const source = fs.readFileSync(path.join(__dirname, 'catchverify.sol'), 'utf8');
        
        // Compile contract
        const solc = require('solc');
        
        const input = {
            language: 'Solidity',
            sources: {
                'catchverify.sol': {
                    content: source
                }
            },
            settings: {
                outputSelection: {
                    '*': {
                        '*': ['*']
                    }
                }
            }
        };

        const compiledContract = JSON.parse(solc.compile(JSON.stringify(input)));
        const abi = compiledContract.contracts['catchverify.sol']['SeafoodTracking'].abi;
        const bytecode = compiledContract.contracts['catchverify.sol']['SeafoodTracking'].evm.bytecode.object;

        // Get accounts
        const accounts = await web3.eth.getAccounts();
        console.log('Deploying from account:', accounts[0]);

        // Deploy contract
        const contract = new web3.eth.Contract(abi);
        const deploy = contract.deploy({
            data: '0x' + bytecode
        });

        const gas = await deploy.estimateGas();
        const seafoodContract = await deploy.send({
            from: accounts[0],
            gas: gas
        });

        console.log('Contract deployed at:', seafoodContract.options.address);

        // Save contract data
        const contractData = {
            address: seafoodContract.options.address,
            abi: abi
        };

        if (!fs.existsSync(path.join(__dirname, 'artifacts'))) {
            fs.mkdirSync(path.join(__dirname, 'artifacts'));
        }

        fs.writeFileSync(
            path.join(__dirname, 'artifacts', 'SeafoodTracking.json'),
            JSON.stringify(contractData, null, 2)
        );

        console.log('Contract data saved to artifacts/SeafoodTracking.json');
    } catch (error) {
        console.error('Deployment failed:', error);
    }
}

deploy(); 