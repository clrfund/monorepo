# Coordinator manual

Clone the [MACI repo](https://github.com/appliedzkp/maci/) and switch to version v0.4.11:

```
git clone https://github.com/appliedzkp/maci.git
git checkout v0.4.11
```

Follow instructions in README.md to install necessary dependencies.

Download trusted setup files into `circuits/build/` directory and rebuild the keys:

```
cd circuits
./scripts/buildSnarksSmall.sh
```

Recompile the contracts:

```
cd ../contracts
npm run compileSol
```

Generate coordinator key:

```
cd ../cli
node build/index.js genMaciKeypair
```

## Tally votes

Decrypt messages:

```
cd ../cli
node build/index.js process \
    --eth-provider <json-rpc-api-url> \
    --contract <maci-address> \
    --privkey <coordinator-private-key> \
    --eth-privkey <eth-private-key> \
    --repeat
```

Coordinator private key must be in MACI key format (starts with `macisk`).
Ethereum private key can be any private key that controls the necessary amount of ETH to pay for gas.

The `process` command will print `Random state leaf` value at the end. This value will be needed to run the next command which tallies the votes:

```
node build/index.js tally \
    --eth-provider <json-rpc-api-url> \
    --contract <maci-address> \
    --privkey <coordinator-private-key> \
    --eth-privkey <eth-private-key> \
    --current-results-salt 0x0 \
    --current-total-vc-salt 0x0 \
    --current-per-vo-vc-salt 0x0 \
    --tally-file tally.json \
    --leaf-zero <random-state-leaf> \
    --repeat
```

The process may take several hours. Result will be saved to `tally.json` file in the same directory, which must then be published via IPFS.

Finally, the [CID](https://ipfs.io/ipns/docs.ipfs.io/concepts/content-addressing/) of tally file must be submitted to `FundingRound` contract:

```
await fundingRound.publishTallyHash('<CID>')
```
