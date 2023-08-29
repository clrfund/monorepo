import { ethers } from 'hardhat'
import { Contract, Wallet } from 'ethers'

import { UNIT } from '../utils/constants'
import {
  deployMaciFactory,
  deployUserRegistry,
  getBrightIdParams,
} from '../utils/deployment'
import { Keypair, PrivKey } from '@clrfund/maci-utils'

// Number.MAX_SAFE_INTEGER - 1
const challengePeriodSeconds = 9007199254740990

/**
 * Set the coordinator address and maci public key in the funding round factory
 *
 * @param fundingRoundFactory funding round factory contract
 * @param coordinatorAddress
 * @param MaciPrivateKey
 */
async function setCoordinator(
  fundingRoundFactory: Contract,
  coordinatorAddress: string,
  coordinatorKey?: string
) {
  // Generate or use the passed in coordinator key
  const privKey = coordinatorKey
    ? PrivKey.unserialize(coordinatorKey)
    : undefined
  const keypair = new Keypair(privKey)
  const coordinatorPubKey = keypair.pubKey
  const serializedCoordinatorPrivKey = keypair.privKey.serialize()
  const serializedCoordinatorPubKey = keypair.pubKey.serialize()
  const setCoordinatorTx = await fundingRoundFactory.setCoordinator(
    coordinatorAddress,
    coordinatorPubKey.asContractParam()
  )
  await setCoordinatorTx.wait()
  console.log('coordinator address:', coordinatorAddress)
  console.log('serializedCoordinatorPrivKey: ', serializedCoordinatorPrivKey)
  console.log('serializedCoordinatorPubKey: ', serializedCoordinatorPubKey)
}

async function main() {
  const [deployer] = await ethers.getSigners()
  console.log(`Deploying from address: ${deployer.address}`)

  const circuit = 'prod'
  const maciFactory = await deployMaciFactory(deployer, circuit)
  await maciFactory.deployTransaction.wait()
  console.log(`MACIFactory deployed: ${maciFactory.address}`)

  const FundingRoundFactory = await ethers.getContractFactory(
    'FundingRoundFactory',
    deployer
  )
  const fundingRoundFactory = await FundingRoundFactory.deploy(
    maciFactory.address
  )
  await fundingRoundFactory.deployTransaction.wait()
  console.log(`FundingRoundFactory deployed: ${fundingRoundFactory.address}`)

  const transferOwnershipTx = await maciFactory.transferOwnership(
    fundingRoundFactory.address
  )
  await transferOwnershipTx.wait()

  const userRegistryType = process.env.USER_REGISTRY_TYPE || 'simple'
  const brightidParams = getBrightIdParams(userRegistryType)
  const userRegistry: Contract = await deployUserRegistry(
    userRegistryType,
    deployer,
    brightidParams
  )
  console.log(
    `User registry (${userRegistryType}) deployed: ${userRegistry.address}`
  )

  const setUserRegistryTx = await fundingRoundFactory.setUserRegistry(
    userRegistry.address
  )
  await setUserRegistryTx.wait()

  const recipientRegistryType = process.env.RECIPIENT_REGISTRY_TYPE || 'simple'
  let recipientRegistry: Contract
  if (recipientRegistryType === 'simple') {
    const SimpleRecipientRegistry = await ethers.getContractFactory(
      'SimpleRecipientRegistry',
      deployer
    )
    recipientRegistry = await SimpleRecipientRegistry.deploy(
      fundingRoundFactory.address
    )
  } else if (recipientRegistryType === 'optimistic') {
    const OptimisticRecipientRegistry = await ethers.getContractFactory(
      'OptimisticRecipientRegistry',
      deployer
    )
    recipientRegistry = await OptimisticRecipientRegistry.deploy(
      UNIT.div(1000),
      challengePeriodSeconds,
      fundingRoundFactory.address
    )
  } else {
    throw new Error('unsupported recipient registry type')
  }
  await recipientRegistry.deployTransaction.wait()
  console.log(`Recipient registry deployed: ${recipientRegistry.address}`)

  const setRecipientRegistryTx = await fundingRoundFactory.setRecipientRegistry(
    recipientRegistry.address
  )
  await setRecipientRegistryTx.wait()

  if (process.env.NATIVE_TOKEN_ADDRESS) {
    const setTokenTx = await fundingRoundFactory.setToken(
      process.env.NATIVE_TOKEN_ADDRESS
    )
    await setTokenTx.wait()
    console.log('Set token', process.env.NATIVE_TOKEN_ADDRESS)
  }

  const coordinatorAddress = process.env.COORDINATOR_ETH_PK
    ? new Wallet(process.env.COORDINATOR_ETH_PK).address
    : await deployer.getAddress()

  await setCoordinator(
    fundingRoundFactory,
    coordinatorAddress,
    process.env.COORDINATOR_PK
  )

  console.log(`Deployment complete!`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
