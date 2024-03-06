# Deploy to a network

## Install MACI dependencies

### Install rapidsnark (if on an intel chip)

Check the MACI doc, https://maci.pse.dev/docs/installation#install-rapidsnark-if-on-an-intel-chip, on how to install the rapidsnark.


### Install C++ dependencies (if on intel chip)

```
sudo apt-get install libgmp-dev nlohmann-json3-dev nasm g++
```

### Download MACI circuit files

The following script will download the files in the params folder under the current folder where the script is run

```
monorepo/.github/scripts/download-6-9-2-3.sh
```

Make a note of this `params` folder as you'll need it to run the tally script.

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

### Deploy the BrightID sponsor contract (if using BrightID)

1. Deploy the BrightID sponsor contract

```
HARDHAT_NETWORK={network} yarn ts-node cli/deploySponsor.ts
```

2. Verify the contract by running `yarn hardhat --network {network} verify {contract address}`
3. Set `BRIGHTID_SPONSOR` to the contract address in the next step

### Edit the `/contracts/.env` file

E.g.

```
JSONRPC_HTTP_URL=https://NETWORK.alchemyapi.io/v2/ADD_API_KEY
WALLET_PRIVATE_KEY=
ARBISCAN_API_KEY=
```

### Run the deploy script
Use the `-h` switch to print the command line help menu for all the scripts in the `cli` folder. For hardhat help, use `yarn hardhat help`.


1. Deploy an instance of ClrFund

```
yarn hardhat new-clrfund \
   --directory <the params folder from previous step> \
   --token <native token address> \
   --coordinator <coordinator ETH address> \
   --user-registry-type <user registry type> \
   --recipient-registry-type <recipient registry type> \
   --network <network>
```

2. deploy new funding round
```
yarn hardhat new-round \
   --clrfund <clrfund contract address> \
   --duration <funding round duration in seconds> \
   --network <network>
```

3. Make sure to save in a safe place the serializedCoordinatorPrivKey, you are going to need it for tallying the votes in future steps.


4. To load a list of users into the simple user registry,

```
yarn hardhat clr-load-simple-users --file-path addresses.txt --user-registry <address> --network <network>
```


If using a snapshot user registry, run the `set-storage-root` task to set the storage root for the block snapshot for user account verification

```
yarn hardhat --network {network} set-storage-root --registry 0x7113b39Eb26A6F0a4a5872E7F6b865c57EDB53E0 --slot 2 --token 0x65bc8dd04808d99cf8aa6749f128d55c2051edde --block 34677758 --network arbitrum-goerli
```

Note: to get the storage slot '--slot' value, run the `clr-find-storage-slot` task.

5. If using a merkle user registry, run the `load-merkle-users` task to set the merkle root for all the authorized users

```
# for example:
yarn hardhat clr-load-merkle-users --address-file ./addresses.txt --user-registry 0x9E1c12Af45504e66D16D592cAF3B877ddc6fF643 --network arbitrum-goerli
```

Note: Make sure to upload generated merkle tree file to IPFS.


8. Verify all deployed contracts:

```
yarn hardhat verify-all --clrfund {clrfund-address} --network {network}
```

### Deploy the subgraph

Currently, we are using the [Hosted Service](https://thegraph.com/docs/en/hosted-service/what-is-hosted-service/). First, check out the official instructions to authenticate using the Graph CLI https://thegraph.com/docs/en/hosted-service/deploy-subgraph-hosted/ and create a new subgraph.

Inside `/subgraph`:

1. Prepare the `subgraph.yaml` with the correct network data
   - Update or create a new JSON file which you want to use, under `/config`
   - Run `yarn prepare:{network}`
2. Build:
   - `yarn codegen`
   - `yarn build`
3. Authenticate with `yarn graph auth --product hosted-service <ACCESS_TOKEN>`
4. Deploy it by running `yarn graph deploy --product hosted-service USERNAME/SUBGRAPH`


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

