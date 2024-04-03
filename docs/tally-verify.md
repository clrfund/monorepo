# How to tally votes

Only a funding round coordinator can tally votes.


### Tally votes

Install MACI dependencies (see the github action, `.github/workflows/test-scripts.yml` for all the dependencies to install)

Run the script monorepo/.github/scripts/download-6-9-2-3.sh to download the parameter files.

Set the following env vars in `/contracts/.env`:

```
# private key for decrypting messages
COORDINATOR_MACISK=<coordinator-maci-private-key>

# private key for interacting with contracts
WALLET_MNEMONIC=
WALLET_PRIVATE_KEY
```

Decrypt messages, tally the votes and generate proofs:

```
yarn hardhat gen-proofs --clrfund {CLRFUND_CONTRACT_ADDRESS} --maci-tx-hash {MACI_CREATION_TRANSACTION_HASH} --proof-dir {OUTPUT_DIR} --rapidsnark {RAPID_SNARK} --network {network}
```

You only need to provide `--rapidsnark` if you are running the `tally` command on an intel chip.
If `gen-proofs` failed, you can rerun the command with the same parameters. If the maci-state.json file has been created, you can skip fetching MACI logs by providing the MACI state file as follow:

```
yarn hardhat gen-proofs --clrfund {CLRFUND_CONTRACT_ADDRESS} --maci-state-file {MACI_STATE_FILE_PATH} --proof-dir {OUTPUT_DIR} --rapidsnark {RAPID_SNARK} --network {network}
```


** Make a backup of the {OUTPUT_DIR} before continuing to the next step **


Upload the proofs on chain:
```
yarn hardhat prove-on-chain --clrfund {CLRFUND_CONTRACT_ADDRESS} --proof-dir {OUTPUT_DIR} --network {network}
yarn hardhat publish-tally-results --clrfund {CLRFUND_CONTRACT_ADDRESS} --proof-dir {OUTPUT_DIR} --network localhost
```

If there's error running `prove-on-chain` or `publish-tally-resuls`, simply rerun the commands with the same parameters.



Result will be saved to `{OUTPUT_DIR}/tally.json` file, which must then be published via IPFS.

**Using [command line](https://docs.ipfs.tech/reference/kubo/cli/#ipfs)**

```
# start ipfs daemon in one terminal
ipfs daemon

# in a diff terminal, go to `/contracts` (or where you have the file) and publish the file
ipfs add tally.json
```

### Finalize round

Make sure you have the following env vars in `.env`. Ignore this if you are running a local test round in `localhost`, the script will know these values itself.

```
# private key of the owner of the clrfund contract for interacting with the contract
WALLET_MNEMONIC=
WALLET_PRIVATE_KEY=
```

Once you have the `tally.json` from the tally script, run:

```
yarn hardhat finalize --tally-file {tally.json} --network {network}
```

# How to verify the tally results

Anyone can verify the tally results in the tally.json.

From the clrfund contracts folder, run the following command to verify the result:

```
yarn hardhat verify-tally-file --tally-file {tally.json} --network {network}
```

# How to enable the leaderboard view

After finalizing the round, enable the leaderboard view in the vue-app by exporting the round information as follow:

1) Set the etherscan API key in the hardhat.config.ts file in the contracts folder
2) Export the round and tally result

```sh
cd contracts

yarn hardhat export-round --output-dir ../vue-app/src/rounds --network {network} --round-address {round_address} --operator {operator} --start-block {recipient-registry-start-block} --ipfs {ipfs-gateway-url}

```
3) Build and deploy the app



## Troubleshooting
If you encountered `core dumped` while running the genProofs script as seen in this [issue](https://github.com/clrfund/monorepo/issues/383), make sure the files are not corrupted due to disk space issue, e.g. check file sizes, checksum, and missing files.

Also, lack of memory can also cause `core dump`, try to work around it by setting `max-old-space-size` before rrunning the tally script.
```
export NODE_OPTIONS=--max-old-space-size=4096
```

If you notice `Error at message index 0 - failed decryption due to either wrong encryption public key or corrupted ciphertext` while running the tally script, don't worry, it's just a warning. This issue is tracked [here](https://github.com/privacy-scaling-explorations/maci/issues/1134)

`Error at message index n - invalid nonce` is also a warning, not an error. This error occurs when users reallocated their contribution.
