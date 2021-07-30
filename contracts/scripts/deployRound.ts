import { ethers } from 'hardhat'
import { Contract } from 'ethers'
import { Keypair } from 'maci-domainobjs'

import { deployMaciFactory } from '../utils/deployment'
import { MaciParameters } from '../utils/maci'

async function main() {
  const [deployer] = await ethers.getSigners()
  let maciFactory = await deployMaciFactory(deployer)
  await maciFactory.deployTransaction.wait()

  const FundingRoundFactory = await ethers.getContractFactory(
    'FundingRoundFactory',
    deployer
  )
  const fundingRoundFactory = await FundingRoundFactory.deploy(
    maciFactory.address
  )
  await fundingRoundFactory.deployTransaction.wait()

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
    await userRegistry.deployTransaction.wait()
  } else if (userRegistryType === 'brightid') {
    const BrightIdUserRegistry = await ethers.getContractFactory(
      'BrightIdUserRegistry',
      deployer
    )
    // TODO sort out if these arguments are sensible
    userRegistry = await BrightIdUserRegistry.deploy(
      '0x636c722e66756e64000000000000000000000000000000000000000000000000', // Do we have a test `context`?
      fundingRoundFactory.address // Not sure if `verifier` should be EOA or contract account
    )
    await userRegistry.deployTransaction.wait()
  } else {
    throw new Error('unsupported user registry type')
  }
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
    await recipientRegistry.deployTransaction.wait()
  } else if (recipientRegistryType === 'optimistic') {
    const OptimisticRecipientRegistry = await ethers.getContractFactory(
      'OptimisticRecipientRegistry',
      deployer
    )
    recipientRegistry = await OptimisticRecipientRegistry.deploy(
      ethers.BigNumber.from(10).pow(ethers.BigNumber.from(18)).div(10),
      300,
      fundingRoundFactory.address
    )
    await recipientRegistry.deployTransaction.wait()
  } else {
    throw new Error('unsupported recipient registry type')
  }

  const setRecipientRegistryTx = await fundingRoundFactory.setRecipientRegistry(
    recipientRegistry.address
  )
  await setRecipientRegistryTx.wait()

  const setTokenTx = await fundingRoundFactory.setToken(
    process.env.TOKEN_ADDRESS
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

  console.log('deployer.address')
  console.log(deployer.address)
  console.log('maciFactory.address')
  console.log(maciFactory.address)
  console.log('fundingRoundFactory.address')
  console.log(fundingRoundFactory.address)
  console.log('recipientRegistry.address')
  console.log(recipientRegistry.address)
  console.log('userRegistry.address')
  console.log(userRegistry.address)
  console.log('serializedCoordinatorPrivKey')
  console.log(serializedCoordinatorPrivKey)
  console.log('serializedCoordinatorPubKey')
  console.log(serializedCoordinatorPubKey)
  console.log('coordinatorPubKey.serialize()')
  console.log(coordinatorPubKey.serialize())
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
