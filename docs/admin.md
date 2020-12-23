# Running clr.fund instance

This document describes deployment and administration of clr.fund contracts using [hardhat console](https://hardhat.org/guides/hardhat-console.html).

For example, to start console configured for xDai network:

```
cd contracts/
yarn hardhat console --network xdai
```

## Deployment

### MACI factory

Deploy MACI factory:

```
const [deployer] = await ethers.getSigners()
const { deployMaciFactory } = require('./utils/deployment')
const maciFactory = await deployMaciFactory(deployer, circuit = 'small')
```

The `deployMaciFactory` function deploys MACI factory and other contracts required by it:
- Poseidon T3 library
- Poseidon T6 library
- State tree batch update verifier contract
- Quadratic vote tally verifier contract

### Funding round factory

Funding round factory is the main clr.fund contract. Its owner configures clr.fund and manages the deployment and finalization of funding rounds.

Deploy funding round factory:

```
const FundingRoundFactory = await ethers.getContractFactory('FundingRoundFactory', deployer)
const factory = await FundingRoundFactory.deploy(maciFactory.address)
```

Transfer ownership of MACI factory:

```
await maciFactory.transferOwnership(factory.address)
```

### User registry

clr.fund can work with any user registry that implements [IUserRegistry](../contracts/contracts/userRegistry/IUserRegistry.sol) interface.

For example, to deploy BrightID user registry:

```
const BrightIdUserRegistry = await ethers.getContractFactory('BrightIdUserRegistry', deployer)
const userRegistry = await BrightIdUserRegistry.deploy('<context>', '<verifier-address>')
```

Configure funding round factory to use registry:

```
await factory.setUserRegistry(userRegistry.address)
```

### Recipient registry

clr.fund can work with any recipient registry that implements [IRecipientRegistry](../contracts/contracts/recipientRegistry/IRecipientRegistry.sol) interface.

For example, to deploy Kleros GTCR adapter:

```
const KlerosGTCRAdapter = await ethers.getContractFactory('KlerosGTCRAdapter', deployer)
const recipientRegistry = await KlerosGTCRAdapter.deploy('<kleros-gtcr-address>', factory.address)
```

Configure funding round factory to use registry:

```
await factory.setRecipientRegistry(recipientRegistry.address)
```

## Configuration

Set native token:

```
await factory.setToken('<token-address>')
```

Set coordinator:

```
const serializedCoordinatorPubKey = '<coordinator-pub-key>'
const { PubKey } = require('maci-domainobjs')
const coordinatorPubKey = PubKey.unserialize(serializedCoordinatorPubKey)
await factory.setCoordinator('<coordinator-address>', coordinatorPubKey.asContractParam())
```

Set [MACI parameters](../contracts/utils/maci.ts):

```
let { MaciParameters } = require('./utils/maci')
let maciFactory = await ethers.getContractAt('MACIFactory', maciFactory.address)
let maciParameters = await MaciParameters.read(maciFactory)
maciParameters.update({ signUpDuration: 86400 * 14, votingDuration: 86400 * 3 })
await factory.setMaciParameters(...maciParameters.values())
```

Add [funding source](./funding-source.md):

```
await factory.addFundingSource('<address>')
```

Remove funding source:

```
await factory.removeFundingSource('<address>')
```

## Running the funding round

Administrator of clr.fund instance should set parameters before starting the funding round. Once the round has started, it is mostly autonomous and its parameters can not be changed. It can only be finalized (allowing recipients to claim allocated funding) or cancelled (allowing contributors can withdraw their funds).

Start new funding round:

```
await factory.deployNewRound()
```

Finalize current round and transfer matching funds to the pool:

```
await factory.transferMatchingFunds('<total-spent>', '<total-spent-salt>')
```

The arguments for `transferMatchingFunds` method should be taken from `tally.json` file published by the [coordinator](./coordinator.md):

- `total-spent` value can be found by key `totalVoiceCredits.spent`.
- `total-spent-salt` value can be found by key `totalVoiceCredits.salt`.

Cancel current round:

```
await factory.cancelCurrentRound()
```

## User interface

User interface can be configured using environment variables. See [.env file example](../vue-app/.env.example) for details.

Build the dApp for production:

```
yarn build
```

Add static files to IPFS:

```
ipfs add -r vue-app/dist/
```
