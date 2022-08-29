import { ethers } from 'hardhat'

async function main() {
  console.log('*******************')
  console.log('Start a new funding round!')
  console.log('*******************')
  const [deployer] = await ethers.getSigners()
  console.log('deployer.address: ', deployer.address)

  const fundingRoundFactoryAddress = process.env.FUNDING_ROUND_FACTORY_ADDRESS
  const userRegistryType = process.env.USER_REGISTRY_TYPE

  if (!fundingRoundFactoryAddress) {
    throw new Error(
      'Environment variable FUNDING_ROUND_FACTORY_ADDRESS is not setup'
    )
  }
  if (!userRegistryType) {
    throw new Error('Environment variable USER_REGISTRY_TYPE is not setup')
  }

  const factory = await ethers.getContractAt(
    'FundingRoundFactory',
    fundingRoundFactoryAddress
  )
  console.log('funding round factory address ', factory.address)

  const tx = await factory.deployNewRound()
  console.log('deployNewRound tx hash: ', tx.hash)
  await tx.wait()

  const fundingRoundAddress = await factory.getCurrentRound()
  console.log('new funding round address: ', fundingRoundAddress)

  // for BrightId user registry, we need to activate the registry
  // by setting the registration period to match maci signup period
  if (userRegistryType === 'brightid') {
    // get maci signup period
    const fundingRound = await ethers.getContractAt(
      'FundingRound',
      fundingRoundAddress
    )
    const maciAddress = await fundingRound.maci()
    console.log('maci address: ', maciAddress)
    const maci = await ethers.getContractAt('MACI', maciAddress)
    const startTime = await maci.signUpTimestamp()
    const endTime = await maci.calcSignUpDeadline()

    // set user registration period
    const userRegistryAddress = await fundingRound.userRegistry()
    const userRegistry = await ethers.getContractAt(
      'BrightIdUserRegistry',
      userRegistryAddress
    )
    const periodTx = await userRegistry.setRegistrationPeriod(
      startTime,
      endTime
    )
    console.log('User registration period changed at', periodTx.hash)
    await periodTx.wait()
  }

  console.log('*******************')
  console.log('Script complete!')
  console.log('*******************')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
