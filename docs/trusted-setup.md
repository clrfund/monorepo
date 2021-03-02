# Trusted Setup

## How to verify the correctness of execution?

Clone the [MACI repo](https://github.com/appliedzkp/maci/) and switch to version v0.6.7:

```
git clone https://github.com/appliedzkp/maci.git
git checkout v0.6.7
```

Follow instructions in README.md to install necessary dependencies.

Download trusted setup files into `circuits/params/` directory and rebuild the keys:

```
cd circuits
./scripts/buildSnarksSmall.sh
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


