# Static Rounds

This folder is used to store the static round files, which can be generated once a round is finalized. 

The app will load round tally information from this file if it exists, otherwise, it will load dynamically from the subgraph or the smart contracts.

Steps to generate the file:
```
cd contracts

# make sure the JSONRPC_HTTP_URL environment variable is set to
# the arbitrum provider in the .env file

# extract the EthColombia round data into the rounds folder
yarn hardhat fetch-round --operator ETHColombia --output-dir ../vue-app/src/rounds --round-address 0x4a2d90844eb9c815ef10db0371726f0ceb2848b0 --network arbitrum

```
