# Buidler + ethers.js + TypeChain + Vue (TypeScript)

Inspired by [The New Solidity Dev Stack: Buidler + Ethers + Waffle + Typescript [Tutorial]](https://hackernoon.com/the-new-solidity-dev-stack-buidler-ethers-waffle-typescript-706830w0), this is a pre-configured starter kit that uses the latest and greatest tool set to go from zero to proof of concept in a quarter of the time 🚀, with 10x the type safety 🛡️ and debugging capabilities 🐞.

Leverage best practice tools such as Buidler 🔨 for stack traces and `console.log` in contracts, TypeChain 🔗 for contract and front end type safety, Waffle 🥞 for type safe ethers.js native testing, and Vue with TypeScript/TypeChain support 🎀 to round out the stack.

As an added bonus: easily deploy upgradeable contracts (update logic while maintaining state 📬) using the built-in OpenZeppelin CLI. Never worry about migrating again!

Finally, there's lots of under the hood goodies that come pre-configured to build beautiful Progressive Web Apps 🦋 with state management and routing; with more features being released rapidly! Next on deck: gasless transactions ⛽🔥

Ready to develop like the pros? [Use this template to get started!](https://github.com/proofoftom/buidler-ethers-typechain-vue/generate)

## Using the template

Once you've [generated a project](https://github.com/proofoftom/buidler-ethers-typechain-vue/generate) and cloned it locally:

### Install the dependencies
```
yarn
```

#### Compile and generate type definitions for your contracts
```
yarn build:contracts
```

#### Run your Waffle tests with stack traces
```
yarn test:contracts
```

#### Start the frontend app in development mode (hot-code contract reloading, revert reporting, etc.)
```
yarn start:node
```
and in a new terminal
```
yarn start:dev
```
then open the app running [locally](http://localhost:8080) in your favorite browser.

#### Upgrade your contracts locally
```
yarn upgrade:local
```

#### Start the frontend sans a local blockchain
```
yarn start:web
```

#### Build the dApp for production
```
yarn build
```

#### Run your unit tests
```
yarn test:unit
```

#### Run your end-to-end tests
```
yarn test:e2e
```

#### Lint and fix files
```
yarn lint
```

#### Customize Vue configuration
See [Configuration Reference](https://cli.vuejs.org/config).

#### Other Documentation
* [Buidler](https://buidler.dev/getting-started)
* [Waffle](https://ethereum-waffle.readthedocs.io)
* [ethers.js](https://docs.ethers.io/ethers.js/html)
* [TypeChain](https://github.com/ethereum-ts/TypeChain)
* [OpenZeppelin CLI](https://docs.openzeppelin.com/cli/2.7)
* [Vuetify](https://vuetifyjs.com/getting-started/quick-start)
