# Coordinator manual

## Coordinate using MACI CLI

Clone the [MACI repo](https://github.com/appliedzkp/maci/) and switch to version v0.10.1:

```
git clone https://github.com/appliedzkp/maci.git
cd maci/
git checkout v0.10.1
```

Follow instructions in README.md to install necessary dependencies.

### Medium Circuits

Download [zkSNARK parameters](https://gateway.pinata.cloud/ipfs/QmRzp3vkFPNHPpXiu7iKpPqVnZB97wq7gyih2mp6pa5bmD) for 'medium' circuits into `circuits/params/` directory and rebuild the keys:

```
cd circuits
./scripts/buildSnarksMedium.sh
```

### x32 Circuits

Download [zkSNARK parameters](https://gateway.pinata.cloud/ipfs/QmWSxPBNYDtsK23KwYdMtcDaJg3gWS3LBsqMnENrVG6nmc) for 'x32' circuits into `circuits/params/` directory and rebuild the keys:

```
cd circuits
./scripts/buildSnarks32.sh
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

Download the logs:

```
cd ../cli
node build/index.js fetchLogs \
    --eth-provider <ETH_HOSTNAME> \
    --contract <MACI_CONTRACT_ADDR> \
    --start-block <BLOCK_NUMBER> \
    --num-blocks-per-request <BLOCKS_PER_REQ> \
    --output logs
```

Decrypt messages and tally the votes:

```
node build/index.js proveOnChain \
    --eth-provider <ETH_HOSTNAME> \
    --contract <MACI_CONTRACT_ADDR> \
    --privkey <COORDINATOR_PRIVKEY> \
    --output proofs.json \
    --tally-file tally.json
```

Coordinator private key must be in MACI key format (starts with `macisk`).
Ethereum private key can be any private key that controls the necessary amount of ETH to pay for gas.

The `genProofs` command will create two files: `proofs.json` and `tally.json`. The `proofs.json` file will be needed to run the next command which submits proofs to MACI contract:

```
node build/index.js proveOnChain \
    --eth-provider <json-rpc-api-url> \
    --contract <maci-address> \
    --privkey <coordinator-private-key> \
    --eth-privkey <eth-private-key> \
    --proof-file proofs.json
```

The process may take several hours. Results can be found in `tally.json` file, which must then be published via IPFS.

Finally, the [CID](https://ipfs.io/ipns/docs.ipfs.io/concepts/content-addressing/) of tally file must be submitted to `FundingRound` contract:

```
await fundingRound.publishTallyHash('<CID>')
```

## Coordinate using clrfund scripts

### Generate coordinator key

```
cd contracts/
yarn ts-node scripts/generate-key.ts
```

A single key can be used to coordinate multiple rounds.

### Tally votes

Install [zkutil](https://github.com/poma/zkutil) (see instructions in [MACI readme](https://github.com/appliedzkp/maci#get-started)).

Switch to `contracts` directory:

```
cd contracts/
```

Download [zkSNARK parameters](https://gateway.pinata.cloud/ipfs/QmRzp3vkFPNHPpXiu7iKpPqVnZB97wq7gyih2mp6pa5bmD) for 'medium' circuits to `snark-params` directory. Example:

```
ipfs get --output snark-params QmRzp3vkFPNHPpXiu7iKpPqVnZB97wq7gyih2mp6pa5bmD
```

Set the path to downloaded parameter files and also the path to `zkutil` binary (if needed):

```
export NODE_CONFIG='{"snarkParamsPath": "../../../contracts/snark-params/", "zkutil_bin": "/usr/bin/zkutil"}'
```

Set the following env vars in `.env`:

```
ROUND_ADDRESS=<funding-round-address>
COORDINATOR_PK=<coordinator-private-key>
COORDINATOR_ETH_PK=<eth-private-key>
```

Decrypt messages and tally the votes:

```
yarn hardhat run --network {network} scripts/tally.ts
```

Result will be saved to `tally.json` file, which must then be published via IPFS.

### Finalize round

Make sure you have the following env vars in `.env`. Ignore this if you are running a local test round in `localhost`, the script will know these values itself.

```
ROUND_ADDRESS=<funding-round-address>
COORDINATOR_ETH_PK=<eth-private-key>
```

Once you have the `tally.json` from the tally script, run:

```
yarn hardhat run --network {network} scripts/finalize.ts
```
