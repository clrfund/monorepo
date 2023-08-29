import { ethers } from 'hardhat'
import { deployUserRegistry, getBrightIdParams } from '../utils/deployment'

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
  const brightidParams = getBrightIdParams(userRegistryType)
  const userRegistry = await deployUserRegistry(
    userRegistryType,
    deployer,
    brightidParams
  )
  console.log(
    `deployed ${userRegistryType} user registry at ${userRegistry.address}`
  )

  const setUserRegistryTx = await fundingRoundFactory.setUserRegistry(
    userRegistry.address
  )
  await setUserRegistryTx.wait()
  console.log(
    'set user registry in funding round factory at tx hash',
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
