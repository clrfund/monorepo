# Running the subgraph in a local env

## Deps

- Install Docker from https://docs.docker.com/engine/install/
- Install Docker Compose from https://docs.docker.com/compose/install/

## Clone the thegraph repo

Official instructions: https://thegraph.com/docs/developer/quick-start

```sh
git clone https://github.com/graphprotocol/graph-node/
```

## Adjust to use it with Hardhat

Note: before running the graph node, ensure your local Hardhat node is running. Inside the clr.fund repo:

```sh
yarn start:node
```

Inside the graph node repo:

```sh
cd graph-node/docker
```

Modify the `docker-compose.yml` file and set the correct Hardhat port been used

```yml
ethereum: "hardhat:http://host.docker.internal:18545"

# in Linux machines instead of `host.docker.internal` you should have the host IP address
ethereum: "hardhat:http://<IP>:18545"
```

Run the node:

```sh
docker-compose up
```

In case you want to stop the node and start it without any subgraph that could have been added before, wipe the db and deploy the subgraph again:

```sh
rm -rf data/postgres
```

## Run it locally

```sh
# having the thegraph node running in docker, just run this:
# it will deploy the contracts, the subgraph and run the webapp
yarn start:dev

# in case you want to only deploy the subgraph manually, run
# this will build the subgraph using the hardhat configs and then will deploy it into the local graph node
yarn start:subgraph
```

---

## Common errors

- **Error `trace_filter RPC call failed`**: any `callHandlers` or `blockHandlers` definition in the `subgraph.yaml` file won't work with Hardhat since it doesn't have trace support.

- **M1 Macbook Error**: When using docker with the M1 Apple products you will need to use a different image in the docker-compose. Fix found here: https://github.com/graphprotocol/graph-node/issues/2325. To implement fix, go to `docker-compose.yml` in `cd graph-node/docker` and change the `image` to: `image: graphprotocol/graph-node:2c23cce` for the graph-node service

- **Subgraph Queries returning null**: Check that your .env is setup properly with the right VUE_APP_SUBGRAPH_URL. If locally developing use: VUE_APP_SUBGRAPH_URL=http://localhost:8000/subgraphs/name/daodesigner/clrfund
