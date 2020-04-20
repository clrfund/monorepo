# Cl(ea)r.fund
**All matching, all the time!**

Cl(ea)r.fund is an open and less-trustful Quadratic Funding application for Ethereum Public Goods. It uses [BrightID](https://brightID.org) for Sybil resistance and Minimal Anti-Collusion Infrastructure ([MASI](https://ethresear.ch/t/minimal-anti-collusion-infrastructure/5413)) to protect against various forms of bribery and collusion with the use of zk-Snarks.

Cl(ea)r.fund runs a continuous cycle of Quadratic Funding rounds, where anyone is able to add funding recipients, contribute matching funds, and contribute funds to a recipient; influencing their quadratic match.

While Cl(ea)r.fund aims to be agnostic to the source of matching funds, it specifically aims to enable contributions form the following sources:

1. Ethereum protocol rewards (Block rewards, transaction taxes, etc)
2. Known and anonymous benefactors
3. Benevolent protocols (MakerDAO, Burn Signal, etc)

In order for their contributions to count towards matching, contributors must verify their uniqueness using [BrightID](https://ethresear.ch/t/minimal-anti-collusion-infrastructure/5413). Contributions form unverified accounts do not count towards the quadratic matching for their project.

The Cl(ear)r.fund smart contracts consist of a factory contract, that deploys a new contract for each round. All matching funds are sent to the factory contract, while contribution funds are sent to the current round. There are three roles in factory contract:

1. **Owner:** This address (initially set as msg.sender) can set the address of all three roles, finalize a round by transferring matching funds to the previous round contract, and set the token and round duration.
2. **Witness:** This address is responsible for choosing a valid deployment of the [MACI](https://github.com/barryWhiteHat/maci) contract and setting it in the funding round factory. The witness can also quit at any time, which sets the witness address to `null` and requires the owner to set a new witness before starting paying out the previous funding round.
3. **Coordinator:** This address is responsible for running the zk-Snark computation on contributions to produce the relative percentages of matching funds that each recipient should receive. The coordinator can quit at any time, which invalidates the current round forcing the owner to start a new round and users to submit new messages for their contributions. Without some advancement in oblivious computation, this Coordinator is necessarily a trusted party in this system (this is discussed more in the Limitations section).

The Cl(ea)r.fund application uses [Vue.js](https://vuejs.org/) for the frontend and [Ethereum](https://ethereum.org/) and [TheGraph](https://thegraph.com) as a backend. Rich profile information for recipients is pulled from [3Box](https://3box.io). The application is currently hosted on GitHub pages, but can easily be hosted on [IPFS](https://www.ipfs.com/) or run locally.

### Limitations
There are various limitations in our current design, we discuss some of them here.

#### Trusted Participants
The need for several trusted parties is the biggest limitation in the current design. The owner and witness could potentially be replaced with a DAO(s), or some other decision making mechanism which could alleviate the trust concern for each of those roles.

However, without some breakthrough in oblivious computation, the zk-Snark computations must necessarily be done by some trusted party who becomes a prime target for bribery as they are the only participant who can know the details of each contributor’s contributions.

Several solutions have been suggested, such as having the operator’s private keys and computations happen inside of some trusted computing environment or wallfacer-esque isolation of the operator. But most just kick the trust-can down the road a little further.

#### Single Token
For simplicity's sake in the contract, the zk-Snark, and the user interface, Cl(ea)r.fund selects an ERC20 token as it's native token (set by the contract owner), which is the only token that the funding round contracts interact with. This is an issue because given our goal of being agnostic to the funding source.

For example, block reward funding would be in ETH, while many users may want to contribute DAI or other ERC20 tokens.

In a future version, we plan to address this by routing ETH and token contributions in anything other than the current native token through [UniSwap](https://uniswap.io/).

#### All matching, all the time
The current version of our Cl(ea)r.fund treats all incoming funds as matching funds, rather than having contributed funds allocated directly to the intended recipient. This is a result of a limitation in the current version of [MACI](https://ethresear.ch/t/minimal-anti-collusion-infrastructure/5413).

This issue will be resolved with some modification to the MACI circuits.

#### Limited to 16 recipients
The current version of Cl(ea)r.fund is only able to calculate matching on 16 recipients. A solution for this already exists, which allows N (at least 64) participants, however implementation was beyond the scope of the hackathon.

## Run Cl(ea)r.fund locally
### Install the dependencies
```
yarn
```

#### Compile and type safe the contracts
```
yarn compile
```

#### Run Waffle tests with stack traces
```
yarn test
```

#### Start the frontend app in development mode (hot-code reloading, error reporting, etc.)
```
yarn ganache
```
and in a new terminal
```
yarn dev
```

#### Start the frontend sans a local blockchain
```
yarn web
```

#### Lint the files
```
yarn lint
```

#### Build the dApp for production
```
yarn build
```

#### Customize the configuration
See [Configuring quasar.conf.js](https://quasar.dev/quasar-cli/quasar-conf-js).
