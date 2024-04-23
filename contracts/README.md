# clr.fund contracts

## Working with ZK proofs

Read the [deployment guide](../docs/deployment.md) on how to install MACI dependencies, which include installing rapidsnark (for ubuntu only), c++ libraries and downloading circuit parameter files.

## End-to-end tests

Start the hardhat node:
```
yarn run node
```

Run the tests:

```
yarn e2e
```

## Scripts
### Generate coordinator key

```
yarn hardhat new-maci-key
```

### Copy env for contracts

```sh
# update COORDINATOR_MACISK with the MACI key from previous step
# adjust other configuration if necessary
cp contracts/.env.example contracts/.env
```

### Copy configuration for contract deployment

```sh
# adjust the configuration for localhost if necessary
cp contracts/deploy-config-example.json contracts/deploy-config.json
```

### Deploy the ClrFund contract

Deploy to local network:

```
yarn deploy:local
```

### Run test round

Download the circuit zkeys:

```
# this script will download the zkeys in the params folder where the script is run
../.github/scripts/download-6-9-2-3.sh
```

If you have previously downloaded the zkeys, you can export the environment variable CIRCUIT_DIRECTORY to point to the directory.

Run the script, the github action test-script.yml uses this script.

```
sh/runScriptTests.sh
```

The test includes setting coordinator keys, contribute funds, vote, tally, finalize and claim funds

### Verify all clr.fund contracts
The following command will verify all clr.fund contracts. It will log a warning if contract already verified or missing.

```
yarn hardhat verify-all --network <network>
```

