import { ethers } from 'hardhat'
import { utils, constants } from 'ethers'

async function main() {
  console.log('*******************')
  console.log('Start a new funding round!')
  console.log('*******************')
  const [deployer] = await ethers.getSigners()
  console.log('deployer.address: ', deployer.address)

  const fundingRoundFactoryAddress = process.env.FACTORY_ADDRESS
  const userRegistryType = process.env.USER_REGISTRY_TYPE
  const brightIdSponsor = process.env.BRIGHTID_SPONSOR
  const brightIdVerifier = process.env.BRIGHTID_VERIFIER_ADDR

  if (!fundingRoundFactoryAddress) {
    throw new Error('Environment variable FACTORY_ADDRESS is not setup')
  }

  if (!userRegistryType) {
    throw new Error('Environment variable USER_REGISTRY_TYPE is not setup')
  }

  if (userRegistryType === 'brightid') {
    if (!brightIdSponsor) {
      throw new Error('Environment variable BRIGHTID_SPONSOR is not setup')
    }
    if (!brightIdVerifier) {
      throw new Error(
        'Environment variable BRIGHTID_VERIFIER_ADDR is not setup'
      )
    }
  }

  const factory = await ethers.getContractAt(
    'FundingRoundFactory',
    fundingRoundFactoryAddress
  )
  console.log('funding round factory address ', factory.address)

  // check if the current round is finalized before starting a new round to avoid revert
  const currentRoundAddress = await factory.getCurrentRound()
  if (currentRoundAddress !== constants.AddressZero) {
    const currentRound = await ethers.getContractAt(
      'FundingRound',
      currentRoundAddress
    )
    const isFinalized = await currentRound.isFinalized()
    if (!isFinalized) {
      throw new Error(
        'Cannot start a new round as the current round is not finalized'
      )
    }
  }

  // deploy a new BrightId user registry for each new round
  // to force users to link with BrightId every round
  if (userRegistryType === 'brightid') {
    const BrightIdUserRegistry = await ethers.getContractFactory(
      'BrightIdUserRegistry',
      deployer
    )

    const userRegistry = await BrightIdUserRegistry.deploy(
      utils.formatBytes32String(process.env.BRIGHTID_CONTEXT || 'clr.fund'),
      brightIdVerifier,
      brightIdSponsor
    )
    console.log('BrightId user registry address: ', userRegistry.address)
    await userRegistry.deployTransaction.wait()

    const setUserRegistryTx = await factory.setUserRegistry(
      userRegistry.address
    )
    await setUserRegistryTx.wait()
    console.log('Set user registry in factory', setUserRegistryTx.hash)
  }

  const tx = await factory.deployNewRound()
  console.log('Deployed new round, tx hash: ', tx.hash)
  await tx.wait()
  console.log('New funding round address: ', await factory.getCurrentRound())

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
