# Deploy to a network

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

### Deploy the BrightID sponsor contract

1. Run `yarn hardhat --network {network} deploy-sponsor`
2. Verify the contract by running `yarn hardhat --network arbitrum-goerli verify {contract address}`
3. Set `BRIGHTID_SPONSOR` to the contract address in the next step

### Edit the `/contracts/.env` file

E.g.

```
RECIPIENT_REGISTRY_TYPE=simple
USER_REGISTRY_TYPE=simple
JSONRPC_HTTP_URL=https://NETWORK.alchemyapi.io/v2/ADD_API_KEY
WALLET_PRIVATE_KEY=
NATIVE_TOKEN_ADDRESS=
BRIGHTID_CONTEXT=
BRIGHTID_SPONSOR=
```

### Run the deploy script

1. Adjust the `/contracts/scripts/deploy.ts` as you wish.
2. Run `yarn hardhat run --network {network} scripts/deploy.ts` or use one of the `yarn deploy:{network}` available in `/contracts/package.json`.
3. To deploy a new funding round, update the .env file with the funding round factory address deployed in the previous step and run the `newRound.ts` script:

```
# .env
FACTORY_ADDRESS=
```

```
yarn hardhat run --network {network} scripts/newRound.ts
```

4. Verify all deployed contracts:

```
yarn hardhat verify-all {funding-round-factory-address} --network {network}
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
VITE_CLRFUND_FACTORY_ADDRESS=
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

