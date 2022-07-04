# Deploy to a network

## Using the deployment scripts

### Edit the `/contracts/.env` file

E.g.

```
RECIPIENT_REGISTRY_TYPE=simple
USER_REGISTRY_TYPE=simple
JSONRPC_HTTP_URL=https://NETWORK.alchemyapi.io/v2/ADD_API_KEY
WALLET_PRIVATE_KEY=
NATIVE_TOKEN_ADDRESS=
```

### Run the deploy script

1. Adjust the `/contracts/scripts/deployRound.ts` as you wish. By default, it will deploy a new round with two random recipients.
2. Run `npx hardhat run --network {network} scripts/deployRound.ts` or use one of the `yarn deploy:{network}` available in `/contracts/package.json`.

### Deploy the subgraph

Currently, we are using the [Hosted Service](https://thegraph.com/docs/en/hosted-service/what-is-hosted-service/). First, check out the official instructions to authenicate using the Graph CLI https://thegraph.com/docs/en/hosted-service/deploy-subgraph-hosted/ and create a new subgraph.

Inside `/subgraph`:

1. Prepare the `subgraph.yaml` with the correct network data
   - Update or create a new JSON file which you want to use, under `/config`
   - Run `yarn prepare:{network}`
2. Deploy it by running `graph deploy --product hosted-service USERNAME/SUBGRAPH`
