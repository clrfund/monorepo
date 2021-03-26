# clr.fund contracts

## Working with ZK proofs

Install [zkutil](https://github.com/poma/zkutil) (see instructions in [MACI readme](https://github.com/appliedzkp/maci#get-started)).

Download [zkSNARK parameters](https://gateway.pinata.cloud/ipfs/Qmbi3nqjBwANPMk5BRyKjCJ4QSHK6WNp7v9NLLo4uwrG1f) for 'test' circuits to `snark-params` directory. Example:

```
ipfs get --output snark-params Qmbi3nqjBwANPMk5BRyKjCJ4QSHK6WNp7v9NLLo4uwrG1f
```

Set the path to downloaded parameter files and also the path to `zkutil` binary (if needed):

```
export NODE_CONFIG='{"snarkParamsPath": "../../../contracts/snark-params/", "zkutil_bin": "/usr/bin/zkutil"}'
```

## End-to-end tests

Run the tests:

```
yarn e2e
```

## Scripts

### Deploy factory contract

Deploy to local network:

```
yarn deploy:local
```

### Deploy test round

This includes:

- Deploying ERC20 token contract.
- Adding tokens to the matching pool.
- Adding recipients.
- Deploying funding round.
- Deploying MACI instance.

```
yarn deployTestRound:local
```

### Run test round

Set coordinator's private key (optional, by default the Ganache account #1 will be used):

```
export COORDINATOR_ETH_PK='0x...'
```

Contribute funds, wait until sign-up period ends (10 minutes) and vote:

```
yarn contribute:local
sleep 300s && yarn vote:local
```

Wait until voting period ends, process messages, tally votes and verify the results:

```
sleep 300s && yarn tally:local && yarn finalize:local
```

Claim funds:

```
yarn claim:local
```
