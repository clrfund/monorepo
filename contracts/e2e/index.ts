/* eslint-disable @typescript-eslint/camelcase */
import { ethers, waffle } from 'hardhat'
import { use, expect } from 'chai'
import { solidity } from 'ethereum-waffle'
import { BigNumber, Contract, Signer, Wallet } from 'ethers'
import {
  Keypair,
  createMessage,
  Message,
  PubKey,
  hashLeftRight,
  hash2,
  hash3,
} from '@clrfund/common'
import { genTallyResultCommitment } from '@clrfund/common'

import { UNIT } from '../utils/constants'
import { getEventArg } from '../utils/contracts'
import {
  deployVkRegistry,
  deployMaciFactory,
  deployPollProcessorAndTallyer,
  mergeMessages,
  mergeSignups,
  genProofs,
  proveOnChain,
  deployPoseidonLibraries,
  deployContractWithLinkedLibraries,
} from '../utils/deployment'
import { getIpfsHash } from '../utils/ipfs'
import {
  bnSqrt,
  MaciParameters,
  addTallyResultsBatch,
  getRecipientClaimData,
  getCircuitFiles,
} from '../utils/maci'
import { unlink, readdir, readFileSync, existsSync, mkdirSync } from 'fs'
import path from 'path'

use(solidity)

const ZERO = BigNumber.from(0)
const DEFAULT_SR_QUEUE_OPS = 4
const roundDuration = 7 * 86400

// MACI zkFiles
const circuit = process.env.CIRCUIT_TYPE || 'micro'
const circuitDirectory = process.env.CIRCUIT_DIRECTORY || '../../params'
const rapidSnarkDirectory =
  process.env.RAPIDSNARK_DIRECTORY || '../../rapidsnark/build'
const rapidSnarkExe = path.join(rapidSnarkDirectory, 'prover')
const { processZkFile, tallyZkFile, processWitness, tallyWitness } =
  getCircuitFiles(circuit, circuitDirectory)
let maciTransactionHash: string
let alpha: bigint
let voiceCreditFactor: bigint
const ALPHA_PRECISION = BigNumber.from(10).pow(18)

const timeMs = new Date().getTime()
const outputDir = path.join('.', 'tally_output', `${timeMs}`)
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true })
}
const tallyFile = path.join(outputDir, `tally.json`)
const sbSaltFile = path.join(outputDir, `tally_0.json`)
const maciStateFile = path.join(outputDir, `macistate_${timeMs}`)

const currentBlockTimestamp = async (provider: any): Promise<number> => {
  const blockNum = await provider.getBlockNumber()
  const block = await provider.getBlock(blockNum)
  return Number(block.timestamp)
}

function sumVoiceCredits(voiceCredits: BigNumber[]): string {
  const total = voiceCredits.reduce(
    (sum, credits) => sum.add(credits),
    BigNumber.from(0)
  )
  return total.toString()
}

/*
 * tally up votes received by each recipient
 * recipientsVotes[i][j] is the jth vote received by recipient i
 * returns the tally result for each recipient
 */
