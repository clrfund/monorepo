import { ethers } from 'hardhat'
import { Contract, utils } from 'ethers'

import { UNIT } from '../utils/constants'
import { deployMaciFactory } from '../utils/deployment'
import { RecipientRegistryFactory } from '../utils/recipient-registry-factory'

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
      process.env.BRIGHTID_VERIFIER_ADDR,
      process.env.BRIGHTID_SPONSOR
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
  const recipientRegistry = await RecipientRegistryFactory.deploy(
    recipientRegistryType,
    {
      controller: fundingRoundFactory.address,
      baseDeposit: UNIT.div(1000),
      challengePeriodDuration: 0,
    },
    deployer
  )
  console.log(
    `${recipientRegistryType} recipient registry deployed: ${recipientRegistry.address}`
  )

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
