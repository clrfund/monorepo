# Deploy the ClrFundDeployer contract

The ClrFundDeployer contract is used to deploy `ClrFund` instances from the [ClrFund Admin](https://github.com/clrfund/clrfund-admin).

1. Follow the steps in the [deployment guide](./deployment.md) to install the dependencies, download the zkeys, setup BrightId (if applicable), and configure the `.env` and `deploy-config.json` files in the `contracts` folder

2. Run the deployment script

Run the following command in the contracts folder. Make sure you backup the `deployed-contracts.json` file (if exists) as the following command will overwrite the file.

```sh
yarn hardhat new-deployer --verify --network {network}
```

Use the `--verify` flag to verify the newly deployed contracts. Make sure the `etherscan` API key is setup in the hardhat.config file
Use the `--incremental` flag to resume a deployment if it was interrupted due to error.
Use the `--manage-nonce` flag to let the script manually set the nonce (as opposed to getting the nonce from the node).  This is useful if using testnet public node like `optimism-sepolia` where the node may occasionally give `nonce too low` error.