function tallyVotes(recipientsVotes: BigNumber[][]): BigNumber[] {
  const result = recipientsVotes.map((votes) => {
    return votes.reduce(
      (sum, voiceCredits) => sum.add(bnSqrt(voiceCredits)),
      BigNumber.from(0)
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
  votes: BigNumber[][]
): Promise<BigNumber[]> {
  const alpha = await fundingRound.alpha()
  const factor = await fundingRound.voiceCreditFactor()
  const tallyResult = tallyVotes(votes)
  return tallyResult.map((quadraticVotes, i) => {
    const spent = sumVoiceCredits(votes[i])
    const quadratic = quadraticVotes.mul(quadraticVotes).mul(factor).mul(alpha)
    const linear = BigNumber.from(spent)
      .mul(factor)
      .mul(ALPHA_PRECISION.sub(alpha))
    return quadratic.add(linear).div(ALPHA_PRECISION)
  })
}

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
  let pollId: bigint
  let coordinatorKeypair: Keypair
  let params: MaciParameters

  before(async () => {
    params = await MaciParameters.fromConfig(circuit, circuitDirectory)
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
    const poseidonLibraries = await deployPoseidonLibraries(deployer)
    const maciFactory = await deployMaciFactory(deployer, poseidonLibraries)
    const setMaciTx = await maciFactory.setMaciParameters(
      ...params.asContractParam()
    )
    await setMaciTx.wait()

    fundingRoundFactory = await deployContractWithLinkedLibraries(
      deployer,
      'ClrFund',
      poseidonLibraries
    )
    const initClrfundTx = await fundingRoundFactory.init(maciFactory.address)
    await initClrfundTx.wait()
    const transferTx = await maciFactory.transferOwnership(
      fundingRoundFactory.address
    )
    await transferTx.wait()

    const SimpleUserRegistry = await ethers.getContractFactory(
      'SimpleUserRegistry',
      deployer
    )
    userRegistry = await SimpleUserRegistry.deploy()
    await fundingRoundFactory.setUserRegistry(userRegistry.address)
    const SimpleRecipientRegistry = await ethers.getContractFactory(
      'SimpleRecipientRegistry',
      deployer
    )
    recipientRegistry = await SimpleRecipientRegistry.deploy(
      fundingRoundFactory.address
    )
    await fundingRoundFactory.setRecipientRegistry(recipientRegistry.address)

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
      coordinatorKeypair.pubKey.asContractParam()
    )

    // Add funds to matching pool
    const poolContributionAmount = UNIT.mul(5)
    await token
      .connect(poolContributor1)
      .transfer(fundingRoundFactory.address, poolContributionAmount)

    // Add additional funding source
    await fundingRoundFactory.addFundingSource(
      await poolContributor2.getAddress()
    )
    await token
      .connect(poolContributor2)
      .approve(fundingRoundFactory.address, poolContributionAmount)

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

    await deployVkRegistry(deployer, maciFactory.address, params)

    // Deploy new funding round and MACI
    const newRoundTx = await fundingRoundFactory.deployNewRound(roundDuration)
    maciTransactionHash = newRoundTx.hash
    const fundingRoundAddress = await fundingRoundFactory.getCurrentRound()
    fundingRound = await ethers.getContractAt(
      'FundingRound',
      fundingRoundAddress
    )
    const maciAddress = await fundingRound.maci()
    maci = await ethers.getContractAt('MACI', maciAddress)

    pollId = BigInt(await fundingRound.pollId())
  })

  afterEach(() => {
    // clean up tally and proof files after each test
    // so that next test has a clean directory to start with
    readdir(outputDir, (err, files) => {
      if (err) throw err

      for (const file of files) {
        unlink(path.join(outputDir, file), (err) => {
          if (err) throw err
        })
      }
    })
  })

  async function timeTravel(duration: number) {
    const currentTime = await currentBlockTimestamp(provider)
    await provider.send('evm_increaseTime', [duration + currentTime])
    await provider.send('evm_mine')
  }

  async function makeContributions(amounts: BigNumber[]) {
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
      await token
        .connect(contributor)
        .approve(fundingRound.address, contributionAmount)
      // Contribute
      const contributorKeypair = new Keypair()
      const contributionTx = await fundingRound
        .connect(contributor)
        .contribute(
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
        stateIndex: parseInt(stateIndex),
        contribution: contributionAmount,
        voiceCredits: voiceCredits,
      })
    }
    return contributions
  }

  async function finalizeRound(): Promise<any> {
    const providerUrl = (provider as any)._hardhatNetwork.config.url

    // Process messages and tally votes
    const mergeMessagesResult = await mergeMessages({
      contract: maci.address,
      poll_id: pollId.toString(),
      num_queue_ops: DEFAULT_SR_QUEUE_OPS,
    })

    if (mergeMessagesResult !== 0) {
      throw new Error('Merge messages failed')
    }

    const mergeSignupsResult = await mergeSignups({
      contract: maci.address,
      poll_id: pollId.toString(),
      num_queue_ops: DEFAULT_SR_QUEUE_OPS,
    })

    if (mergeSignupsResult !== 0) {
      throw new Error('Merge signups failed')
    }

    const genProofArgs = {
      contract: maci.address,
      eth_provider: providerUrl,
      poll_id: pollId.toString(),
      tally_file: tallyFile,
      rapidsnark: rapidSnarkExe,
      process_witnessgen: processWitness,
      tally_witnessgen: tallyWitness,
      process_zkey: processZkFile,
      tally_zkey: tallyZkFile,
      transaction_hash: maciTransactionHash,
      output: outputDir,
      privkey: coordinatorKeypair.privKey.serialize(),
      macistate: maciStateFile,
    }

    const genProofResult = await genProofs(genProofArgs)
    if (genProofResult !== 0) {
      throw new Error('generation of proofs failed')
    }

    // deploy pollProcessorAndTallyer
    const ppt = await deployPollProcessorAndTallyer(coordinator, fundingRound)

    // Submit proofs to MACI contract
    await proveOnChain({
      contract: maci.address,
      poll_id: pollId.toString(),
      ppt: ppt.address,
      eth_privkey: coordinator.privateKey,
      eth_provider: providerUrl,
      privkey: coordinatorKeypair.privKey.serialize(),
      proof_dir: outputDir,
    })

    const tally = JSON.parse(readFileSync(tallyFile).toString())
    const tallyHash = await getIpfsHash(tally)
    await fundingRound.connect(coordinator).publishTallyHash(tallyHash)

    // add tally results to funding round
    const batchSize = Number(process.env.TALLY_BATCH_SIZE) || 20
    const recipientTreeDepth = params.voteOptionTreeDepth
    await addTallyResultsBatch(
      fundingRound.connect(coordinator),
      recipientTreeDepth,
      tally,
      batchSize
    )

    const newResultCommitment = genTallyResultCommitment(
      tally.results.tally.map((x) => BigInt(x)),
      tally.results.salt,
      recipientTreeDepth
    )

    const perVOSpentVoiceCreditsCommitment = genTallyResultCommitment(
      tally.perVOSpentVoiceCredits.tally.map((x) => BigInt(x)),
      tally.perVOSpentVoiceCredits.salt,
      recipientTreeDepth
    )

    // Finalize round
    await fundingRoundFactory.transferMatchingFunds(
      tally.totalSpentVoiceCredits.spent,
      tally.totalSpentVoiceCredits.salt,
      newResultCommitment.toString(),
      perVOSpentVoiceCreditsCommitment.toString()
    )

    // Claim funds
    const claims: { [index: number]: BigNumber } = {}
    for (const recipientIndex of [1, 2]) {
      const recipient = recipientIndex === 1 ? recipient1 : recipient2

      const claimData = getRecipientClaimData(
        recipientIndex,
        recipientTreeDepth,
        tally
      )
      const claimTx = await fundingRound
        .connect(recipient)
        .claimFunds(...claimData)
      const claimedAmount = await getEventArg(
        claimTx,
        fundingRound,
        'FundsClaimed',
        '_amount'
      )
      claims[recipientIndex] = claimedAmount
    }
    return { tally, claims }
  }

  it('should allocate funds correctly when users change keys', async () => {
    const contributions = await makeContributions([
      UNIT.mul(50).div(10),
      UNIT.mul(50).div(10),
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
        const voiceCredits = contribution.voiceCredits.div(2)
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

      await fundingRound.connect(contributor).submitMessageBatch(
        messages.reverse().map((msg) => msg.asContractParam()),
        encPubKeys.reverse().map((key) => key.asContractParam())
      )
    }

    await timeTravel(roundDuration)
    const { tally, claims } = await finalizeRound()
    const expectedTotalVoiceCredits = sumVoiceCredits(
      contributions.map((x) => x.voiceCredits)
    )
    expect(tally.totalSpentVoiceCredits.spent).to.equal(
      expectedTotalVoiceCredits
    )
    const expectedClaims = await calculateClaims(
      fundingRound,
      new Array(2).fill(contributions.map((x) => x.voiceCredits.div(2)))
    )
    expect(claims[1]).to.equal(expectedClaims[0])
    expect(claims[2]).to.equal(expectedClaims[1])
  })

  it('should allocate funds correctly if not all voice credits are spent', async () => {
    const contributions = await makeContributions([
      UNIT.mul(36).div(10),
      UNIT.mul(36).div(10),
    ])

    // 2 contirbutors, divide their contributions into 4 parts, only contribute 2 parts to 2 projects
    for (const contribution of contributions) {
      const contributor = contribution.signer
      const voiceCredits = contribution.voiceCredits.div(4)
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
      await fundingRound.connect(contributor).submitMessageBatch(
        messages.reverse().map((msg) => msg.asContractParam()),
        encPubKeys.reverse().map((key) => key.asContractParam())
      )
    }

    await timeTravel(roundDuration)
    const { tally, claims } = await finalizeRound()
    const expectedTotalVoiceCredits = sumVoiceCredits(
      contributions.map((x) => x.voiceCredits.div(2))
    )
    expect(tally.totalSpentVoiceCredits.spent).to.equal(
      expectedTotalVoiceCredits
    )

    const expectedClaims = await calculateClaims(
      fundingRound,
      new Array(2).fill(contributions.map((x) => x.voiceCredits.div(4)))
    )
    expect(claims[1]).to.equal(expectedClaims[0])
    expect(claims[2]).to.equal(expectedClaims[1])
  })

  it('should overwrite votes 1', async () => {
    const [contribution, contribution2] = await makeContributions([
      UNIT.mul(5),
      UNIT.mul(90),
    ])
    const contributor = contribution.signer
    const votes = [
      [1, contribution.voiceCredits.div(6)],
      [2, contribution.voiceCredits.div(2)],
      [1, contribution.voiceCredits.div(2)],
    ]
    const messages: Message[] = []
    const encPubKeys: PubKey[] = []
    let nonce = 1
    for (const [recipientIndex, voiceCredits] of votes) {
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
    await fundingRound.connect(contributor).submitMessageBatch(
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
    await fundingRound
      .connect(contribution2.signer)
      .submitMessageBatch(
        [message.asContractParam()],
        [encPubKey.asContractParam()]
      )

    await timeTravel(roundDuration)
    const { tally, claims } = await finalizeRound()
    const expectedTotalVoiceCredits = sumVoiceCredits([
      contribution.voiceCredits,
      contribution2.voiceCredits,
    ])
    expect(tally.totalSpentVoiceCredits.spent).to.equal(
      expectedTotalVoiceCredits
    )

    const voiceCredits1 = contribution.voiceCredits.div(2)
    const submittedVoiceCredits = [
      [voiceCredits1],
      [voiceCredits1, contribution2.voiceCredits],
    ]
    const expectedTally = tallyVotes(submittedVoiceCredits)
    expect(tally.results.tally[1]).to.equal(expectedTally[0])
    expect(tally.results.tally[2]).to.equal(expectedTally[1])
    const expectedClaims = await calculateClaims(
      fundingRound,
      submittedVoiceCredits
    )
    expect(claims[1]).to.equal(expectedClaims[0])
    expect(claims[2]).to.equal(expectedClaims[1])
  })

  it('should overwrite votes 2', async () => {
    const [contribution, contribution2] = await makeContributions([
      UNIT.mul(90),
      UNIT.mul(40),
    ])
    const contributor = contribution.signer
    const votes = [
      [1, contribution.voiceCredits.div(2)],
      [2, contribution.voiceCredits.div(2)],
      [1, ZERO],
      [2, contribution.voiceCredits],
    ]
    const messages: Message[] = []
    const encPubKeys: PubKey[] = []
    let nonce = 1
    for (const [recipientIndex, voiceCredits] of votes) {
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
    await fundingRound.connect(contributor).submitMessageBatch(
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
    await fundingRound
      .connect(contribution2.signer)
      .submitMessageBatch(
        [message.asContractParam()],
        [encPubKey.asContractParam()]
      )

    await timeTravel(roundDuration)
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
    expect(tally.results.tally[2]).to.equal(expectedTally[0])
    const expectedClaims = await calculateClaims(
      fundingRound,
      submittedVoiceCredits
    )
    expect(claims[1]).to.equal(ZERO)
    expect(claims[2]).to.equal(expectedClaims[0])
  })

  it('should overwrite previous batch of votes', async () => {
    const [contribution, contribution2] = await makeContributions([
      UNIT.mul(5),
      UNIT.mul(40),
    ])
    const contributor = contribution.signer
    const votes = [
      [
        [1, contribution.voiceCredits.div(3)],
        [2, contribution.voiceCredits.div(3)],
        [3, contribution.voiceCredits.div(3)],
      ],
      [
        [1, contribution.voiceCredits.div(2)],
        [2, contribution.voiceCredits.div(2)],
        [3, ZERO],
      ],
    ]
    for (const batch of votes) {
      const messages: Message[] = []
      const encPubKeys: PubKey[] = []
      let nonce = 1
      for (const [recipientIndex, voiceCredits] of batch) {
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
      await fundingRound.connect(contributor).submitMessageBatch(
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
    await fundingRound
      .connect(contribution2.signer)
      .submitMessageBatch(
        [message.asContractParam()],
        [encPubKey.asContractParam()]
      )

    await timeTravel(roundDuration)
    const { tally, claims } = await finalizeRound()
    const expectedTotalVoiceCredits = sumVoiceCredits([
      contribution.voiceCredits,
      contribution2.voiceCredits,
    ])
    expect(tally.totalSpentVoiceCredits.spent).to.equal(
      expectedTotalVoiceCredits
    )

    const voiceCredits1 = contribution.voiceCredits.div(2)
    const submittedVoiceCredits = [
      [voiceCredits1],
      [voiceCredits1, contribution2.voiceCredits],
    ]
    const expectedTally = tallyVotes(submittedVoiceCredits)

    expect(tally.results.tally[1]).to.equal(expectedTally[0])
    expect(tally.results.tally[2]).to.equal(expectedTally[1])
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
      UNIT.mul(90),
      UNIT.mul(40),
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
    await fundingRound.connect(contributor).submitMessageBatch(
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
      BigNumber.from(0),
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
    await fundingRound.connect(contributor).submitMessageBatch(
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
    await fundingRound
      .connect(contribution2.signer)
      .submitMessageBatch(
        [message.asContractParam()],
        [encPubKey.asContractParam()]
      )

    await timeTravel(roundDuration)
    const { tally, claims } = await finalizeRound()
    const expectedTotalVoiceCredits = sumVoiceCredits([
      contribution.voiceCredits,
      contribution2.voiceCredits,
    ])
    expect(tally.totalSpentVoiceCredits.spent).to.equal(
      expectedTotalVoiceCredits
    )
    expect(claims[1]).to.equal(BigNumber.from(0))

    const expectedClaims = await calculateClaims(fundingRound, [
      [contribution.voiceCredits, contribution2.voiceCredits],
    ])
    expect(claims[2]).to.equal(expectedClaims[0])
  })
})
