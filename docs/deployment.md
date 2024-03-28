# Deploy to a network

## Install MACI dependencies

### Install rapidsnark (if on an intel chip)

Check the MACI doc, https://maci.pse.dev/docs/installation#install-rapidsnark-if-on-an-intel-chip, on how to install the rapidsnark.


### Install C++ dependencies (if on intel chip)

```
sudo apt-get install libgmp-dev nlohmann-json3-dev nasm g++
```

## Setup BrightID
If using BrightID as the user registry type:

### Register your app with BrightID using the following form:

https://forms.gle/pxHw6aQy155yCuA39

Note: select the `hex address (ONLY)` option to identify users and the `meet` verification type

Once the app is registered, you will get an appId which will be set to `BRIGHTID_CONTEXT` when deploying the contracts in later steps.

### Setup BrightID sponsorship keys

1. Generate sponsorship signing keys here: https://tweetnacl.js.org/#/sign
2. Provide the public key to BrightID support through their discord channel: https://discord.gg/QW7ThZ5K4V
3. Save the private key for setting up the clrfund user interface in environment variable: `VITE_BRIGHTID_SPONSOR_KEY`


## Deploy Contracts

Goto the `contracts` folder.

### Generate the coordinator MACI private key

```
yarn hardhat new-maci-key
```

Make a note of MACI private key to setup the `contracts/.env` file. 

### Edit the `contracts/.env` file

E.g.

```
JSONRPC_HTTP_URL=https://NETWORK.alchemyapi.io/v2/ADD_API_KEY
WALLET_PRIVATE_KEY=
COORDINATOR_MACISK=The coordinator's private key from previous step which starts with `macisk.`
# API keys for verifying contracts, update hardhat.config for additional keys if needed
ARBISCAN_API_KEY=
```

### Download MACI circuit files

The following script will download the files in the params folder under the current folder where the script is run

```
monorepo/.github/scripts/download-6-9-2-3.sh
```


### Edit the `contracts/deploy-config.json` file

```
cp deploy-config-example.json deploy-config.json
```

Update the `VkRegistry.paramsDirectory` with the circuit parameter folder. If you ran the `monorepo/.github/scripts/download-6-9-2-3.sh` in the `contracts` folder, it should be `./params`.


### Run the deployment scripts
Use `yarn hardhat help` to print the command line help menu for all available commands. Note that the following steps are for deploying a standalone ClrFund instance. To deploy an instance of the ClrFundDeployer contract, please refer to the [ClrFundDeployer Deployment Guide](./deploy-clrFundDeployer.md)

1. Deploy an instance of ClrFund

```
yarn hardhat new-clrfund --network <network>
```

Notice that the file `deployed-contracts.json` is created or updated (if already exists). Make a copy of this file now in case you run the `new-clrfund` command without the --incremental flag, this file will be overwritten. You'll need this file for the `new-round` and `verify-all` commands.

2. deploy new funding round
```
yarn hardhat new-round --network <network>
```

4. To load a list of users into the simple user registry,

```
yarn hardhat load-simple-users --file-path addresses.txt --user-registry <address> --network <network>
```


If using a snapshot user registry, run the `set-storage-root` task to set the storage root for the block snapshot for user account verification

```
yarn hardhat set-storage-root --registry {user-registry-address} --slot 2 --token {token-address} --block 34677758 --network {network}
```

Note: to get the storage slot '--slot' value, run the `find-storage-slot` task.

5. If using a merkle user registry, run the `load-merkle-users` task to set the merkle root for all the authorized users

```
# for example:
yarn hardhat load-merkle-users --address-file ./addresses.txt --user-registry 0x9E1c12Af45504e66D16D592cAF3B877ddc6fF643 --network arbitrum-goerli
```

Note: Make sure to upload generated merkle tree file to IPFS.


8. Verify all deployed contracts:
Make sure the `deployed-contracts.json` file is present as it stores contract constructor arguments used by the verify-all script.

```
yarn hardhat verify-all --network {network}
```

### Deploy the subgraph

Currently, we are using the [Hosted Service](https://thegraph.com/docs/en/hosted-service/what-is-hosted-service/). First, check out the official instructions to authenticate using the Graph CLI https://thegraph.com/docs/en/hosted-service/deploy-subgraph-hosted/ and create a new subgraph.

Inside `/subgraph`:

1. Prepare the config file
   - Under the `/config` folder, create a new JSON file or update an existing one
   - If you deployed a standalone ClrFund contract, use the `xdai.json` as a template to create your config file
   - If you deployed a ClrFundDeployer contract, use the `deployer-arbitrum-sepolia.json` as a template
2. Prepare the `schema.graphql` file
   - Run `npx mustache <your-config-file> schema.template.graphql > schema.graphql`
2. Prepare the `subgraph.yaml` file
   - Run `npx mustache <your-config-file> subgraph.template.yaml > subgraph.yaml`
3. Build:
   - `yarn codegen`
   - `yarn build`
4. Authenticate with `yarn graph auth --product hosted-service <ACCESS_TOKEN>`
5. Deploy it by running `yarn graph deploy --product hosted-service USERNAME/SUBGRAPH`


### Deploy the user interface

#### Deploy on netlify

##### Setup the environment variables

copy .env.example from the `/vue-app` folder to .env and make sure to revise the following parameters

```
VITE_ETHEREUM_MAINNET_API_URL=https://mainnet.infura.io/v3/ADD_API_KEY
VITE_ETHEREUM_API_URL=
VITE_ETHEREUM_API_CHAINID=
VITE_INFURA_ID=
VITE_IPFS_API_KEY=
VITE_IPFS_SECRET_API_KEY=
VITE_SUBGRAPH_URL=
VITE_CLRFUND_ADDRESS=
VITE_USER_REGISTRY_TYPE=
VITE_BRIGHTID_CONTEXT=
VITE_BRIGHTID_SPONSOR_KEY=
VITE_BRIGHTID_SPONSOR_API_URL=https://brightid.clr.fund/brightid/v6/operations
VITE_RECIPIENT_REGISTRY_TYPE=

# see google-sheets.md for instruction on how to set these
GOOGLE_APPLICATION_CREDENTIALS=
VITE_GOOGLE_SPREADSHEET_ID=

```

##### Setup the netlify functions

1. Set the `functions directory` to `vue-app/dist/lambda`.

See [How to set netlify function directory](https://docs.netlify.com/functions/optional-configuration/?fn-language=ts)

2. Set environment variable: `AWS_LAMBDA_JS_RUNTIME=nodejs18.x`

This environment variable is needed for the `sponsor.js` function. If not set, it will throw error `fetch not found`.


#### Deploy on IPFS

Add static files to IPFS:

```
ipfs add -r vue-app/dist/
```

