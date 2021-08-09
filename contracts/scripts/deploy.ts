import { ethers } from 'hardhat'
import { Contract, utils } from 'ethers'

import { UNIT } from '../utils/constants'
import { deployMaciFactory } from '../utils/deployment'

async function main() {
  const [deployer] = await ethers.getSigners()
  console.log(`Deploying from address: ${deployer.address}`)

  const maciFactory = await deployMaciFactory(deployer)
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
      process.env.BRIGHTID_VERIFIER_ADDR ||
        '0xb1d71F62bEe34E9Fc349234C201090c33BCdF6DB'
    )
  } else {
    throw new Error('unsupported user registry type')
  }
  await userRegistry.deployTransaction.wait()
  console.log(`User registry deployed: ${userRegistry.address}`)

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
      0,
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
  console.log(`Deployment complete!`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
