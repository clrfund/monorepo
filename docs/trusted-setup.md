# Trusted Setup

## How to verify the correctness of execution?

### Verify using MACI CLI

Clone the [MACI repo](https://github.com/appliedzkp/maci/) and switch to version v0.9.4:

```
git clone https://github.com/appliedzkp/maci.git
cd maci/
git checkout v0.9.4
```

Follow instructions in README.md to install necessary dependencies.


### Medium Circuits
Download [zkSNARK parameters](https://gateway.pinata.cloud/ipfs/QmRzp3vkFPNHPpXiu7iKpPqVnZB97wq7gyih2mp6pa5bmD) for 'medium' circuits into `circuits/params/` directory and rebuild the keys:

```
cd circuits
./scripts/buildSnarksMedium.sh
```

### x32 Circuits
Download [zkSNARK parameters](https://gateway.pinata.cloud/ipfs/QmWSxPBNYDtsK23KwYdMtcDaJg3gWS3LBsqMnENrVG6nmc) for 'x32' circuits into `circuits/params/` directory and rebuild the keys:

```
cd circuits
./scripts/buildSnarks32.sh
```

Recompile the contracts:

```
cd ../contracts
npm run compileSol
```

Download the tally file and verify it:

```
cd ../cli
node build/index.js verify -t tally.json
```

### Verify using clrfund scripts

Switch to `contracts` directory:

```
cd contracts/
```

Download [zkSNARK parameters](https://gateway.pinata.cloud/ipfs/QmRzp3vkFPNHPpXiu7iKpPqVnZB97wq7gyih2mp6pa5bmD) for 'medium' circuits to `snark-params` directory. Example:

```
ipfs get --output snark-params QmRzp3vkFPNHPpXiu7iKpPqVnZB97wq7gyih2mp6pa5bmD
```

Set the path to downloaded parameter files:

```
export NODE_CONFIG='{"snarkParamsPath": "../../../contracts/snark-params/"}'
```

Verify:

```
yarn ts-node scripts/verify.ts tally.json
```

### Note on x32 circuits

Use v0.9.4 to install Zkutil use the script at maci/circuits/scripts/installZkutil.sh

```
./circuits/scripts/installZkutil.sh
```

x32 circuits are too large to compile down to wasm and use C instead to generate a binary. Should you find the need to recompile the binary from the C files generated in the trusted ceremony or recreate the QVT and BUST verifiers you may do so by running:

Quadratic Vote Tally Verifier: 
```
sudo g++ -pthread main.cpp calcwit.cpp utils.cpp fr.cpp fr.o qvt32.c -o qvt32 -lgmp -std=c++11 -O3 -fopenmp -DSANITY_CHECK
```
BatchUst Verifier:
```
sudo g++ -pthread main.cpp calcwit.cpp utils.cpp fr.cpp fr.o batchUst.c -o batchUst -lgmp -std=c++11 -O3 -fopenmp -DSANITY_CHECK
```
