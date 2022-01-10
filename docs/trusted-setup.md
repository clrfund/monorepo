# Trusted Setup

## How to verify the correctness of execution?

### Verify using MACI CLI

Clone the [MACI repo](https://github.com/appliedzkp/maci/) and switch to version v0.10.1:

```
git clone https://github.com/appliedzkp/maci.git
cd maci/
git checkout v0.10.1
```

Follow instructions in README.md to install necessary dependencies.

### x32 Circuits

Download [zkSNARK parameters](https://gateway.pinata.cloud/ipfs/QmWSxPBNYDtsK23KwYdMtcDaJg3gWS3LBsqMnENrVG6nmc) for 'x32' circuits into `circuits/params/` directory and rebuild the keys:

```
cd circuits
./scripts/buildSnarks32.sh
```

To recompile all the params (with Linux):

```
# install deps
sudo apt-get install build-essential libgmp-dev libsodium-dev nasm git

# remove everything from the /params folder
rm -r circuits/params/*

# recompile binaries (takes time: ~5min to ~10min)
cd circuits
./scripts/buildSnarks32.sh
```

Recompile the contracts:

```
cd ../contracts
npm run compileSol
```

Download the logs:

```
cd cli
node build/index.js fetchLogs \
    --eth-provider <ETH_HOSTNAME> \
    --contract <MACI_CONTRACT_ADDR> \
    --start-block <BLOCK_NUMBER> \
    --num-blocks-per-request <BLOCKS_PER_REQ> \
    --output logs
```

Generate proofs:

```
node build/index.js genProofs \
    --eth-provider <ETH_HOSTNAME> \
    --contract <MACI_CONTRACT_ADDR> \
    --privkey <COORDINATOR_PRIVKEY> \
    --output proofs.json \
    --tally-file tally.json
```

Download the tally file and verify it:

```
cd ../cli
node build/index.js verify -t tally.json
```

### Verify using clrfund scripts

Switch to `contracts` directory:

```
cd contracts/
```

Download [zkSNARK parameters](https://gateway.pinata.cloud/ipfs/QmRzp3vkFPNHPpXiu7iKpPqVnZB97wq7gyih2mp6pa5bmD) for 'medium' circuits to `snark-params` directory. Example:

```
ipfs get --output snark-params QmRzp3vkFPNHPpXiu7iKpPqVnZB97wq7gyih2mp6pa5bmD
```

Or download [zkSNARK parameters](https://gateway.pinata.cloud/ipfs/QmWSxPBNYDtsK23KwYdMtcDaJg3gWS3LBsqMnENrVG6nmc) for 'x32' circuits to `snark-params` directory. Example:

```
ipfs get --output snark-params QmWSxPBNYDtsK23KwYdMtcDaJg3gWS3LBsqMnENrVG6nmc
```

Set the path to downloaded parameter files:

```
export NODE_CONFIG='{"snarkParamsPath": "../../../contracts/snark-params/"}'
```

Verify:

```
yarn ts-node scripts/verify.ts tally.json
```
