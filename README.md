# Hackathon Helper

[Quasar](https://quasar.dev) + [Buidler](https://buidler.dev) + [Ethers](https://docs.ethers.io/ethers.js) + [Waffle](https://getwaffle.io) + [TypeChain](https://github.com/ethereum-ts/TypeChain) + [OpenZeppelin SDK](https://docs.openzeppelin.com/openzeppelin)

Wondering where to begin with tooling or if your old tooling is still relevant? This template has vetted and configured best practice dApp development tools to give you a powerful smart contract development environment - paired with an easy to learn (and also powerful) frontend framework - without you having to do a ton of research. 

Rest easy (on a bean bag most likely) knowing that your project's stack is built to last. Don't wait, accelerate your next proof of concept with **Hackathon Helper** today!

## Batteries Included

* **Buidler** - provides next level Solidity debugging with stack traces.

* **Waffle** - makes writing tests for your contracts dead simple.

* **TypeChain** - makes your tests type safe and magically autocompletes smart contract function names in your IDE.

* **OpenZeppelin SDK** - allows you to easily deploy and upgrade your contracts on multiple networks.

* **Quasar** - a popular Vue/TypeScript framework with a built in component system built on material design. Allows you to build a cross-platform dApp with a single codebase.

* **Ethers + Vuex module** - allows you to interact with the contracts from the frontend and keep network, account, and contract information in sync.

## Install the dependencies
```
yarn
```

### Compile and type safe the contracts
```
yarn compile
```

### Run Waffle tests with stack traces
```
yarn test
```

### Start the frontend app in development mode (hot-code reloading, error reporting, etc.)
```
yarn ganache
```
and in a new terminal
```
yarn dev
```

### Start the frontend sans a local blockchain
```
yarn web
```

### Lint the files
```
yarn lint
```

### Build the dApp for production
```
yarn build
```

### Customize the configuration
See [Configuring quasar.conf.js](https://quasar.dev/quasar-cli/quasar-conf-js).
