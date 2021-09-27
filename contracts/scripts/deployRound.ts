import { ethers } from 'hardhat'
import { Contract, utils } from 'ethers'
import { Keypair } from 'maci-domainobjs'

import { deployMaciFactory } from '../utils/deployment'
import { getEventArg } from '../utils/contracts'
import { MaciParameters } from '../utils/maci'

async function main() {
  console.log('*******************')
  console.log('Deploying a new clr.fund instance of contracts!')
  console.log('*******************')
  const [deployer] = await ethers.getSigners()
  console.log('deployer.address: ', deployer.address)

  let maciFactory = await deployMaciFactory(deployer)
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
      ethers.BigNumber.from(10).pow(ethers.BigNumber.from(18)).div(10),
      300,
      fundingRoundFactory.address
    )
  } else {
    throw new Error('unsupported recipient registry type')
  }
  await recipientRegistry.deployTransaction.wait()
  console.log('recipientRegistry.address: ', recipientRegistry.address)

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

  const metadataRecipient1 = {
    name: 'Commons Simulator',
    description:
      'Funding open-source projects & other public goods is the killer app of blockchain tech. Giveth & BlockScience are joining forces to build the Commons Stack: a modular library of well engineered components that can be used to create economic models for projects that are creating value, yet have trouble finding sustainable business models.',
    imageHash: 'QmbMP2fMiy6ek5uQZaxG3bzT9gSqMWxpdCUcQg1iSeEFMU',
    tagline: 'Modeling Sustainable Funding for Public Good',
    category: 'Data',
    problemSpace: 'metadata.problemSpace',
    plans: 'metadata.plans',
    teamName: 'metadata.teamName',
    teamDescription: 'metadata.teamDescription',
    githubUrl: 'https://github.com/',
    radicleUrl: 'https://radicle.com/',
    websiteUrl: 'https://website.com/',
    twitterUrl: 'https://twitter.com/',
    discordUrl: 'https://discord.com/',
    bannerImageHash: 'QmaDy75RkRVtZcbYeqMDLcCK8dDvahfik68zP7FbpxvD2F',
    thumbnailImageHash: 'QmaDy75RkRVtZcbYeqMDLcCK8dDvahfik68zP7FbpxvD2F',
  }

  const metadataRecipient2 = {
    name: 'Synthereum',
    description:
      'The aim of our synthetic assets is to help creating fiat-based wallet and applications on any local currencies, and help to create stock, commodities portfolio in order to bring more traditional users within the DeFi ecosystem.',
    imageHash: 'QmbMP2fMiy6ek5uQZaxG3bzT9gSqMWxpdCUcQg1iSeEFMU',
    tagline:
      'Synthetic assets with liquidity pools to bridge traditional and digital finance.',
    category: 'Content',
    problemSpace: 'metadata.problemSpace',
    plans: 'metadata.plans',
    teamName: 'metadata.teamName',
    teamDescription: 'metadata.teamDescription',
    githubUrl: 'https://github.com/',
    radicleUrl: 'https://radicle.com/',
    websiteUrl: 'https://website.com/',
    twitterUrl: 'https://twitter.com/',
    discordUrl: 'https://discord.com/',
    bannerImageHash: 'QmaDy75RkRVtZcbYeqMDLcCK8dDvahfik68zP7FbpxvD2F',
    thumbnailImageHash: 'QmaDy75RkRVtZcbYeqMDLcCK8dDvahfik68zP7FbpxvD2F',
  }

  const addFundingSourceTx = await fundingRoundFactory.addFundingSource(
    deployer.address
  )
  await addFundingSourceTx.wait()

  const deployNewRoundTx = await fundingRoundFactory.deployNewRound()
  await deployNewRoundTx.wait()

  if (recipientRegistryType === 'simple') {
    const recipients = [
      { account: deployer.address, metadata: metadataRecipient1 },
      { account: deployer.address, metadata: metadataRecipient2 },
    ]
    let addRecipientTx
    for (const recipient of recipients) {
      addRecipientTx = await recipientRegistry.addRecipient(
        deployer.address,
        JSON.stringify(recipient.metadata)
      )
      addRecipientTx.wait()
    }
  } else if (recipientRegistryType === 'optimistic') {
    const deposit = await recipientRegistry.baseDeposit()
    const recipient1Added = await recipientRegistry.addRecipient(
      deployer.address,
      JSON.stringify(metadataRecipient1),
      { value: deposit }
    )
    await recipient1Added.wait()

    const recipient1Id = await getEventArg(
      recipient1Added,
      recipientRegistry,
      'RequestSubmitted',
      '_recipientId'
    )
    const executeRequest1 = await recipientRegistry.executeRequest(recipient1Id)
    await executeRequest1.wait()

    const recipient2Added = await recipientRegistry.addRecipient(
      deployer.address,
      JSON.stringify(metadataRecipient2),
      { value: deposit }
    )
    await recipient2Added.wait()

    const recipient2Id = await getEventArg(
      recipient2Added,
      recipientRegistry,
      'RequestSubmitted',
      '_recipientId'
    )
    const executeRequest2 = await recipientRegistry.executeRequest(recipient2Id)
    await executeRequest2.wait()

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
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
