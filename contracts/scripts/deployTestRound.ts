import fs from 'fs'
import { ethers } from 'hardhat'
import { Keypair } from 'maci-domainobjs'

import { UNIT } from '../utils/constants'
import { getEventArg } from '../utils/contracts'
import { MaciParameters } from '../utils/maci'

async function main() {
  // We're hardcoding factory address due to a buidler limitation:
  // https://github.com/nomiclabs/buidler/issues/651
  const factoryAddress = '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707'
  const [
    deployer,
    coordinator,
    poolContributor,
    recipient1,
    recipient2,
    recipient3,
    recipient4,
    recipient5,
    recipient6,
    recipient7,
    recipient8,
    recipient9,
    contributor1,
    contributor2,
  ] = await ethers.getSigners()

  // Deploy ERC20 token contract
  const Token = await ethers.getContractFactory('AnyOldERC20Token', deployer)
  const tokenInitialSupply = UNIT.mul(1000)
  const token = await Token.deploy(tokenInitialSupply)
  console.log(`Token deployed: ${token.address}`)
  await token.transfer(poolContributor.getAddress(), UNIT.mul(100))
  await token.transfer(contributor1.getAddress(), UNIT.mul(100))
  await token.transfer(contributor2.getAddress(), UNIT.mul(100))

  // Configure factory
  const factory = await ethers.getContractAt(
    'FundingRoundFactory',
    factoryAddress
  )
  await factory.setToken(token.address)
  const coordinatorKeyPair = new Keypair()
  await factory.setCoordinator(
    coordinator.getAddress(),
    coordinatorKeyPair.pubKey.asContractParam()
  )

  // Configure MACI factory
  const maciFactoryAddress = await factory.maciFactory()
  const maciFactory = await ethers.getContractAt(
    'MACIFactory',
    maciFactoryAddress
  )
  const maciParameters = await MaciParameters.read(maciFactory)
  maciParameters.update({
    signUpDuration: 60 * 5, // 5 minutes
    votingDuration: 60 * 5,
  })
  await factory.setMaciParameters(...maciParameters.values())

  // Add to matching pool
  const poolContributionAmount = UNIT.mul(10)
  const poolContributorToken = token.connect(poolContributor)
  await poolContributorToken.transfer(factory.address, poolContributionAmount)

  // Add contributors
  const userRegistryType = process.env.RECIPIENT_REGISTRY_TYPE || 'simple'
  if (userRegistryType === 'simple') {
    const userRegistryAddress = await factory.userRegistry()
    const userRegistry = await ethers.getContractAt(
      'SimpleUserRegistry',
      userRegistryAddress
    )
    await userRegistry.addUser(contributor1.getAddress())
    await userRegistry.addUser(contributor2.getAddress())
  }

  // Add dummy recipients
  // TODO add better dummy data
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

  const metadataRecipient3 = {
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
  const metadataRecipient4 = {
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
  const metadataRecipient5 = {
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
  const metadataRecipient6 = {
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
  const metadataRecipient7 = {
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
  const metadataRecipient8 = {
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
  const metadataRecipient9 = {
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

  const recipientRegistryType = process.env.RECIPIENT_REGISTRY_TYPE || 'simple'
  const recipientRegistryAddress = await factory.recipientRegistry()
  if (recipientRegistryType === 'simple') {
    const recipientRegistry = await ethers.getContractAt(
      'SimpleRecipientRegistry',
      recipientRegistryAddress
    )
    await recipientRegistry.addRecipient(
      recipient1.getAddress(),
      JSON.stringify(metadataRecipient1)
    )
    await recipientRegistry.addRecipient(
      recipient2.getAddress(),
      JSON.stringify(metadataRecipient2)
    )
    await recipientRegistry.addRecipient(
      recipient3.getAddress(),
      JSON.stringify(metadataRecipient3)
    )
    await recipientRegistry.addRecipient(
      recipient4.getAddress(),
      JSON.stringify(metadataRecipient4)
    )
    await recipientRegistry.addRecipient(
      recipient5.getAddress(),
      JSON.stringify(metadataRecipient5)
    )
    await recipientRegistry.addRecipient(
      recipient6.getAddress(),
      JSON.stringify(metadataRecipient6)
    )
    await recipientRegistry.addRecipient(
      recipient7.getAddress(),
      JSON.stringify(metadataRecipient7)
    )
    await recipientRegistry.addRecipient(
      recipient8.getAddress(),
      JSON.stringify(metadataRecipient8)
    )
    await recipientRegistry.addRecipient(
      recipient9.getAddress(),
      JSON.stringify(metadataRecipient9)
    )
  } else if (recipientRegistryType === 'optimistic') {
    const recipientRegistry = await ethers.getContractAt(
      'OptimisticRecipientRegistry',
      recipientRegistryAddress
    )
    const deposit = await recipientRegistry.baseDeposit()
    const recipient1Added = await recipientRegistry.addRecipient(
      recipient1.getAddress(),
      JSON.stringify(metadataRecipient1),
      { value: deposit }
    )
    const recipient1Id = await getEventArg(
      recipient1Added,
      recipientRegistry,
      'RequestSubmitted',
      '_recipientId'
    )
    await recipientRegistry.executeRequest(recipient1Id)
    const recipient2Added = await recipientRegistry.addRecipient(
      recipient2.getAddress(),
      JSON.stringify(metadataRecipient2),
      { value: deposit }
    )
    const recipient2Id = await getEventArg(
      recipient2Added,
      recipientRegistry,
      'RequestSubmitted',
      '_recipientId'
    )
    await recipientRegistry.executeRequest(recipient2Id)
    // Add recipient without executing
    await recipientRegistry.addRecipient(
      recipient3.getAddress(),
      JSON.stringify(metadataRecipient3),
      { value: deposit }
    )
  }

  // Deploy new funding round and MACI
  await factory.deployNewRound()
  const fundingRoundAddress = await factory.getCurrentRound()
  console.log(`Funding round deployed: ${fundingRoundAddress}`)
  const fundingRound = await ethers.getContractAt(
    'FundingRound',
    fundingRoundAddress
  )
  const maciAddress = await fundingRound.maci()
  console.log(`MACI address: ${maciAddress}`)

  // Save the current state of the round
  fs.writeFileSync(
    'state.json',
    JSON.stringify({
      factory: factory.address,
      fundingRound: fundingRoundAddress,
      coordinatorPrivKey: coordinatorKeyPair.privKey.serialize(),
    })
  )
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
