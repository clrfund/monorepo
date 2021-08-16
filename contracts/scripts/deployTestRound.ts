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
  await token.deployTransaction.wait()
  console.log(`Token deployed: ${token.address}`)

  const tokenReceivers = [poolContributor, contributor1, contributor2]
  let transferTx
  for (const account of tokenReceivers) {
    transferTx = await token.transfer(account.getAddress(), UNIT.mul(100))
    transferTx.wait()
  }

  // Configure factory
  const factory = await ethers.getContractAt(
    'FundingRoundFactory',
    factoryAddress
  )
  const setTokenTx = await factory.setToken(token.address)
  await setTokenTx.wait()
  const coordinatorKeyPair = new Keypair()
  const setCoordinatorTx = await factory.setCoordinator(
    coordinator.getAddress(),
    coordinatorKeyPair.pubKey.asContractParam()
  )
  await setCoordinatorTx.wait()

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
  const setMaciParametersTx = await factory.setMaciParameters(
    ...maciParameters.values()
  )
  await setMaciParametersTx.wait()

  // Add to matching pool
  const poolContributionAmount = UNIT.mul(10)
  const poolContributorToken = token.connect(poolContributor)
  const poolContributionTx = await poolContributorToken.transfer(
    factory.address,
    poolContributionAmount
  )
  await poolContributionTx.wait()

  // Add contributors
  const userRegistryType = process.env.USER_REGISTRY_TYPE || 'simple'
  if (userRegistryType === 'simple') {
    const userRegistryAddress = await factory.userRegistry()
    const userRegistry = await ethers.getContractAt(
      'SimpleUserRegistry',
      userRegistryAddress
    )
    const users = [contributor1, contributor2]
    let addUserTx
    for (const account of users) {
      addUserTx = await userRegistry.addUser(account.getAddress())
      addUserTx.wait()
    }
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
    const recipients = [
      { account: recipient1, metadata: metadataRecipient1 },
      { account: recipient2, metadata: metadataRecipient2 },
      { account: recipient3, metadata: metadataRecipient3 },
      { account: recipient4, metadata: metadataRecipient4 },
      { account: recipient5, metadata: metadataRecipient5 },
      { account: recipient6, metadata: metadataRecipient6 },
      { account: recipient7, metadata: metadataRecipient7 },
      { account: recipient8, metadata: metadataRecipient8 },
      { account: recipient9, metadata: metadataRecipient9 },
    ]
    let addRecipientTx
    for (const recipient of recipients) {
      addRecipientTx = await recipientRegistry.addRecipient(
        recipient.account.getAddress(),
        JSON.stringify(recipient.metadata)
      )
      addRecipientTx.wait()
    }
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
      recipient2.getAddress(),
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

    // Add recipient without executing
    const recipient3Added = await recipientRegistry.addRecipient(
      recipient3.getAddress(),
      JSON.stringify(metadataRecipient3),
      { value: deposit }
    )
    recipient3Added.wait()

    // const recipient3Id = await getEventArg(
    //   recipient3Added,
    //   recipientRegistry,
    //   'RequestSubmitted',
    //   '_recipientId'
    // )
    // const executeRequest3 = await recipientRegistry.executeRequest(recipient3Id)
    // await executeRequest3.wait()

    // const recipient4Added = await recipientRegistry.addRecipient(
    //   recipient4.getAddress(),
    //   JSON.stringify(metadataRecipient4),
    //   { value: deposit }
    // )
    // recipient4Added.wait()

    // const recipient4Id = await getEventArg(
    //   recipient4Added,
    //   recipientRegistry,
    //   'RequestSubmitted',
    //   '_recipientId'
    // )
    // const executeRequest4 = await recipientRegistry.executeRequest(recipient4Id)
    // await executeRequest4.wait()

    // const recipient5Added = await recipientRegistry.addRecipient(
    //   recipient5.getAddress(),
    //   JSON.stringify(metadataRecipient5),
    //   { value: deposit }
    // )
    // recipient5Added.wait()

    // const recipient5Id = await getEventArg(
    //   recipient5Added,
    //   recipientRegistry,
    //   'RequestSubmitted',
    //   '_recipientId'
    // )
    // const executeRequest5 = await recipientRegistry.executeRequest(recipient5Id)
    // await executeRequest5.wait()

    // const recipient6Added = await recipientRegistry.addRecipient(
    //   recipient6.getAddress(),
    //   JSON.stringify(metadataRecipient6),
    //   { value: deposit }
    // )
    // recipient6Added.wait()

    // const recipient6Id = await getEventArg(
    //   recipient6Added,
    //   recipientRegistry,
    //   'RequestSubmitted',
    //   '_recipientId'
    // )
    // const executeRequest6 = await recipientRegistry.executeRequest(recipient6Id)
    // await executeRequest6.wait()

    // const recipient7Added = await recipientRegistry.addRecipient(
    //   recipient7.getAddress(),
    //   JSON.stringify(metadataRecipient7),
    //   { value: deposit }
    // )
    // recipient7Added.wait()

    // const recipient7Id = await getEventArg(
    //   recipient7Added,
    //   recipientRegistry,
    //   'RequestSubmitted',
    //   '_recipientId'
    // )
    // const executeRequest7 = await recipientRegistry.executeRequest(recipient7Id)
    // await executeRequest7.wait()

    // const recipient8Added = await recipientRegistry.addRecipient(
    //   recipient8.getAddress(),
    //   JSON.stringify(metadataRecipient8),
    //   { value: deposit }
    // )
    // recipient8Added.wait()

    // const recipient8Id = await getEventArg(
    //   recipient8Added,
    //   recipientRegistry,
    //   'RequestSubmitted',
    //   '_recipientId'
    // )
    // const executeRequest8 = await recipientRegistry.executeRequest(recipient8Id)
    // await executeRequest8.wait()
  }

  // Deploy new funding round and MACI
  const deployNewRoundTx = await factory.deployNewRound()
  await deployNewRoundTx.wait()
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
