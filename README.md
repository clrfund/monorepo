# clr.fund

clr.fund is a permissionless and trust-minimized [Quadratic Funding](https://wtfisqf.com/) protocol. It uses Minimal Anti-Collusion Infrastructure ([MACI](https://github.com/appliedzkp/maci)) to protect against various forms of bribery and collusion with the use of [zk-SNARKs](https://academy.binance.com/en/articles/zk-snarks-and-zk-starks-explained). To protect from [Sybil attacks](https://en.wikipedia.org/wiki/Sybil_attack) it can use [BrightID](https://brightID.org) or a similar identity system.

clr.fund runs a continuous sequence of Quadratic Funding rounds, where anyone is able to add public goods projects as funding "recipients", contribute funds to the matching pool ("matching funds"), and contribute funds to individual recipients. To ensure that only public goods are added as recipients clr.fund can use curation mechanism such as [Kleros Curate](https://curate.kleros.io/).

While clr.fund aims to be agnostic to the source of matching funds, it specifically aims to enable contributions from the following sources:

1. Ethereum protocol rewards (Block rewards, transaction taxes, etc)
2. Known and anonymous benefactors
3. Benevolent protocols (MakerDAO, Burn Signal, etc)

In order for their contributions to count towards matching, contributors must verify their uniqueness.

The clr.fund smart contracts consist of a factory contract that deploys a new contract for each round. All matching funds are sent to the factory contract, while contribution funds are sent to the current round's contract. There are four roles in factory contract:

1. **Owner:** This address (initially set to deployer) can set the address of coordinator, finalize a round by transferring matching funds to the current round contract, and set the token and round duration.
2. **Coordinator:** This address is responsible for running the zk-SNARK computation on contributions to produce the relative percentages of matching funds that each recipient should receive. The coordinator can quit at any time, which invalidates the current round forcing the owner to start a new round and users to submit new MACI messages for their contributions. Without some advancement in oblivious computation, this Coordinator is necessarily a trusted party in this system (this is discussed more in the Limitations section).
3. **Contributor:** Any address that contributes tokens to the funding round.
4. **Recipient:** Any address that is registered as funding recipient.

The clr.fund application can use any [EVM-compatible chain](https://ethereum.org/) as a backend. The application can be hosted on [IPFS](https://ipfs.io/) and can also run locally.

For more details, see the [sequence diagram](docs/clrfund.svg) and [clr.fund constitution](https://github.com/clrfund/constitution).

Some helpful blogposts to explain the clr.fund project:

- https://blog.clr.fund/clr-fund-explained-pt-1/
- https://blog.clr.fund/clr-fund-explained-pt-2/
- https://blog.clr.fund/clr-fund-explained-pt-3/

### Limitations

There are various limitations in our current design; we discuss some of them here.

#### Trusted Participants

The need for several trusted parties is the biggest limitation in the current design. The owner could, and likely will, be replaced with a DAO or some other decision-making mechanism which could alleviate the trust concern for this role.

However, without some breakthrough in oblivious computation, the zk-SNARK computations must necessarily be done by some trusted party who becomes a prime target for bribery as they are the only participant who can know the details of each contributor’s contributions.

Several solutions have been suggested, such as having the operator’s private keys and computations happen inside of some trusted computing environment or wallfacer-esque isolation of the operator. But most just kick the trust-can down the road a little further.

#### Single Token

For simplicity's sake in the contract, the zk-SNARK, and the user interface, clr.fund selects an ERC20 token as it's native token (set by the contract owner), which is the only token that the funding round contract interacts with. This is an issue given our goal of being agnostic to the funding source.

For example, block reward funding would be in ETH, while many users may want to contribute DAI or other ERC20 tokens.

In a future version, we plan to address this by routing ETH and token contributions in anything other than the current native token through a DEX such as [UniSwap](https://uniswap.org/).

## Documentation

- [Running clr.fund instance](docs/admin.md)
- [Providing matching funds](docs/funding-source.md)
- [How to tally votes](docs/coordinator.md)
- [How to verify results](docs/trusted-setup.md)
- [Running the subgraph](docs/subgraph.md)
- [Deployment](docs/deployment.md)

## Development

### Install Node v12 with nvm

```sh
nvm install 12
nvm use 12
```

If using the M1 chip in Apple products, you need to use Node v16.

```sh
nvm install 16
nvm use 16
```

### Install the dependencies

```sh
yarn

# Along with the dependencies, git hooks are also installed. At the end of the installation, you will see the following line after a successful setup.
husky - Git hooks installed
```

### Copy env for contracts

```sh
cp contracts/.env.example contracts/.env    # adjust if necessary
```

### Copy env for the webapp

```sh
cp vue-app/.env.example vue-app/.env    # adjust if necessary
```

## Start the frontend app in development mode (hot-code reloading, error reporting, etc.)

In one terminal, init the hardhat node

```sh
yarn start:node
```

In a 2nd terminal you will need to run your graph node (more on this
[here](docs/subgraph.md))

```sh
# go to the thegraph repo directory and init the node
cd graph-node/docker
docker-compose up
```

And finally, in a 3rd terminal

```sh
# this will complie and deploy the contracts + deploy the subgraph + build and run the vue app
yarn start:dev
```

## Other useful scripts

#### Compile the contracts

```sh
yarn build:contracts
```

#### Run unit tests

```sh
yarn test
```

#### Start the frontend sans a local blockchain

```sh
yarn start:web
```

#### Lint the files

```sh
yarn lint
```

## Git hooks

#### Pre-commit

Prettier is executed on the staged files to keep a consistent format style
across the codebase.

#### Pre-push

`yarn test:format` and `yarn test:web` is going to be triggered to ensure that
the code is in good shape.

As you can see, we are only checking the web (/vue-app) tests and not
the contracts ones. This is because there are not changes very often in the
/contracts folder. However, if you do make a change in /contracts don't forget
to run `yarn test` or `yarn test:contracts`.

### Tech stack resources

- `/contracts`
  - [Hardhat](https://hardhat.org/)
  - [Openzeppelin](https://openzeppelin.com/)
- `/vue-app`
  - [Vuex](https://vuex.vuejs.org/)
  - [Vue class component](https://class-component.vuejs.org/)
  - [Vuelidate](https://vuelidate-next.netlify.app/)
  - [Vue js modal](http://vue-js-modal.yev.io/)
  - [Ethers](https://docs.ethers.io/v5/)
  - [Gun](https://gun.eco/docs/)

### Visual Studio Code

As a recommendation, use the [Vetur](https://vuejs.github.io/vetur/) extension.
It gives you some useful features for Vue like syntax highlights, autocomplete,
etc.

Create a `vetur.config.js` file at the project root with the following content:

```ts
/** @type {import('vls').VeturConfig} */
module.exports = {
  settings: {
    'vetur.useWorkspaceDependencies': true,
  },
  projects: [
    {
      root: './vue-app',
      package: './package.json',
      tsconfig: './tsconfig.json',
      globalComponents: ['./src/components/**/*.vue'],
    },
  ],
}
```
