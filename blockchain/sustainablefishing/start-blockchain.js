const ganache = require("ganache");
const Web3 = require("web3");
const fs = require("fs");
const path = require("path");

async function startBlockchain() {
    try {
        // Start Ganache with increased limits
        const server = ganache.server({
            wallet: {
                totalAccounts: 10,
                defaultBalance: 1000
            },
            chain: {
                chainId: 1337,
                networkId: 5777,
                allowUnlimitedContractSize: true,
                gasLimit: 8000000
            },
            logging: {
                quiet: false
            },
            miner: {
                blockGasLimit: 8000000
            }
        });

        await server.listen(8546);
        console.log("Ganache running on http://127.0.0.1:8546");

        // Connect Web3
        const web3 = new Web3("http://127.0.0.1:8546");

        // Get contract data
        const source = fs.readFileSync(path.join(__dirname, "catchverify.sol"), "utf8");
        
        // Compile contract
        const solc = require("solc");
        
        const input = {
            language: "Solidity",
            sources: {
                "catchverify.sol": {
                    content: source
                }
            },
            settings: {
                outputSelection: {
                    "*": {
                        "*": ["*"]
                    }
                }
            }
        };

        console.log("Compiling contract...");
        const compiledContract = JSON.parse(solc.compile(JSON.stringify(input)));
        const abi = compiledContract.contracts["catchverify.sol"]["SeafoodTracking"].abi;
        const bytecode = compiledContract.contracts["catchverify.sol"]["SeafoodTracking"].evm.bytecode.object;

        // Get accounts
        const accounts = await web3.eth.getAccounts();
        console.log("Available accounts:", accounts);
        console.log("Deploying from account:", accounts[0]);

        // Deploy contract with higher gas limit
        const contract = new web3.eth.Contract(abi);
        const deploy = contract.deploy({
            data: "0x" + bytecode
        });

        const gas = await deploy.estimateGas();
        const seafoodContract = await deploy.send({
            from: accounts[0],
            gas: Math.min(8000000, gas * 2) // Use either 8M gas or double the estimate, whichever is lower
        });

        console.log("Contract deployed at:", seafoodContract.options.address);

        // Save contract data
        const contractData = {
            address: seafoodContract.options.address,
            abi: abi
        };

        if (!fs.existsSync(path.join(__dirname, "artifacts"))) {
            fs.mkdirSync(path.join(__dirname, "artifacts"));
        }

        fs.writeFileSync(
            path.join(__dirname, "artifacts", "SeafoodTracking.json"),
            JSON.stringify(contractData, null, 2)
        );

        console.log("Contract data saved to artifacts/SeafoodTracking.json");
        
        // Keep the script running
        console.log("\nBlockchain is running. Press Ctrl+C to stop.");
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

startBlockchain(); 