import { ethers } from 'hardhat'
import { Contract, utils } from 'ethers'

async function main() {
  console.log('*******************')
  console.log('Deploying a user registry!')
  console.log('*******************')
  const [deployer] = await ethers.getSigners()
  console.log('deployer.address: ', deployer.address)

  const fundingRoundFactoryAddress = process.env.FACTORY_ADDRESS

  if (!fundingRoundFactoryAddress) {
    throw new Error('Environment variable FACTORY_ADDRESS is not setup')
  }
  const fundingRoundFactory = await ethers.getContractAt(
    'FundingRoundFactory',
    fundingRoundFactoryAddress
  )
  console.log('funding round factory address ', fundingRoundFactory.address)

  const userRegistryType = process.env.USER_REGISTRY_TYPE || 'simple'
  let userRegistry: Contract
  if (userRegistryType === 'simple') {
    const SimpleUserRegistry = await ethers.getContractFactory(
      'SimpleUserRegistry',
      deployer
    )
    userRegistry = await SimpleUserRegistry.deploy()
  } else if (userRegistryType === 'brightid') {
    console.log('deploying brightid user registry')
    const BrightIdUserRegistry = await ethers.getContractFactory(
      'BrightIdUserRegistry',
      deployer
    )

    userRegistry = await BrightIdUserRegistry.deploy(
      utils.formatBytes32String(process.env.BRIGHTID_CONTEXT || 'clr.fund'),
      process.env.BRIGHTID_VERIFIER_ADDR,
      process.env.BRIGHTID_SPONSOR
    )
    console.log('transaction hash', userRegistry.deployTransaction.hash)
  } else if (userRegistryType === 'snapshot') {
    const SnapshotUserRegistry = await ethers.getContractFactory(
      'SnapshotUserRegistry',
      deployer
    )
    userRegistry = await SnapshotUserRegistry.deploy()
  } else {
    throw new Error('unsupported user registry type')
  }
  await userRegistry.deployTransaction.wait()
  console.log(
    `Deployed ${userRegistryType} user registry at ${userRegistry.address}`
  )

  const setUserRegistryTx = await fundingRoundFactory.setUserRegistry(
    userRegistry.address
  )
  await setUserRegistryTx.wait()
  console.log(
    'set user registry in funding round factory',
    setUserRegistryTx.hash
  )

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
