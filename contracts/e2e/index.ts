import { ethers, config } from 'hardhat'
import { time, mine } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { BaseContract, Contract, toNumber, Signer } from 'ethers'
import {
  Keypair,
  createMessage,
  Message,
  PubKey,
  genTallyResultCommitment,
} from '@clrfund/common'

import {
  UNIT,
  ALPHA_PRECISION,
  DEFAULT_GET_LOG_BATCH_SIZE,
  DEFAULT_SR_QUEUE_OPS,
} from '../utils/constants'
import { getEventArg } from '../utils/contracts'
import {
  deployContract,
  deployPoseidonLibraries,
  deployMaciFactory,
} from '../utils/deployment'
import { getIpfsHash } from '../utils/ipfs'
import {
  bnSqrt,
  genProofs,
  proveOnChain,
  mergeMaciSubtrees,
  addTallyResultsBatch,
  getRecipientClaimData,
  getGenProofArgs,
  TallyData,
} from '../utils/maci'
import { DEFAULT_CIRCUIT } from '../utils/circuits'
import { MaciParameters } from '../utils/maciParameters'
import { existsSync, mkdirSync } from 'fs'
import path from 'path'
import { FundingRound } from '../typechain-types'
import { JSONFile } from '../utils/JSONFile'

type VoteData = { recipientIndex: number; voiceCredits: bigint }
type ClaimData = { [index: number]: bigint }

const ZERO = BigInt(0)
// funding round duration
const roundDuration = 7 * 86400

// log output for debugging
const quiet = !(process.env.DEBUG || false)
console.log('quiet', quiet)
function debugLog(message?: any, ...optionalParams: any[]) {
  if (!quiet) console.log(message, ...optionalParams)
}

// MACI zkFiles
const circuit = process.env.CIRCUIT_TYPE || DEFAULT_CIRCUIT
const circuitDirectory = process.env.CIRCUIT_DIRECTORY || './params'
const rapidsnark = process.env.RAPID_SNARK || '~/rapidsnark/package/bin/prover'
const proofOutputDirectory = process.env.PROOF_OUTPUT_DIR || './proof_output'
const tallyBatchSize = Number(process.env.TALLY_BATCH_SIZE || 8)

function sumVoiceCredits(voiceCredits: bigint[]): string {
  const total = voiceCredits.reduce((sum, credits) => sum + credits, BigInt(0))
  return total.toString()
}

/*
 * tally up votes received by each recipient
 * recipientsVotes[i][j] is the jth vote received by recipient i
 * returns the tally result for each recipient
 */
function tallyVotes(recipientsVotes: bigint[][]): bigint[] {
  const result = recipientsVotes.map((votes) => {
    return votes.reduce(
      (sum, voiceCredits) => sum + bnSqrt(voiceCredits),
      BigInt(0)
    )
  })
  return result
}

/*
 * Calculate the funds that each recipient can claim
 * votes[i][j] is the jth vote received by recipient i
 * returns the tally result for each recipient
 */
async function calculateClaims(
  fundingRound: Contract,
  votes: bigint[][]
): Promise<bigint[]> {
  const alpha = await fundingRound.alpha()
  const factor = await fundingRound.voiceCreditFactor()
  const tallyResult = tallyVotes(votes)
  return tallyResult.map((quadraticVotes, i) => {
    const spent = sumVoiceCredits(votes[i])
    const quadratic = quadraticVotes * quadraticVotes * factor * alpha
    const linear = BigInt(spent) * factor * (ALPHA_PRECISION - alpha)
    return (quadratic + linear) / ALPHA_PRECISION
  })
}

/**
 * Make a vote with recipient and voice credits information
 * @param recipientIndex recipient index
 * @param voiceCredits voice credits in the vote
 * @returns a Vote
 */
function makeVote(recipientIndex: number, voiceCredits: bigint): VoteData {
  return { recipientIndex, voiceCredits }
}

