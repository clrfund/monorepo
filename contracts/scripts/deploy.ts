import { ethers } from 'hardhat'
import { Contract } from 'ethers'

import { UNIT } from '../utils/constants'
import { deployMaciFactory } from '../utils/deployment'

async function main() {
  const [deployer] = await ethers.getSigners()
  const maciFactory = await deployMaciFactory(deployer)

  const FundingRoundFactory = await ethers.getContractFactory(
    'FundingRoundFactory',
    deployer
  )
  const fundingRoundFactory = await FundingRoundFactory.deploy(
    maciFactory.address
  )
  await fundingRoundFactory.deployed()
  await maciFactory.transferOwnership(fundingRoundFactory.address)

  // TODO deploy registry conditionally based on process.env.USER_REGISTRY_TYPE (new ENV var)
  const SimpleUserRegistry = await ethers.getContractFactory(
    'SimpleUserRegistry',
    deployer
  )
  const userRegistry = await SimpleUserRegistry.deploy()
  await fundingRoundFactory.setUserRegistry(userRegistry.address)

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
  await fundingRoundFactory.setRecipientRegistry(recipientRegistry.address)

  console.log(`Factory deployed: ${fundingRoundFactory.address}`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
