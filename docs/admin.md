# Running clr.fund instance on Rinkeby

This document describes deployment and administration of clr.fund contracts using [hardhat console](https://hardhat.org/guides/hardhat-console.html).

For example, to start console configured for Rinkeby network:

**Prepare wallet**

Update `contracts/.env`

```bash
# Connect using mnemonic
WALLET_MNEMONIC={{mnemonic-phrase}}

# or connect using single private key
WALLET_PRIVATE_KEY={{deployer-private-key}}
```

If using single private key, update `hardhat.config.ts`:

```ts
const WALLET_PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY || ''

// Change Rinkeby to: 
  accounts: [ `0x${WALLET_PRIVATE_KEY}` ],
```

Open hardhat console

```
cd contracts/
yarn hardhat console --network rinkeby
```

**Prepare .env file**
You will need to set up an RPC provider for the `RINKEBY_JSONRPC_HTTP_URL` variable. Can use infura, pocket, alchemy, etc.

## Deployment

### MACI factory

Deploy MACI factory:

```js
const [deployer] = await ethers.getSigners()
const { deployMaciFactory } = require('./utils/deployment')
const maciFactory = await deployMaciFactory(deployer, 'medium')
```

The `deployMaciFactory` function deploys MACI factory and other contracts required by it:
- Poseidon T3 library
- Poseidon T6 library
- State tree batch update verifier contract
- Quadratic vote tally verifier contract

Alternatively, one can deploy these contracts one by one:

```js
const { deployContract, deployMaciFactory } = require('./utils/deployment')
const poseidonT3 = await deployContract(deployer, ':PoseidonT3')
const poseidonT6 = await deployContract(deployer, ':PoseidonT6')
const batchUstVerifier = await deployContract(deployer, 'BatchUpdateStateTreeVerifierMedium')
const qvtVerifier = await deployContract(deployer, 'QuadVoteTallyVerifierMedium')
const maciFactory = await deployMaciFactory(deployer, 'medium', { poseidonT3, poseidonT6, batchUstVerifier, qvtVerifier })
```

### Funding round factory

Funding round factory is the main clr.fund contract. Its owner configures clr.fund and manages the deployment and finalization of funding rounds.

Deploy funding round factory:

```js
const FundingRoundFactory = await ethers.getContractFactory('FundingRoundFactory', deployer)
const factory = await FundingRoundFactory.deploy(maciFactory.address)
```

Transfer ownership of MACI factory:

```js
await maciFactory.transferOwnership(factory.address)
```

### User registry

clr.fund can work with any user registry that implements [IUserRegistry](../contracts/contracts/userRegistry/IUserRegistry.sol) interface.

For example, to deploy the simple user registry:

```js
const SimpleUserRegistry = await ethers.getContractFactory('SimpleUserRegistry', deployer)
const userRegistry = await SimpleUserRegistry.deploy()
```

or to deploy BrightID user registry:

```js
const BrightIdUserRegistry = await ethers.getContractFactory('BrightIdUserRegistry', deployer)
const userRegistry = await BrightIdUserRegistry.deploy('<context>', '<verifier-address>')
```

Configure funding round factory to use registry:

```js
await factory.setUserRegistry(userRegistry.address)
```

### Recipient registry

clr.fund can work with any recipient registry that implements [IRecipientRegistry](../contracts/contracts/recipientRegistry/IRecipientRegistry.sol) interface.

For example, to deploy Optimistic Recipient Registry

```js
const OptimisticRecipientRegistry = await ethers.getContractFactory('OptimisticRecipientRegistry', deployer)
const securityDeposit = ethers.BigNumber.from(10).pow(ethers.BigNumber.from(18)).div(10) // 0.1 ETH
const recipientRegistry = await OptimisticRecipientRegistry.deploy(securityDeposit, 300, deployer.address)
```

or to deploy Kleros GTCR adapter:

```js
const KlerosGTCRAdapter = await ethers.getContractFactory('KlerosGTCRAdapter', deployer)
const recipientRegistry = await KlerosGTCRAdapter.deploy('<kleros-gtcr-address>', factory.address)
```

## Configuration

Configure funding round factory to use registry:

```js
await factory.setRecipientRegistry(recipientRegistry.address)
```

Set native token:

```js
const rinkebyDaiAddress = '0x5592ec0cfb4dbc12d3ab100b257153436a1f0fea'
await factory.setToken(rinkebyDaiAddress)
```

If a [coordinator](./coordinator.md) key has not yet been created. Make sure you save your keys in a file as they will not be displayed again, and you're private key is needed to generate the proofs at the end, and tally the votes:

```js
// Generate coordinator key
const { Keypair } = require('maci-domainobjs')
const keypair = new Keypair()
const coordinatorPubKey = keypair.pubKey
const serializedCoordinatorPrivKey = keypair.privKey.serialize()
const serializedCoordinatorPubKey = keypair.pubKey.serialize()
// Save the below keys elsewhere
console.log('Private key:', serializedCoordinatorPrivKey)
console.log('Public key: ', serializedCoordinatorPubKey)
// Set coordinator:
await factory.setCoordinator(deployer.address, coordinatorPubKey.asContractParam())
```

If using an existing coordinator key:

```js
const serializedCoordinatorPubKey = '<coordinator-pub-key>'
const { PubKey } = require('maci-domainobjs')
const coordinatorPubKey = PubKey.unserialize(serializedCoordinatorPubKey)
await factory.setCoordinator(deployer.address, coordinatorPubKey.asContractParam())
```

> Note, when calling `.setCoordinator()` a different address can be used for the coordinator. "Deployer" used here.

Set [MACI parameters](../contracts/utils/maci.ts):

```js
let { MaciParameters } = require('./utils/maci')
let maciFactory = await ethers.getContractAt('MACIFactory', maciFactory.address)
let maciParameters = await MaciParameters.read(maciFactory)
maciParameters.update({ signUpDuration: 86400 * 14, votingDuration: 86400 * 3 })
await factory.setMaciParameters(...maciParameters.values())
```

Add [funding source](./funding-source.md) (if needed):

```js
await factory.addFundingSource(deployer.address)
```

> Note, a different address can be used for the funding source. "Deployer" used here.

Or remove funding source:

```js
await factory.removeFundingSource('<address>')
```

## Running the funding round

Administrator of clr.fund instance should set parameters before starting the funding round. Once the round has started, it is mostly autonomous and its parameters can not be changed. It can only be finalized (allowing recipients to claim allocated funding) or cancelled (allowing contributors can withdraw their funds).

Start new funding round:

```js
await factory.deployNewRound()
```

Info to keep track of:
```
deployer.address
maciFactory.address
factory.address
recipientRegistry.address
userRegistry.address
serializedCoordinatorPrivKey
serializedCoordinatorPubKey
coordinatorPubKey.serialize()
```

Finalize current round and transfer matching funds to the pool:

```js
await factory.transferMatchingFunds('<total-spent>', '<total-spent-salt>')
```

The arguments for `transferMatchingFunds` method should be taken from `tally.json` file published by the [coordinator](./coordinator.md):

- `total-spent` value can be found by key `totalVoiceCredits.spent`.
- `total-spent-salt` value can be found by key `totalVoiceCredits.salt`.

Cancel current round:

```js
await factory.cancelCurrentRound()
```

## User interface

User interface can be configured using environment variables. See [.env file example](../vue-app/.env.example) for details.

> If following along with Rinkeby, make sure to update `VUE_APP_CLRFUND_FACTORY_ADDRESS` with your Rinkeby funding factory address, and update `VUE_APP_ETHEREUM_API_URL` with a Rinkeby provider (ie. Infura or Alchemy). Double check you are using the same user and recipient registry types as used during deployment above.

Build the dApp for production:

```
yarn build
```

Add static files to IPFS:

```
ipfs add -r vue-app/dist/
```

```
yarn start:web
```

## deployRound Script
There is a new deployRound script that has been created that automates the above process (minus taking the new factory address and injecting it into the UI). To run this, first change directories to the contracts folder, run the following:

```
npx hardhat run --network {network-name} scripts/deployRound.ts
```