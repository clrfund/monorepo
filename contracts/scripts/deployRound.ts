import { ethers } from 'hardhat'
import { Contract, utils } from 'ethers'
import { Keypair } from 'maci-domainobjs'

import { deployMaciFactory } from '../utils/deployment'
import { MaciParameters } from '../utils/maci'
import { RecipientRegistryFactory } from '../utils/recipient-registry-factory'
import { RecipientRegistryLoader } from '../utils/recipient-registry-loader'

async function main() {
  console.log('*******************')
  console.log('Deploying a new clr.fund instance of contracts!')
  console.log('*******************')
  const [deployer] = await ethers.getSigners()
  console.log('deployer.address: ', deployer.address)

  const circuit = 'prod'
  let maciFactory = await deployMaciFactory(deployer, circuit)
  await maciFactory.deployTransaction.wait()
  console.log('maciFactory.address: ', maciFactory.address)

  const FundingRoundFactory = await ethers.getContractFactory(
    'FundingRoundFactory',
    deployer
  )
  const fundingRoundFactory = await FundingRoundFactory.deploy(
    maciFactory.address
  )
  await fundingRoundFactory.deployTransaction.wait()
  console.log('fundingRoundFactory.address: ', fundingRoundFactory.address)

  const transferOwnershipTx = await maciFactory.transferOwnership(
    fundingRoundFactory.address
  )
  await transferOwnershipTx.wait()

  const userRegistryType = process.env.USER_REGISTRY_TYPE || 'simple'
  let userRegistry: Contract
  if (userRegistryType === 'simple') {
    const SimpleUserRegistry = await ethers.getContractFactory(
      'SimpleUserRegistry',
      deployer
    )
    userRegistry = await SimpleUserRegistry.deploy()
  } else if (userRegistryType === 'brightid') {
    const BrightIdUserRegistry = await ethers.getContractFactory(
      'BrightIdUserRegistry',
      deployer
    )
    userRegistry = await BrightIdUserRegistry.deploy(
      utils.formatBytes32String(process.env.BRIGHTID_CONTEXT || 'clr.fund'),
      process.env.BRIGHTID_VERIFIER_ADDR
    )
  } else {
    throw new Error('unsupported user registry type')
  }
  await userRegistry.deployTransaction.wait()
  console.log('userRegistry.address: ', userRegistry.address)

  const setUserRegistryTx = await fundingRoundFactory.setUserRegistry(
    userRegistry.address
  )
  await setUserRegistryTx.wait()

  const recipientRegistryType = process.env.RECIPIENT_REGISTRY_TYPE || 'simple'
  const recipientRegistry = await RecipientRegistryFactory.deploy(
    recipientRegistryType,
    {
      controller: fundingRoundFactory.address,
      baseDeposit: ethers.BigNumber.from(10)
        .pow(ethers.BigNumber.from(18))
        .div(10),
      challengePeriodDuration: 300,
    },
    deployer
  )
  console.log(
    `${recipientRegistryType} recipientRegistry address: ${recipientRegistry.address}`
  )

  const setRecipientRegistryTx = await fundingRoundFactory.setRecipientRegistry(
    recipientRegistry.address
  )
  await setRecipientRegistryTx.wait()

  const setTokenTx = await fundingRoundFactory.setToken(
    process.env.NATIVE_TOKEN_ADDRESS
  )
  await setTokenTx.wait()

  // Generate coordinator key
  const keypair = new Keypair()
  const coordinatorPubKey = keypair.pubKey
  const serializedCoordinatorPrivKey = keypair.privKey.serialize()
  const serializedCoordinatorPubKey = keypair.pubKey.serialize()
  const setCoordinatorTx = await fundingRoundFactory.setCoordinator(
    deployer.address,
    coordinatorPubKey.asContractParam()
  )
  await setCoordinatorTx.wait()
  console.log('serializedCoordinatorPrivKey: ', serializedCoordinatorPrivKey)
  console.log('serializedCoordinatorPubKey: ', serializedCoordinatorPubKey)

  maciFactory = await ethers.getContractAt('MACIFactory', maciFactory.address)
  const maciParameters = await MaciParameters.read(maciFactory)
  maciParameters.update({
    signUpDuration: 86400 * 14,
    votingDuration: 86400 * 3,
  })
  const setMaciParametersTx = await fundingRoundFactory.setMaciParameters(
    ...maciParameters.values()
  )
  await setMaciParametersTx.wait()

  const addFundingSourceTx = await fundingRoundFactory.addFundingSource(
    deployer.address
  )
  await addFundingSourceTx.wait()

  const deployNewRoundTx = await fundingRoundFactory.deployNewRound()
  await deployNewRoundTx.wait()

  const recipients = RecipientRegistryLoader.buildStubRecipients([
    deployer.address,
    deployer.address,
  ])

  // add recipients to registry
  await RecipientRegistryLoader.load(
    recipientRegistryType,
    recipientRegistry,
    recipients
  )

  const fundingRoundAddress = await fundingRoundFactory.getCurrentRound()
  console.log('fundingRound.address: ', fundingRoundAddress)

  const fundingRound = await ethers.getContractAt(
    'FundingRound',
    fundingRoundAddress
  )
  const maciAddress = await fundingRound.maci()
  console.log('maci.address: ', maciAddress)

  console.log('*******************')
  console.log('Deploy complete!')
  console.log('*******************')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
