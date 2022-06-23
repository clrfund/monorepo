# How to tally votes

A funding round coordinator can tally votes using the MACI CLI, Docker or clrfund scripts.

## Using MACI CLI

### Clone the [MACI repo](https://github.com/privacy-scaling-explorations/maci) and switch to version v0.10.1:

```
git clone https://github.com/privacy-scaling-explorations/maci.git
cd maci/
git checkout v0.10.1
```

Follow instructions in README.md to install necessary dependencies.

### Download circuits parameters

Download the [zkSNARK parameters](https://gateway.pinata.cloud/ipfs/QmbVzVWqNTjEv5S3Vvyq7NkLVkpqWuA9DGMRibZYJXKJqy) for 'batch 64' circuits into the `circuits/params/` directory.

Change the permission of the c binaries to be executable:
```
cd circuits/params
chmod u+x qvt32 batchUst32
```

The contract deployment scripts, `deploy*.ts` in the [clrfund repository](https://github.com/clrfund/monorepo/tree/develop/contracts/scripts) currently use the `batch 64` circuits, if you want to use a smaller size circuits, you can find them [here](../contracts/contracts/snarkVerifiers/README.md). You will need to update the deploy script to call `deployMaciFactory()` with your circuit and redeploy the contracts.

```
   // e.g. to use the x32 circuits
   const circuit = 'x32' // defined in contracts/utils/deployment.ts
   const maciFactory = await deployMaciFactory(deployer, circuit)
```

### Recompile the contracts:

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

Download the logs to be fed to the `proveOnChain` step. This step is useful
especially to avoid hitting rating limiting from the node. Make sure to run this
step againts a node that has archiving enabled, e.g. could use the alchemy node:

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

## Using Docker

In case you are in a different OS than Linux, you can run all the previous MACI CLI commands by running the Docker image located in the MACI repo.

**Note:** the batch 64 zkSNARK parameters have been tested using Ubuntu 22.04 + Node v16.13.2

### Use the docker image

First, install [docker](https://docs.docker.com/engine/install/) and [docker-compose](https://docs.docker.com/compose/install/)

Inside the maci repo, run:

```
docker-compose up
```

Once the container is built, in a different terminal, grab the container id:

```
docker container ls
```

Get inside the container and execute the scripts you want:

```
docker exec -it {CONTAINER_ID} bash

# inside the container
cd cli/
node build/index.js genProofs ...
```

## Using clrfund scripts

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

Download [zkSNARK parameters](https://gateway.pinata.cloud/ipfs/QmbVzVWqNTjEv5S3Vvyq7NkLVkpqWuA9DGMRibZYJXKJqy) for 'batch 64' circuits to `snark-params` directory. Example:

```
ipfs get --output snark-params QmbVzVWqNTjEv5S3Vvyq7NkLVkpqWuA9DGMRibZYJXKJqy
```

Change the permission of the c binaries to be executable:
```
cd snark-params
chmod u+x qvt32 batchUst32
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

**Using [command line](https://docs.ipfs.io/reference/cli/)**

```
# start ipfs daemon in one terminal
ipfs daemon

# in a diff terminal, go to `/contracts` (or where you have the file) and publish the file
ipfs add tally.json
```

### Finalize round

Make sure you have the following env vars in `.env`. Ignore this if you are running a local test round in `localhost`, the script will know these values itself.

```
FACTORY_ADDRESS=<funding-round-factory-address>
COORDINATOR_ETH_PK=<eth-private-key>
```

Once you have the `tally.json` from the tally script, run:

```
yarn hardhat run --network {network} scripts/finalize.ts
```

# How to verify the tally results

Anyone can verify the tally results using the MACI cli or clrfund scripts.

### Using MACI CLI

Follow the steps in tallying votes to get the MACI cli, circuit parameters, and tally file, and verify using the following command:

```
node build/index.js verify -t tally.json
```

### Using clrfund scripts

From the clrfund contracts folder, run the following command to verify the result:

```
yarn ts-node scripts/verify.ts tally.json
```
