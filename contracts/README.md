# clr.fund contracts

## Scripts

### Deploy factory contract

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

Install [zkutil](https://github.com/poma/zkutil) (see instructions in [MACI readme](https://github.com/appliedzkp/maci#get-started)).

Set the path to zkutil binary if needed:

```
export NODE_CONFIG='{"zkutil_bin": "/usr/bin/zkutil"}'
```

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
sleep 300s && yarn tally:local
```

Claim funds:

```
yarn claim:local
```
