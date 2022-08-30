import fs from 'fs'
import { ethers } from 'hardhat'
import { Keypair } from 'maci-domainobjs'

import { UNIT } from '../utils/constants'
import { MaciParameters } from '../utils/maci'
import { RecipientRegistryLoader } from '../utils/recipient-registry-loader'

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
  console.log('MACIFactory', maciFactoryAddress)
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

  if (userRegistryType === 'brightid') {
    const userRegistryAddress = await fundingRound.userRegistry()
    const userRegistry = await ethers.getContractAt(
      'BrightIdUserRegistry',
      userRegistryAddress
    )
    const maci = await ethers.getContractAt('MACI', maciAddress)
    const startTime = await maci.signUpTimestamp()
    const endTime = await maci.calcSignUpDeadline()
    const periodTx = await userRegistry.setRegistrationPeriod(
      startTime,
      endTime
    )
    console.log('Set user registration period', periodTx.hash)
    await periodTx.wait()
  }

  const recipientRegistryType = process.env.RECIPIENT_REGISTRY_TYPE || 'simple'
  const RecipientRegistryName: Record<string, string> = {
    simple: 'SimpleRecipientRegistry',
    optimistic: 'OptimisticRecipientRegistry',
  }
  const recipientRegistryAddress = await factory.recipientRegistry()
  const recipientRegistryName = RecipientRegistryName[recipientRegistryType]
  if (!recipientRegistryName) {
    throw new Error(
      `unsupported recipient registry type: ${recipientRegistryType}`
    )
  }
  const recipientRegistry = await ethers.getContractAt(
    recipientRegistryName,
    recipientRegistryAddress
  )

  // Add dummy recipients
  let recipients
  if (recipientRegistryType === 'simple') {
    recipients = RecipientRegistryLoader.buildStubRecipients([
      recipient1.address,
      recipient2.address,
      recipient3.address,
      recipient4.address,
      recipient5.address,
      recipient6.address,
      recipient7.address,
      recipient8.address,
      recipient9.address,
    ])
  } else {
    recipients = RecipientRegistryLoader.buildStubRecipients([
      recipient1.address,
      recipient2.address,
      recipient3.address,
    ])

    // Add recipient without executing
    recipients[2].skipExecution = true
  }
  await RecipientRegistryLoader.load(
    recipientRegistryType,
    recipientRegistry,
    recipients
  )

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
