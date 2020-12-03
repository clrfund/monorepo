/* eslint-disable @typescript-eslint/camelcase */
import { ethers, waffle } from '@nomiclabs/buidler'
import { use, expect } from 'chai'
import { solidity } from 'ethereum-waffle'
import { BigNumber, Contract, Signer, Wallet } from 'ethers'
import { processMessages as processCmd, tally as tallyCmd } from 'maci-cli'
import { Keypair } from 'maci-domainobjs'

import { UNIT } from '../utils/constants'
import { getEventArg } from '../utils/contracts'
import { deployMaciFactory } from '../utils/deployment'
import { getIpfsHash } from '../utils/ipfs'
import { MaciParameters, createMessage, getRecipientClaimData } from '../utils/maci'

import MACIArtifact from '../build/contracts/MACI.json'

use(solidity)

const ZERO = BigNumber.from(0)

describe('End-to-end Tests', function () {
  this.timeout(60 * 60 * 1000)
  this.bail(true)

  const provider = waffle.provider

  let deployer: Signer
  let coordinator: Wallet
  let poolContributor1: Signer
  let poolContributor2: Signer
  let recipient1: Signer
  let recipient2: Signer
  let recipient3: Signer
  let contributors: Signer[]

  let userRegistry: Contract
  let recipientRegistry: Contract
  let fundingRoundFactory: Contract
  let token: Contract
  let fundingRound: Contract
  let maci: Contract

  let maciParameters: MaciParameters
  let coordinatorKeypair: Keypair

  beforeEach(async () => {
    [
      deployer,
      poolContributor1,
      poolContributor2,
      recipient1,
      recipient2,
      recipient3,
      ...contributors
    ] = await ethers.getSigners()

    // Workaround for https://github.com/nomiclabs/buidler/issues/759
    coordinator = Wallet.createRandom().connect(provider)
    await deployer.sendTransaction({ to: coordinator.address, value: UNIT.mul(10) })

    // Deploy funding round factory
    const maciFactory = await deployMaciFactory(deployer)
    const SimpleUserRegistry = await ethers.getContractFactory('SimpleUserRegistry', deployer)
    userRegistry = await SimpleUserRegistry.deploy()
    const SimpleRecipientRegistry = await ethers.getContractFactory('SimpleRecipientRegistry', deployer)
    recipientRegistry = await SimpleRecipientRegistry.deploy()
    const FundingRoundFactory = await ethers.getContractFactory('FundingRoundFactory', deployer)
    fundingRoundFactory = await FundingRoundFactory.deploy(maciFactory.address)
    await maciFactory.transferOwnership(fundingRoundFactory.address)
    await fundingRoundFactory.setUserRegistry(userRegistry.address)
    await fundingRoundFactory.setRecipientRegistry(recipientRegistry.address)
    await recipientRegistry.setMaxRecipients(24)
    await recipientRegistry.setController(fundingRoundFactory.address)
    maciParameters = await MaciParameters.read(maciFactory)

    // Deploy ERC20 token contract
    const Token = await ethers.getContractFactory('AnyOldERC20Token', deployer)
    const tokenInitialSupply = UNIT.mul(10000)
    token = await Token.deploy(tokenInitialSupply)
    await token.transfer(await poolContributor1.getAddress(), UNIT.mul(50))
    await token.transfer(await poolContributor2.getAddress(), UNIT.mul(50))
    for (const contributor of contributors) {
      await token.transfer(await contributor.getAddress(), UNIT.mul(100))
    }

    // Configure factory
    await fundingRoundFactory.setToken(token.address)
    coordinatorKeypair = new Keypair()
    await fundingRoundFactory.setCoordinator(
      coordinator.address,
      coordinatorKeypair.pubKey.asContractParam(),
    )
    await fundingRoundFactory.setMaciParameters(...maciParameters.values())

    // Add funds to matching pool
    const poolContributionAmount = UNIT.mul(5)
    await token.connect(poolContributor1).transfer(
      fundingRoundFactory.address,
      poolContributionAmount,
    )

    // Add additional funding source
    await fundingRoundFactory.addFundingSource(await poolContributor2.getAddress())
    await token.connect(poolContributor2).approve(
      fundingRoundFactory.address,
      poolContributionAmount,
    )

    // Add recipients
    await recipientRegistry.addRecipient(
      await recipient1.getAddress(),
      JSON.stringify({ name: 'Project 1', description: 'Project 1', imageHash: '' }),
    )
    await recipientRegistry.addRecipient(
      await recipient2.getAddress(),
      JSON.stringify({ name: 'Project 2', description: 'Project 2', imageHash: '' }),
    )
    await recipientRegistry.addRecipient(
      await recipient3.getAddress(),
      JSON.stringify({ name: 'Project 3', description: 'Project 3', imageHash: '' }),
    )

    // Deploy new funding round and MACI
    await fundingRoundFactory.deployNewRound()
    const fundingRoundAddress = await fundingRoundFactory.getCurrentRound()
    fundingRound = await ethers.getContractAt(
      'FundingRound',
      fundingRoundAddress,
    )
    const maciAddress = await fundingRound.maci()
    maci = await ethers.getContractAt(MACIArtifact.abi, maciAddress)
  })

  async function makeContributions(amounts: BigNumber[]) {
    const contributions: {[key: string]: any}[] = []
    for (let index = 0; index < contributors.length; index++) {
      const contributionAmount = amounts[index]
      if (!contributionAmount) {
        break
      }
      // Register contributor
      const contributor = contributors[index]
      const contributorAddress = await contributor.getAddress()
      await userRegistry.addUser(contributorAddress)
      // Approve transfer
      await token.connect(contributor).approve(
        fundingRound.address,
        contributionAmount,
      )
      // Contribute
      const contributorKeypair = new Keypair()
      const contributionTx = await fundingRound.connect(contributor).contribute(
        contributorKeypair.pubKey.asContractParam(),
        contributionAmount,
      )
      const stateIndex = await getEventArg(contributionTx, maci, 'SignUp', '_stateIndex')
      const voiceCredits = await getEventArg(contributionTx, maci, 'SignUp', '_voiceCreditBalance')
      contributions.push({
        signer: contributor,
        keypair: contributorKeypair,
        stateIndex: parseInt(stateIndex),
        contribution: contributionAmount,
        voiceCredits: voiceCredits,
      })
    }
    return contributions
  }

  async function finalizeRound(): Promise<any> {
    const providerUrl = (provider as any)._buidlerNetwork.config.url

    // Process messages
    const randomStateLeaf = await processCmd({
      contract: maci.address,
      eth_privkey: coordinator.privateKey,
      eth_provider: providerUrl,
      privkey: coordinatorKeypair.privKey.serialize(),
      repeat: true,
    })

    // Tally votes
    const tally: any = await tallyCmd({
      contract: maci.address,
      eth_privkey: coordinator.privateKey,
      eth_provider: providerUrl,
      privkey: coordinatorKeypair.privKey.serialize(),
      repeat: true,
      current_results_salt: '0x0',
      current_total_vc_salt: '0x0',
      current_per_vo_vc_salt: '0x0',
      leaf_zero: randomStateLeaf,
    })
    const tallyHash = await getIpfsHash(tally)
    await fundingRound.connect(coordinator).publishTallyHash(tallyHash)

    // Finalize round
    await fundingRoundFactory.transferMatchingFunds(
      tally.totalVoiceCredits.spent,
      tally.totalVoiceCredits.salt,
    )

    // Claim funds
    tally.claims = {}
    const recipientTreeDepth = (await maci.treeDepths()).voteOptionTreeDepth
    for (const recipientIndex of [1, 2]) {
      const recipient = recipientIndex === 1 ? recipient1 : recipient2
      const recipientClaimData = getRecipientClaimData(
        recipientIndex,
        recipientTreeDepth,
        tally,
      )
      const claimTx = await fundingRound.connect(recipient).claimFunds(...recipientClaimData)
      const claimedAmount = await getEventArg(claimTx, fundingRound, 'FundsClaimed', '_amount')
      tally.claims[recipientIndex] = claimedAmount
    }
    return tally
  }

  it('should allocate funds correctly when users change keys', async () => {
    const contributions = await makeContributions([
      UNIT.mul(8).div(10),
      UNIT.mul(8).div(10),
    ])

    // Submit messages
    for (const contribution of contributions) {
      const contributor = contribution.signer
      const messages = []
      const encPubKeys = []
      let nonce = 1

      // Change key
      const newContributorKeypair = new Keypair()
      const [message, encPubKey] = createMessage(
        contribution.stateIndex,
        contribution.keypair, newContributorKeypair,
        coordinatorKeypair.pubKey,
        null, null, nonce,
      )
      messages.push(message)
      encPubKeys.push(encPubKey)
      nonce += 1

      // Spend voice credits on both recipients
      for (const recipientIndex of [1, 2]) {
        const voiceCredits = contribution.voiceCredits.div(2)
        const [message, encPubKey] = createMessage(
          contribution.stateIndex,
          newContributorKeypair, null,
          coordinatorKeypair.pubKey,
          recipientIndex, voiceCredits, nonce,
        )
        messages.push(message)
        encPubKeys.push(encPubKey)
        nonce += 1
      }

      await fundingRound.connect(contributor).submitMessageBatch(
        messages.reverse().map((msg) => msg.asContractParam()),
        encPubKeys.reverse().map((key) => key.asContractParam()),
      )
    }

    await provider.send('evm_increaseTime', [maciParameters.signUpDuration])
    await provider.send('evm_increaseTime', [maciParameters.votingDuration])
    const tally = await finalizeRound()
    expect(tally.totalVoiceCredits.spent).to.equal('160000')
    expect(tally.claims[1]).to.equal(UNIT.mul(58).div(10))
    expect(tally.claims[2]).to.equal(UNIT.mul(58).div(10))
  })

  it('should allocate funds correctly if not all voice credits are spent', async () => {
    const contributions = await makeContributions([
      UNIT.mul(8).div(10),
      UNIT.mul(8).div(10),
    ])

    for (const contribution of contributions) {
      const contributor = contribution.signer
      const recipientIndex = contributions.indexOf(contribution) + 1
      const voiceCredits = contribution.voiceCredits.div(2)
      const nonce = 1
      const [message, encPubKey] = createMessage(
        contribution.stateIndex,
        contribution.keypair, null,
        coordinatorKeypair.pubKey,
        recipientIndex, voiceCredits, nonce,
      )
      await fundingRound.connect(contributor).submitMessageBatch(
        [message.asContractParam()],
        [encPubKey.asContractParam()],
      )
    }

    await provider.send('evm_increaseTime', [maciParameters.signUpDuration])
    await provider.send('evm_increaseTime', [maciParameters.votingDuration])
    const tally = await finalizeRound()
    expect(tally.totalVoiceCredits.spent).to.equal('80000')
    expect(tally.claims[1]).to.equal(UNIT.mul(58).div(10))
    expect(tally.claims[2]).to.equal(UNIT.mul(58).div(10))
  })

  it('should overwrite votes 1', async () => {
    const [contribution] = await makeContributions([UNIT.mul(5).div(10)])
    const contributor = contribution.signer
    const votes = [
      [1, contribution.voiceCredits.div(5)],
      [2, contribution.voiceCredits.div(5)],
      [1, contribution.voiceCredits.div(5).mul(4)],
    ]
    const messages = []
    const encPubKeys = []
    let nonce = 1
    for (const [recipientIndex, voiceCredits] of votes) {
      const [message, encPubKey] = createMessage(
        contribution.stateIndex,
        contribution.keypair, null,
        coordinatorKeypair.pubKey,
        recipientIndex, voiceCredits, nonce,
      )
      nonce += 1
      messages.push(message)
      encPubKeys.push(encPubKey)
    }
    await fundingRound.connect(contributor).submitMessageBatch(
      messages.reverse().map((msg) => msg.asContractParam()),
      encPubKeys.reverse().map((key) => key.asContractParam()),
    )

    await provider.send('evm_increaseTime', [maciParameters.signUpDuration])
    await provider.send('evm_increaseTime', [maciParameters.votingDuration])
    const tally = await finalizeRound()
    expect(tally.totalVoiceCredits.spent).to.equal('50000')
    expect(tally.results.tally[1]).to.equal('200')
    expect(tally.results.tally[2]).to.equal('100')
    expect(tally.claims[1].toString()).to.equal('7066666666666666666')
    expect(tally.claims[2].toString()).to.equal('3433333333333333333')
  })

  it('should overwrite votes 2', async () => {
    const [contribution] = await makeContributions([UNIT.mul(16).div(10)])
    const contributor = contribution.signer
    const votes = [
      [1, contribution.voiceCredits.div(2)],
      [2, contribution.voiceCredits.div(2)],
      [1, ZERO],
      [2, contribution.voiceCredits],
    ]
    const messages = []
    const encPubKeys = []
    let nonce = 1
    for (const [recipientIndex, voiceCredits] of votes) {
      const [message, encPubKey] = createMessage(
        contribution.stateIndex,
        contribution.keypair, null,
        coordinatorKeypair.pubKey,
        recipientIndex, voiceCredits, nonce,
      )
      nonce += 1
      messages.push(message)
      encPubKeys.push(encPubKey)
    }
    await fundingRound.connect(contributor).submitMessageBatch(
      messages.reverse().map((msg) => msg.asContractParam()),
      encPubKeys.reverse().map((key) => key.asContractParam()),
    )

    await provider.send('evm_increaseTime', [maciParameters.signUpDuration])
    await provider.send('evm_increaseTime', [maciParameters.votingDuration])
    const tally = await finalizeRound()
    expect(tally.totalVoiceCredits.spent).to.equal('160000')
    expect(tally.results.tally[1]).to.equal('0')
    expect(tally.results.tally[2]).to.equal('400')
    expect(tally.claims[1]).to.equal(ZERO)
    expect(tally.claims[2]).to.equal(UNIT.mul(116).div(10))
  })

  it('should overwrite previous batch of votes', async () => {
    const [contribution] = await makeContributions([UNIT.mul(8).div(10)])
    const contributor = contribution.signer
    const votes = [[
      [1, contribution.voiceCredits.div(3)],
      [2, contribution.voiceCredits.div(3)],
      [3, contribution.voiceCredits.div(3)],
    ], [
      [1, contribution.voiceCredits.div(2)],
      [2, contribution.voiceCredits.div(2)],
      [3, ZERO],
    ]]
    for (const batch of votes) {
      const messages = []
      const encPubKeys = []
      let nonce = 1
      for (const [recipientIndex, voiceCredits] of batch) {
        const [message, encPubKey] = createMessage(
          contribution.stateIndex,
          contribution.keypair, null,
          coordinatorKeypair.pubKey,
          recipientIndex, voiceCredits, nonce,
        )
        nonce += 1
        messages.push(message)
        encPubKeys.push(encPubKey)
      }
      await fundingRound.connect(contributor).submitMessageBatch(
        messages.reverse().map((msg) => msg.asContractParam()),
        encPubKeys.reverse().map((key) => key.asContractParam()),
      )
    }

    await provider.send('evm_increaseTime', [maciParameters.signUpDuration])
    await provider.send('evm_increaseTime', [maciParameters.votingDuration])
    const tally = await finalizeRound()
    expect(tally.totalVoiceCredits.spent).to.equal('80000')
    expect(tally.results.tally[1]).to.equal('200')
    expect(tally.results.tally[2]).to.equal('200')
    expect(tally.results.tally[3]).to.equal('0')
  })

  it('should invalidate votes in case of bribe', async () => {
    const [contribution] = await makeContributions([
      UNIT.mul(4).div(10),
    ])
    const contributor = contribution.signer
    let message
    let encPubKey

    // Vote for recipient 1 for a bribe immediately after signup
    const messageBatch1 = []
    const encPubKeyBatch1 = [];
    [message, encPubKey] = createMessage(
      contribution.stateIndex,
      contribution.keypair,
      null,
      coordinatorKeypair.pubKey,
      1,
      contribution.voiceCredits,
      1,
    )
    messageBatch1.push(message)
    encPubKeyBatch1.push(encPubKey);
    // Change key to invalid key
    [message, encPubKey] = createMessage(
      contribution.stateIndex,
      contribution.keypair,
      new Keypair(),
      coordinatorKeypair.pubKey,
      null,
      null,
      2,
    )
    messageBatch1.push(message)
    encPubKeyBatch1.push(encPubKey)
    await fundingRound.connect(contributor).submitMessageBatch(
      messageBatch1.reverse().map((msg) => msg.asContractParam()),
      encPubKeyBatch1.reverse().map((key) => key.asContractParam()),
    )

    // Wait for signup period to end to override votes
    await provider.send('evm_increaseTime', [maciParameters.signUpDuration])
    const messageBatch2 = []
    const encPubKeyBatch2 = []
    // Change key
    const newContributorKeypair = new Keypair();
    [message, encPubKey] = createMessage(
      contribution.stateIndex,
      contribution.keypair,
      newContributorKeypair,
      coordinatorKeypair.pubKey,
      null,
      null,
      1,
    )
    messageBatch2.push(message)
    encPubKeyBatch2.push(encPubKey);
    // Vote for recipient 1
    [message, encPubKey] = createMessage(
      contribution.stateIndex,
      newContributorKeypair,
      null,
      coordinatorKeypair.pubKey,
      1,
      BigNumber.from(0),
      2,
    )
    messageBatch2.push(message)
    encPubKeyBatch2.push(encPubKey);
    // Vote for recipient 2
    [message, encPubKey] = createMessage(
      contribution.stateIndex,
      newContributorKeypair,
      null,
      coordinatorKeypair.pubKey,
      2,
      contribution.voiceCredits,
      3,
    )
    messageBatch2.push(message)
    encPubKeyBatch2.push(encPubKey)
    await fundingRound.connect(contributor).submitMessageBatch(
      messageBatch2.reverse().map((msg) => msg.asContractParam()),
      encPubKeyBatch2.reverse().map((key) => key.asContractParam()),
    )

    await provider.send('evm_increaseTime', [maciParameters.votingDuration])
    const tally = await finalizeRound()
    expect(tally.totalVoiceCredits.spent).to.equal('40000')
    expect(tally.claims[1]).to.equal(BigNumber.from(0))
    expect(tally.claims[2]).to.equal(UNIT.mul(104).div(10))
  })
})
