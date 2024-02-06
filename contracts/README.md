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

### Deploy the ClrFund contract

Deploy to local network:

```
yarn deploy:local
```

### Run test round

Run the script, the github action test-script.yml uses this script.

```
sh/runScriptTests.sh
```

The test includes setting coordinator keys, contribute funds, vote, tally, finalize and claim funds

### Verify all clr.fund contracts
The following command will verify all clr.fund contracts. It will log a warning if contract already verified or missing.

```
yarn hardhat verify-all --clrfund <clrfund-address>  --network <network>
```

### Generate coordinator key
If you want to genereate a single key to coordinate multiple rounds.

```
yarn ts-node tasks/maciNewKey.ts
```
