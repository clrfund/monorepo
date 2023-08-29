# Static Rounds

This folder is used to store the round data generated once a round is finalized.  The leaderboard is populated with data from these round data files.

The app will load round tally information from this file if it exists, otherwise, it will load dynamically from the subgraph or the smart contracts.

Steps to generate the file:
```
cd contracts

# make sure the JSONRPC_HTTP_URL environment variable is set to
# the arbitrum provider in the .env file

# export the clr.fund round 9 data into the rounds folder
yarn hardhat export-round --operator Clr.fund --output-dir ../vue-app/src/rounds --round-address 0x806F08B7DD31fE0267e8c70C4bF8C4BfbBddE760 --ipfs 'https://ipfs.io' --start-block 96912490 --network arbitrum

```