describe('End-to-end Tests', function () {
  this.timeout(60 * 60 * 1000)
  this.bail(true)

  let maciTransactionHash: string

  let deployer: Signer
  let coordinator: Signer
  let poolContributor1: Signer
  let poolContributor2: Signer
  let recipient1: Signer
  let recipient2: Signer
  let recipient3: Signer
  let contributors: Signer[]

  let poseidonLibraries: { [key: string]: string }
  let userRegistry: Contract
  let recipientRegistry: Contract
  let clrfund: Contract
  let token: Contract
  let fundingRound: Contract
  let pollContract: Contract
  let maci: Contract
  let pollId: bigint
  let coordinatorKeypair: Keypair
  let params: MaciParameters

  before(async () => {
    params = await MaciParameters.fromConfig(circuit, circuitDirectory)
    poseidonLibraries = await deployPoseidonLibraries({
      ethers,
      artifactsPath: config.paths.artifacts,
      signer: deployer,
    })
  })

  beforeEach(async () => {
    ;[
      coordinator,
      deployer,
      poolContributor1,
      poolContributor2,
      recipient1,
      recipient2,
      recipient3,
      ...contributors
    ] = await ethers.getSigners()

    // Deploy funding round factory
    debugLog('Deploying MACI factory')
    const maciFactory = await deployMaciFactory({
      libraries: poseidonLibraries,
      signer: deployer,
      ethers,
      maciParameters: params,
    })

    clrfund = await deployContract({
      name: 'ClrFund',
      signer: deployer,
      ethers,
    })

    const roundFactory = await deployContract({
      name: 'FundingRoundFactory',
      signer: deployer,
      ethers,
    })

    const initClrfundTx = await clrfund.init(
      maciFactory.target,
      roundFactory.target
    )
    await initClrfundTx.wait()
    const transferTx = await maciFactory.transferOwnership(clrfund.target)
    await transferTx.wait()

    userRegistry = await ethers.deployContract('SimpleUserRegistry', deployer)
    await clrfund.setUserRegistry(userRegistry.target)
    const SimpleRecipientRegistry = await ethers.getContractFactory(
      'SimpleRecipientRegistry',
      deployer
    )
    recipientRegistry = await SimpleRecipientRegistry.deploy(clrfund.target)
    await clrfund.setRecipientRegistry(recipientRegistry.target)

    // Deploy ERC20 token contract
    const Token = await ethers.getContractFactory('AnyOldERC20Token', deployer)
    const tokenInitialSupply = UNIT * BigInt(10000)
    token = await Token.deploy(tokenInitialSupply)
    await token.transfer(await poolContributor1.getAddress(), UNIT * BigInt(50))
    await token.transfer(await poolContributor2.getAddress(), UNIT * BigInt(50))
    for (const contributor of contributors) {
      await token.transfer(await contributor.getAddress(), UNIT * BigInt(100))
    }

    // Configure factory
    await clrfund.setToken(token.target)
    coordinatorKeypair = new Keypair()
    const coordinatorAddress = await coordinator.getAddress()
    await clrfund.setCoordinator(
      coordinatorAddress,
      coordinatorKeypair.pubKey.asContractParam()
    )

    // Add funds to matching pool
    const poolContributionAmount = UNIT * BigInt(5)
    await (token.connect(poolContributor1) as Contract).transfer(
      clrfund.target,
      poolContributionAmount
    )

    // Add additional funding source
    await clrfund.addFundingSource(await poolContributor2.getAddress())
    await (token.connect(poolContributor2) as Contract).approve(
      clrfund.target,
      poolContributionAmount
    )

    // Add recipients
    await recipientRegistry.addRecipient(
      await recipient1.getAddress(),
      JSON.stringify({
        name: 'Project 1',
        description: 'Project 1',
        imageHash: '',
      })
    )
    await recipientRegistry.addRecipient(
      await recipient2.getAddress(),
      JSON.stringify({
        name: 'Project 2',
        description: 'Project 2',
        imageHash: '',
      })
    )
    await recipientRegistry.addRecipient(
      await recipient3.getAddress(),
      JSON.stringify({
        name: 'Project 3',
        description: 'Project 3',
        imageHash: '',
      })
    )

    // Deploy new funding round and MACI
    const newRoundTx = await clrfund.deployNewRound(roundDuration)
    maciTransactionHash = newRoundTx.hash

    const fundingRoundAddress = await clrfund.getCurrentRound()
    fundingRound = await ethers.getContractAt(
      'FundingRound',
      fundingRoundAddress
    )
    const maciAddress = await fundingRound.maci()
    maci = await ethers.getContractAt('MACI', maciAddress)

    pollId = await fundingRound.pollId()
    const pollAddress = await fundingRound.poll()
    pollContract = await ethers.getContractAt('Poll', pollAddress)

    await mine()
  })

  async function makeContributions(amounts: bigint[]) {
    const contributions: { [key: string]: any }[] = []
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
      await (token.connect(contributor) as Contract).approve(
        fundingRound.target,
        contributionAmount
      )
      // Contribute
      const contributorKeypair = new Keypair()
      const contributionTx = await (
        fundingRound.connect(contributor) as Contract
      ).contribute(
        contributorKeypair.pubKey.asContractParam(),
        contributionAmount
      )
      const stateIndex = await getEventArg(
        contributionTx,
        maci,
        'SignUp',
        '_stateIndex'
      )
      const voiceCredits = await getEventArg(
        contributionTx,
        maci,
        'SignUp',
        '_voiceCreditBalance'
      )
      contributions.push({
        signer: contributor,
        keypair: contributorKeypair,
        stateIndex: toNumber(stateIndex),
        contribution: contributionAmount,
        voiceCredits: BigInt(voiceCredits),
      })
    }
    return contributions
  }

  /**
   * Get the tally and message processor contract address from the funding round
   * @returns tally and message processor contract addresses
   */
  async function getTallyAndMessageProcessor(): Promise<{
    tallyAddress: string
    messageProcessorAddress: string
  }> {
    const tallyAddress = await fundingRound.tally()
    const tallyContact = await ethers.getContractAt('Tally', tallyAddress)
    const messageProcessorAddress = await tallyContact.messageProcessor()

    return { tallyAddress, messageProcessorAddress }
  }

  async function finalizeRound(
    testResetTally = false
  ): Promise<{ tally: TallyData; claims: ClaimData }> {
    debugLog('Finalizing round')
    // Process messages and tally votes
    const maciAddress = await maci.getAddress()
    await mergeMaciSubtrees({
      maciAddress,
      pollId,
      numQueueOps: DEFAULT_SR_QUEUE_OPS,
      signer: coordinator,
    })
    debugLog('Merged MACI trees')

    const random = Math.floor(Math.random() * 10 ** 8)
    const outputDir = path.join(proofOutputDirectory, `${random}`)
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true })
    }

    // past an end block that's later than the MACI start block
    const genProofArgs = getGenProofArgs({
      maciAddress,
      pollId,
      coordinatorMacisk: coordinatorKeypair.privKey.serialize(),
      rapidsnark,
      circuitType: circuit,
      circuitDirectory,
      outputDir,
      blocksPerBatch: DEFAULT_GET_LOG_BATCH_SIZE,
      maciTxHash: maciTransactionHash,
      signer: coordinator,
      quiet,
    })

    debugLog('Generating proof')
    await genProofs(genProofArgs)
    debugLog('Generated proof')

    const { tallyAddress, messageProcessorAddress } =
      await getTallyAndMessageProcessor()

    debugLog('Proving on chain')
    // Submit proofs to MACI contract
    await proveOnChain({
      pollId,
      proofDir: genProofArgs.outputDir,
      subsidyEnabled: false,
      maciAddress,
      messageProcessorAddress,
      tallyAddress,
      signer: coordinator,
      quiet,
    })

    if (testResetTally) {
      console.log('resetting tally and message processor contracts')
      const resetTx = await fundingRound.resetTally()
      await resetTx.wait()

      const { tallyAddress, messageProcessorAddress } =
        await getTallyAndMessageProcessor()
      console.log('redoing proveOnChain with new tallyAddress', tallyAddress)

      await proveOnChain({
        pollId,
        proofDir: genProofArgs.outputDir,
        subsidyEnabled: false,
        maciAddress,
        messageProcessorAddress,
        tallyAddress,
        signer: coordinator,
        quiet,
      })
    }
    console.log('finished proveOnChain')

    const tally = JSONFile.read(genProofArgs.tallyFile) as TallyData
    const tallyHash = await getIpfsHash(tally)
    await (fundingRound.connect(coordinator) as Contract).publishTallyHash(
      tallyHash
    )
    console.log('Tally hash', tallyHash)

    // add tally results to funding round
    const recipientTreeDepth = params.treeDepths.voteOptionTreeDepth
    console.log('Adding tally result on chain in batches of', tallyBatchSize)
    await addTallyResultsBatch(
      fundingRound.connect(coordinator) as BaseContract as FundingRound,
      recipientTreeDepth,
      tally,
      tallyBatchSize
    )
    console.log('Finished adding tally results')

    const newResultCommitment = genTallyResultCommitment(
      tally.results.tally.map((x: string) => BigInt(x)),
      BigInt(tally.results.salt),
      recipientTreeDepth
    )

    const perVOSpentVoiceCreditsCommitment = genTallyResultCommitment(
      tally.perVOSpentVoiceCredits.tally.map((x: string) => BigInt(x)),
      BigInt(tally.perVOSpentVoiceCredits.salt),
      recipientTreeDepth
    )

    // Finalize round
    debugLog('Transfering matching funds')
    await clrfund.transferMatchingFunds(
      tally.totalSpentVoiceCredits.spent,
      tally.totalSpentVoiceCredits.salt,
      newResultCommitment.toString(),
      perVOSpentVoiceCreditsCommitment.toString()
    )

    // Claim funds
    const claims: ClaimData = {}
    for (const recipientIndex of [1, 2]) {
      const recipient = recipientIndex === 1 ? recipient1 : recipient2

      const claimData = getRecipientClaimData(
        recipientIndex,
        recipientTreeDepth,
        tally
      )
      const claimTx = await (
        fundingRound.connect(recipient) as Contract
      ).claimFunds(...claimData)
      const claimedAmount = await getEventArg(
        claimTx,
        fundingRound,
        'FundsClaimed',
        '_amount'
      )
      claims[recipientIndex] = BigInt(claimedAmount)
    }
    return { tally, claims }
  }

  it('should allocate funds correctly when users change keys', async () => {
    const contributions = await makeContributions([
      (UNIT * BigInt(50)) / BigInt(10),
      (UNIT * BigInt(50)) / BigInt(10),
    ])
    // Submit messages
    for (const contribution of contributions) {
      const contributor = contribution.signer
      const messages: Message[] = []
      const encPubKeys: PubKey[] = []
      let nonce = 1

      // Change key
      const newContributorKeypair = new Keypair()
      const [message, encPubKey] = createMessage(
        contribution.stateIndex,
        contribution.keypair,
        newContributorKeypair,
        coordinatorKeypair.pubKey,
        null,
        null,
        nonce,
        pollId
      )
      messages.push(message)
      encPubKeys.push(encPubKey)
      nonce += 1

      // Spend voice credits on both recipients
      for (const recipientIndex of [1, 2]) {
        const voiceCredits = BigInt(contribution.voiceCredits) / BigInt(2)
        const [message, encPubKey] = createMessage(
          contribution.stateIndex,
          newContributorKeypair,
          null,
          coordinatorKeypair.pubKey,
          recipientIndex,
          voiceCredits,
          nonce,
          pollId
        )
        messages.push(message)
        encPubKeys.push(encPubKey)
        nonce += 1
      }

      await (pollContract.connect(contributor) as Contract).publishMessageBatch(
        messages.reverse().map((msg) => msg.asContractParam()),
        encPubKeys.reverse().map((key) => key.asContractParam())
      )
    }

    await time.increase(roundDuration)
    const { tally, claims } = await finalizeRound()
    const expectedTotalVoiceCredits = sumVoiceCredits(
      contributions.map((x) => x.voiceCredits)
    )
    expect(tally.totalSpentVoiceCredits.spent).to.equal(
      expectedTotalVoiceCredits
    )
    const expectedClaims = await calculateClaims(
      fundingRound,
      new Array(2).fill(
        contributions.map((x) => BigInt(x.voiceCredits) / BigInt(2))
      )
    )
    console.log('expected claim', claims[1], expectedClaims[0])
    expect(claims[1]).to.equal(expectedClaims[0])
    expect(claims[2]).to.equal(expectedClaims[1])
  })

  it('should allocate funds correctly if not all voice credits are spent', async () => {
    const contributions = await makeContributions([
      (UNIT * BigInt(36)) / BigInt(10),
      (UNIT * BigInt(36)) / BigInt(10),
    ])

    // 2 contirbutors, divide their contributions into 4 parts, only contribute 2 parts to 2 projects
    for (const contribution of contributions) {
      const contributor = contribution.signer
      const voiceCredits = BigInt(contribution.voiceCredits) / BigInt(4)
      let nonce = 1
      const messages: Message[] = []
      const encPubKeys: PubKey[] = []

      for (const recipientIndex of [1, 2]) {
        const [message, encPubKey] = createMessage(
          contribution.stateIndex,
          contribution.keypair,
          null,
          coordinatorKeypair.pubKey,
          recipientIndex,
          voiceCredits,
          nonce,
          pollId
        )
        messages.push(message)
        encPubKeys.push(encPubKey)
        nonce += 1
      }
      await (pollContract.connect(contributor) as Contract).publishMessageBatch(
        messages.reverse().map((msg) => msg.asContractParam()),
        encPubKeys.reverse().map((key) => key.asContractParam())
      )
    }

    await time.increase(roundDuration)
    const { tally, claims } = await finalizeRound()
    const expectedTotalVoiceCredits = sumVoiceCredits(
      contributions.map((x) => BigInt(x.voiceCredits) / BigInt(2))
    )
    expect(tally.totalSpentVoiceCredits.spent).to.equal(
      expectedTotalVoiceCredits
    )

    const expectedClaims = await calculateClaims(
      fundingRound,
      new Array(2).fill(
        contributions.map((x) => BigInt(x.voiceCredits) / BigInt(4))
      )
    )
    expect(claims[1]).to.equal(expectedClaims[0])
    expect(claims[2]).to.equal(expectedClaims[1])
  })

  it('should overwrite votes 1', async () => {
    const [contribution, contribution2] = await makeContributions([
      UNIT * BigInt(5),
      UNIT * BigInt(90),
    ])
    const contributor = contribution.signer
    const votes: VoteData[] = [
      makeVote(1, BigInt(contribution.voiceCredits) / BigInt(6)),
      makeVote(2, BigInt(contribution.voiceCredits) / BigInt(2)),
      makeVote(1, BigInt(contribution.voiceCredits) / BigInt(2)),
    ]
    const messages: Message[] = []
    const encPubKeys: PubKey[] = []
    let nonce = 1
    for (const { recipientIndex, voiceCredits } of votes) {
      const [message, encPubKey] = createMessage(
        contribution.stateIndex,
        contribution.keypair,
        null,
        coordinatorKeypair.pubKey,
        recipientIndex,
        voiceCredits,
        nonce,
        pollId
      )
      nonce += 1
      messages.push(message)
      encPubKeys.push(encPubKey)
    }
    await (pollContract.connect(contributor) as Contract).publishMessageBatch(
      messages.reverse().map((msg) => msg.asContractParam()),
      encPubKeys.reverse().map((key) => key.asContractParam())
    )
    const [message, encPubKey] = createMessage(
      contribution2.stateIndex,
      contribution2.keypair,
      null,
      coordinatorKeypair.pubKey,
      2,
      contribution2.voiceCredits,
      1,
      pollId
    )
    await (
      pollContract.connect(contribution2.signer) as Contract
    ).publishMessageBatch(
      [message.asContractParam()],
      [encPubKey.asContractParam()]
    )

    await time.increase(roundDuration)
    const { tally, claims } = await finalizeRound()
    const expectedTotalVoiceCredits = sumVoiceCredits([
      contribution.voiceCredits,
      contribution2.voiceCredits,
    ])
    expect(tally.totalSpentVoiceCredits.spent).to.equal(
      expectedTotalVoiceCredits
    )

    const voiceCredits1 = BigInt(contribution.voiceCredits) / BigInt(2)
    const submittedVoiceCredits = [
      [voiceCredits1],
      [voiceCredits1, contribution2.voiceCredits],
    ]
    const expectedTally = tallyVotes(submittedVoiceCredits)
    expect(BigInt(tally.results.tally[1])).to.equal(expectedTally[0])
    expect(BigInt(tally.results.tally[2])).to.equal(expectedTally[1])
    const expectedClaims = await calculateClaims(
      fundingRound,
      submittedVoiceCredits
    )
    expect(claims[1]).to.equal(expectedClaims[0])
    expect(claims[2]).to.equal(expectedClaims[1])
  })

  it('should overwrite votes 2', async () => {
    const [contribution, contribution2] = await makeContributions([
      UNIT * BigInt(90),
      UNIT * BigInt(40),
    ])
    const contributor = contribution.signer
    const votes: VoteData[] = [
      makeVote(1, BigInt(contribution.voiceCredits) / BigInt(2)),
      makeVote(2, BigInt(contribution.voiceCredits) / BigInt(2)),
      makeVote(1, ZERO),
      makeVote(2, BigInt(contribution.voiceCredits)),
    ]
    const messages: Message[] = []
    const encPubKeys: PubKey[] = []
    let nonce = 1
    for (const { recipientIndex, voiceCredits } of votes) {
      const [message, encPubKey] = createMessage(
        contribution.stateIndex,
        contribution.keypair,
        null,
        coordinatorKeypair.pubKey,
        recipientIndex,
        voiceCredits,
        nonce,
        pollId
      )
      nonce += 1
      messages.push(message)
      encPubKeys.push(encPubKey)
    }
    await (pollContract.connect(contributor) as Contract).publishMessageBatch(
      messages.reverse().map((msg) => msg.asContractParam()),
      encPubKeys.reverse().map((key) => key.asContractParam())
    )

    // contribution 2
    const [message, encPubKey] = createMessage(
      contribution2.stateIndex,
      contribution2.keypair,
      null,
      coordinatorKeypair.pubKey,
      2,
      contribution2.voiceCredits,
      1,
      pollId
    )
    await (
      pollContract.connect(contribution2.signer) as Contract
    ).publishMessageBatch(
      [message.asContractParam()],
      [encPubKey.asContractParam()]
    )

    await time.increase(roundDuration)
    const { tally, claims } = await finalizeRound()
    const expectedTotalVoiceCredits = sumVoiceCredits([
      contribution.voiceCredits,
      contribution2.voiceCredits,
    ])
    expect(tally.totalSpentVoiceCredits.spent).to.equal(
      expectedTotalVoiceCredits
    )

    const submittedVoiceCredits = [
      [contribution.voiceCredits, contribution2.voiceCredits],
    ]
    const expectedTally = tallyVotes(submittedVoiceCredits)
    expect(tally.results.tally[1]).to.equal('0')
    expect(BigInt(tally.results.tally[2])).to.equal(expectedTally[0])
    const expectedClaims = await calculateClaims(
      fundingRound,
      submittedVoiceCredits
    )
    expect(claims[1]).to.equal(ZERO)
    expect(claims[2]).to.equal(expectedClaims[0])
  })

  it('should overwrite previous batch of votes', async () => {
    const [contribution, contribution2] = await makeContributions([
      UNIT * BigInt(5),
      UNIT * BigInt(40),
    ])
    const contributor = contribution.signer
    const votes: VoteData[][] = [
      [
        makeVote(1, BigInt(contribution.voiceCredits) / BigInt(3)),
        makeVote(2, BigInt(contribution.voiceCredits) / BigInt(3)),
        makeVote(3, BigInt(contribution.voiceCredits) / BigInt(3)),
      ],
      [
        makeVote(1, BigInt(contribution.voiceCredits) / BigInt(2)),
        makeVote(2, BigInt(contribution.voiceCredits) / BigInt(2)),
        makeVote(3, ZERO),
      ],
    ]
    for (const batch of votes) {
      const messages: Message[] = []
      const encPubKeys: PubKey[] = []
      let nonce = 1
      for (const { recipientIndex, voiceCredits } of batch) {
        const [message, encPubKey] = createMessage(
          contribution.stateIndex,
          contribution.keypair,
          null,
          coordinatorKeypair.pubKey,
          recipientIndex,
          voiceCredits,
          nonce,
          pollId
        )
        nonce += 1
        messages.push(message)
        encPubKeys.push(encPubKey)
      }
      await (pollContract.connect(contributor) as Contract).publishMessageBatch(
        messages.reverse().map((msg) => msg.asContractParam()),
        encPubKeys.reverse().map((key) => key.asContractParam())
      )
    }

    // contribution 2
    const [message, encPubKey] = createMessage(
      contribution2.stateIndex,
      contribution2.keypair,
      null,
      coordinatorKeypair.pubKey,
      2,
      contribution2.voiceCredits,
      1,
      pollId
    )
    await (
      pollContract.connect(contribution2.signer) as Contract
    ).publishMessageBatch(
      [message.asContractParam()],
      [encPubKey.asContractParam()]
    )

    await time.increase(roundDuration)
    const { tally, claims } = await finalizeRound()
    const expectedTotalVoiceCredits = sumVoiceCredits([
      contribution.voiceCredits,
      contribution2.voiceCredits,
    ])
    expect(tally.totalSpentVoiceCredits.spent).to.equal(
      expectedTotalVoiceCredits
    )

    const voiceCredits1 = BigInt(contribution.voiceCredits) / BigInt(2)
    const submittedVoiceCredits = [
      [voiceCredits1],
      [voiceCredits1, contribution2.voiceCredits],
    ]
    const expectedTally = tallyVotes(submittedVoiceCredits)

    expect(BigInt(tally.results.tally[1])).to.equal(expectedTally[0])
    expect(BigInt(tally.results.tally[2])).to.equal(expectedTally[1])
    expect(tally.results.tally[3]).to.equal('0')

    const expectedClaims = await calculateClaims(
      fundingRound,
      submittedVoiceCredits
    )
    expect(claims[1]).to.equal(expectedClaims[0])
    expect(claims[2]).to.equal(expectedClaims[1])
  })

  it('should invalidate votes in case of bribe', async () => {
    const [contribution, contribution2] = await makeContributions([
      UNIT * BigInt(90),
      UNIT * BigInt(40),
    ])
    const contributor = contribution.signer
    let message
    let encPubKey

    // Vote for recipient 1 for a bribe immediately after signup
    const messageBatch1: Message[] = []
    const encPubKeyBatch1: PubKey[] = []
    ;[message, encPubKey] = createMessage(
      contribution.stateIndex,
      contribution.keypair,
      null,
      coordinatorKeypair.pubKey,
      1,
      contribution.voiceCredits,
      1,
      pollId
    )
    messageBatch1.push(message)
    encPubKeyBatch1.push(encPubKey)
    // Change key to invalid key
    ;[message, encPubKey] = createMessage(
      contribution.stateIndex,
      contribution.keypair,
      new Keypair(),
      coordinatorKeypair.pubKey,
      null,
      null,
      2,
      pollId
    )
    messageBatch1.push(message)
    encPubKeyBatch1.push(encPubKey)
    await (pollContract.connect(contributor) as Contract).publishMessageBatch(
      messageBatch1.reverse().map((msg) => msg.asContractParam()),
      encPubKeyBatch1.reverse().map((key) => key.asContractParam())
    )

    // override votes
    const messageBatch2: Message[] = []
    const encPubKeyBatch2: PubKey[] = []
    // Change key
    const newContributorKeypair = new Keypair()
    ;[message, encPubKey] = createMessage(
      contribution.stateIndex,
      contribution.keypair,
      newContributorKeypair,
      coordinatorKeypair.pubKey,
      null,
      null,
      1,
      pollId
    )
    messageBatch2.push(message)
    encPubKeyBatch2.push(encPubKey)
    // Vote for recipient 1
    ;[message, encPubKey] = createMessage(
      contribution.stateIndex,
      newContributorKeypair,
      null,
      coordinatorKeypair.pubKey,
      1,
      BigInt(0),
      2,
      pollId
    )
    messageBatch2.push(message)
    encPubKeyBatch2.push(encPubKey)
    // Vote for recipient 2
    ;[message, encPubKey] = createMessage(
      contribution.stateIndex,
      newContributorKeypair,
      null,
      coordinatorKeypair.pubKey,
      2,
      contribution.voiceCredits,
      3,
      pollId
    )
    messageBatch2.push(message)
    encPubKeyBatch2.push(encPubKey)
    await (pollContract.connect(contributor) as Contract).publishMessageBatch(
      messageBatch2.reverse().map((msg) => msg.asContractParam()),
      encPubKeyBatch2.reverse().map((key) => key.asContractParam())
    )

    // contribution 2
    ;[message, encPubKey] = createMessage(
      contribution2.stateIndex,
      contribution2.keypair,
      null,
      coordinatorKeypair.pubKey,
      2,
      contribution2.voiceCredits,
      1,
      pollId
    )
    await (
      pollContract.connect(contribution2.signer) as Contract
    ).publishMessageBatch(
      [message.asContractParam()],
      [encPubKey.asContractParam()]
    )

    await time.increase(roundDuration)
    const { tally, claims } = await finalizeRound()
    const expectedTotalVoiceCredits = sumVoiceCredits([
      contribution.voiceCredits,
      contribution2.voiceCredits,
    ])
    expect(tally.totalSpentVoiceCredits.spent).to.equal(
      expectedTotalVoiceCredits
    )
    expect(claims[1]).to.equal(BigInt(0))

    const expectedClaims = await calculateClaims(fundingRound, [
      [contribution.voiceCredits, contribution2.voiceCredits],
    ])
    expect(claims[2]).to.equal(expectedClaims[0])
  })

  it('should allow reset and re-run tally', async () => {
    const contributions = await makeContributions([
      (UNIT * BigInt(50)) / BigInt(10),
      (UNIT * BigInt(50)) / BigInt(10),
    ])
    // Submit messages
    for (const contribution of contributions) {
      const contributor = contribution.signer
      const messages: Message[] = []
      const encPubKeys: PubKey[] = []
      let nonce = 1

      // Spend voice credits on both recipients
      for (const recipientIndex of [1, 2]) {
        const voiceCredits = BigInt(contribution.voiceCredits) / BigInt(2)
        const [message, encPubKey] = createMessage(
          contribution.stateIndex,
          contribution.keypair,
          null,
          coordinatorKeypair.pubKey,
          recipientIndex,
          voiceCredits,
          nonce,
          pollId
        )
        messages.push(message)
        encPubKeys.push(encPubKey)
        nonce += 1
      }

      await (pollContract.connect(contributor) as Contract).publishMessageBatch(
        messages.reverse().map((msg) => msg.asContractParam()),
        encPubKeys.reverse().map((key) => key.asContractParam())
      )
    }

    await time.increase(roundDuration)
    const testResetTally = true
    const { tally, claims } = await finalizeRound(testResetTally)
    const expectedTotalVoiceCredits = sumVoiceCredits(
      contributions.map((x) => x.voiceCredits)
    )
    expect(tally.totalSpentVoiceCredits.spent).to.equal(
      expectedTotalVoiceCredits
    )
    const expectedClaims = await calculateClaims(
      fundingRound,
      new Array(2).fill(
        contributions.map((x) => BigInt(x.voiceCredits) / BigInt(2))
      )
    )
    console.log('expected claim', claims[1], expectedClaims[0])
    expect(claims[1]).to.equal(expectedClaims[0])
    expect(claims[2]).to.equal(expectedClaims[1])
  })
})
