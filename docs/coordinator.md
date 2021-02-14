# Coordinator manual

## Coordinate using MACI CLI

Clone the [MACI repo](https://github.com/appliedzkp/maci/) and switch to version v0.5.7:

```
git clone https://github.com/appliedzkp/maci.git
cd maci/
git checkout v0.5.7
```

Follow instructions in README.md to install necessary dependencies.

Download trusted setup files into `circuits/params/` directory and rebuild the keys:

```
cd circuits
./scripts/buildSnarksSmall.sh
```

Recompile the contracts:

```
cd ../contracts
npm run compileSol
```

### Generate coordinator key

```
cd ../cli
node build/index.js genMaciKeypair
```

A single key can be used to coordinate multiple rounds.

### Tally votes

Decrypt messages:

```
cd ../cli
node build/index.js process \
    --eth-provider <json-rpc-api-url> \
    --contract <maci-address> \
    --privkey <coordinator-private-key> \
    --eth-privkey <eth-private-key> \
    --repeat
```

Coordinator private key must be in MACI key format (starts with `macisk`).
Ethereum private key can be any private key that controls the necessary amount of ETH to pay for gas.

The `process` command will print `Random state leaf` value at the end. This value will be needed to run the next command which tallies the votes:

```
node build/index.js tally \
    --eth-provider <json-rpc-api-url> \
    --contract <maci-address> \
    --privkey <coordinator-private-key> \
    --eth-privkey <eth-private-key> \
    --current-results-salt 0x0 \
    --current-total-vc-salt 0x0 \
    --current-per-vo-vc-salt 0x0 \
    --tally-file tally.json \
    --leaf-zero <random-state-leaf> \
    --repeat
```

The process may take several hours. Result will be saved to `tally.json` file in the same directory, which must then be published via IPFS.

Finally, the [CID](https://ipfs.io/ipns/docs.ipfs.io/concepts/content-addressing/) of tally file must be submitted to `FundingRound` contract:

```
await fundingRound.publishTallyHash('<CID>')
```

## Coordinate using clrfund scripts (exprimental, not recommended)

### Tally votes

Install [zkutil](https://github.com/poma/zkutil) (see instructions in [MACI readme](https://github.com/appliedzkp/maci#get-started)).

Switch to `contracts` directory:

```
cd contracts/
```

Download [zkSNARK parameters](https://ipfs.io/ipfs/QmateegDyF81zE1T8cfxE5qNo5aphEV4r7b1oxYMBsty5N) for 'small' circuits to `snark-params` directory. Example:

```
ipfs get --output snark-params QmateegDyF81zE1T8cfxE5qNo5aphEV4r7b1oxYMBsty5N
```

Set the path to downloaded parameter files and also the path to `zkutil` binary (if needed):

```
export NODE_CONFIG='{"snarkParamsPath": "../../../contracts/snark-params/", "zkutil_bin": "/usr/bin/zkutil"}'
```

Decrypt messages and tally the votes:

```
COORDINATOR_ETH_PK=<eth-private-key> CLRFUND_STATE='{"fundingRound": "<funding-round-address>", "coordinatorPrivKey": "<coordinator-private-key>"}' yarn hardhat run --network xdai scripts/tally.ts
```

Result will be saved to `tally.json` file, which must then be published via IPFS.
