import { ethers } from 'hardhat'
import { expect } from 'chai'
import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers'
import { MockContract } from '@clrfund/waffle-mock-contract'
import {
  Contract,
  AbiCoder,
  parseEther,
  sha256,
  randomBytes,
  hexlify,
  toNumber,
} from 'ethers'
import { genRandomSalt } from 'maci-crypto'
import { Keypair } from '@clrfund/common'
import { time } from '@nomicfoundation/hardhat-network-helpers'

import {
  ZERO_ADDRESS,
  UNIT,
  VOICE_CREDIT_FACTOR,
  ALPHA_PRECISION,
} from '../utils/constants'
import { getEventArg, getGasUsage } from '../utils/contracts'
import {
  bnSqrt,
  createMessage,
  addTallyResultsBatch,
  getRecipientClaimData,
  mergeMaciSubtrees,
} from '../utils/maci'
import { deployTestFundingRound } from '../utils/testutils'

// ethStaker test vectors for Quadratic Funding with alpha
import smallTallyTestData from './data/testTallySmall.json'
import { FundingRound } from '../typechain-types'

const newResultCommitment = hexlify(randomBytes(32))
const perVOSpentVoiceCreditsHash = hexlify(randomBytes(32))
const totalSpent = BigInt(smallTallyTestData.totalSpentVoiceCredits.spent)
const budget = BigInt(totalSpent) * VOICE_CREDIT_FACTOR * 2n
const totalQuadraticVotes = smallTallyTestData.results.tally.reduce(
  (total, tally) => {
    return BigInt(tally) ** 2n + total
  },
  BigInt(0)
)
const matchingPoolSize = budget - totalSpent * VOICE_CREDIT_FACTOR

const expectedAlpha =
  (matchingPoolSize * ALPHA_PRECISION) /
  (totalQuadraticVotes - totalSpent) /
  VOICE_CREDIT_FACTOR

const abiCoder = new AbiCoder()

function calcAllocationAmount(tally: string, voiceCredit: string): bigint {
  const quadratic = expectedAlpha * VOICE_CREDIT_FACTOR * BigInt(tally) ** 2n

  const linear =
    (ALPHA_PRECISION - expectedAlpha) *
    (VOICE_CREDIT_FACTOR * BigInt(voiceCredit))

  const allocation = quadratic + linear
  return allocation / ALPHA_PRECISION
}

describe('Funding Round', () => {
  const coordinatorPubKey = new Keypair().pubKey
  const roundDuration = 86400 * 7
  const userKeypair = new Keypair()
  const userPubKey = userKeypair.pubKey.asContractParam()
  const contributionAmount = UNIT * BigInt(10)
  const tallyHash = 'test'

  let tallyTreeDepth: number
  let token: Contract
  let tokenAsContributor: Contract
  let userRegistry: MockContract
  let recipientRegistry: MockContract
  let tally: MockContract
  let fundingRound: Contract
  let fundingRoundAsCoordinator: FundingRound
  let fundingRoundAsContributor: FundingRound
  let maci: Contract
  let maciAddress: string
  let poll: Contract
  let pollId: bigint

  let deployer: HardhatEthersSigner
  let coordinator: HardhatEthersSigner
  let contributor: HardhatEthersSigner
  let anotherContributor: HardhatEthersSigner
  let recipient: HardhatEthersSigner

  before(async () => {
    ;[, deployer, coordinator, contributor, anotherContributor, recipient] =
      await ethers.getSigners()
  })

  beforeEach(async () => {
    const tokenInitialSupply = UNIT * BigInt(1000000)
    const deployed = await deployTestFundingRound(
      tokenInitialSupply + budget,
      coordinator.address,
      coordinatorPubKey,
      roundDuration,
      deployer
    )
    token = deployed.token
    fundingRound = deployed.fundingRound
    userRegistry = deployed.mockUserRegistry
    recipientRegistry = deployed.mockRecipientRegistry
    tally = deployed.mockTally
    const mockVerifier = deployed.mockVerifier

    // make the verifier to alwasy returns true
    await mockVerifier.mock.verify.returns(true)
    await userRegistry.mock.isVerifiedUser.returns(true)
    await tally.mock.tallyBatchNum.returns(1)
    await tally.mock.verifyTallyResult.returns(true)
    await tally.mock.verifySpentVoiceCredits.returns(true)

    tokenAsContributor = token.connect(contributor) as Contract
    fundingRoundAsCoordinator = fundingRound.connect(
      coordinator
    ) as FundingRound
    fundingRoundAsContributor = fundingRound.connect(
      contributor
    ) as FundingRound

    await token.transfer(contributor.address, tokenInitialSupply / 4n)
    await token.transfer(anotherContributor.address, tokenInitialSupply / 4n)
    await token.transfer(coordinator.address, tokenInitialSupply / 4n)

    maciAddress = await fundingRound.maci()
    maci = await ethers.getContractAt('MACI', maciAddress)
    const pollAddress = await fundingRound.poll()
    poll = await ethers.getContractAt('Poll', pollAddress, deployer)
    pollId = await fundingRound.pollId()

    const treeDepths = await poll.treeDepths()
    tallyTreeDepth = toNumber(treeDepths.voteOptionTreeDepth)
  })

  it('initializes funding round correctly', async () => {
    expect(await fundingRound.owner()).to.equal(deployer.address)
    expect(await fundingRound.nativeToken()).to.equal(token.target)
    expect(await fundingRound.voiceCreditFactor()).to.equal(VOICE_CREDIT_FACTOR)
    expect(await fundingRound.matchingPoolSize()).to.equal(0)
    expect(await fundingRound.totalSpent()).to.equal(0)
    expect(await fundingRound.userRegistry()).to.equal(userRegistry.target)
    expect(await fundingRound.recipientRegistry()).to.equal(
      recipientRegistry.target
    )
    expect(await fundingRound.isFinalized()).to.equal(false)
    expect(await fundingRound.isCancelled()).to.equal(false)
    expect(await fundingRound.coordinator()).to.equal(coordinator.address)
    expect(await fundingRound.maci()).to.be.properAddress
  })

  describe('accepting contributions', () => {
    let encodedContributorAddress: string

    let fundingRoundAsContributor: Contract

    beforeEach(async () => {
      tokenAsContributor = token.connect(contributor) as Contract
      fundingRoundAsContributor = fundingRound.connect(contributor) as Contract
      encodedContributorAddress = abiCoder.encode(
        ['address'],
        [contributor.address]
      )
    })

    it('accepts contributions from everyone', async () => {
      await tokenAsContributor.approve(fundingRound.target, contributionAmount)
      const expectedVoiceCredits = contributionAmount / VOICE_CREDIT_FACTOR
      await expect(
        fundingRoundAsContributor.contribute(userPubKey, contributionAmount)
      )
        .to.emit(fundingRound, 'Contribution')
        .withArgs(contributor.address, contributionAmount)
        .to.emit(maci, 'SignUp')
      // We use [] to skip argument matching, otherwise it will fail
      // Possibly related: https://github.com/EthWorks/Waffle/issues/245
      //.withArgs([], 1, expectedVoiceCredits)

      expect(await token.balanceOf(fundingRound.target)).to.equal(
        contributionAmount
      )

      expect(await fundingRound.contributorCount()).to.equal(1)
      expect(
        await fundingRound.getVoiceCredits(
          fundingRound.target,
          encodedContributorAddress
        )
      ).to.equal(expectedVoiceCredits)
    })

    it('limits the number of contributors', async () => {
      // TODO: add test later
    })

    it('rejects contributions if funding round has been finalized', async () => {
      await fundingRound.cancel()
      await tokenAsContributor.approve(fundingRound.target, contributionAmount)
      await expect(
        fundingRoundAsContributor.contribute(userPubKey, contributionAmount)
      ).to.be.revertedWithCustomError(fundingRound, 'RoundAlreadyFinalized')
    })

    it('rejects contributions with zero amount', async () => {
      await tokenAsContributor.approve(fundingRound.target, contributionAmount)
      await expect(
        fundingRoundAsContributor.contribute(userPubKey, 0)
      ).to.be.revertedWithCustomError(fundingRound, 'ContributionAmountIsZero')
    })

    it('rejects contributions that are too large', async () => {
      const contributionAmount = UNIT * BigInt(10001)
      await tokenAsContributor.approve(fundingRound.target, contributionAmount)
      await expect(
        fundingRoundAsContributor.contribute(userPubKey, contributionAmount)
      ).to.be.revertedWithCustomError(
        fundingRound,
        'ContributionAmountTooLarge'
      )
    })

    it('allows to contribute only once per round', async () => {
      await tokenAsContributor.approve(
        fundingRound.target,
        contributionAmount * BigInt(2)
      )
      await fundingRoundAsContributor.contribute(userPubKey, contributionAmount)
      await expect(
        fundingRoundAsContributor.contribute(userPubKey, contributionAmount)
      ).to.be.revertedWithCustomError(fundingRound, 'AlreadyContributed')
    })

    it('requires approval', async () => {
      await expect(
        fundingRoundAsContributor.contribute(userPubKey, contributionAmount)
      ).to.be.revertedWith('ERC20: insufficient allowance')
    })

    it('rejects contributions from unverified users', async () => {
      await tokenAsContributor.approve(fundingRound.target, contributionAmount)
      await userRegistry.mock.isVerifiedUser.returns(false)
      await expect(
        fundingRoundAsContributor.contribute(userPubKey, contributionAmount)
      ).to.be.revertedWithCustomError(fundingRound, 'UserNotVerified')
    })

    it('should not allow users who have not contributed to sign up directly in MACI', async () => {
      const signUpData = abiCoder.encode(['address'], [contributor.address])
      await expect(
        maci.signUp(userPubKey, signUpData, encodedContributorAddress)
      ).to.be.revertedWithCustomError(fundingRound, 'UserHasNotContributed')
    })

    it('should not allow users who have already signed up to sign up directly in MACI', async () => {
      await tokenAsContributor.approve(fundingRound.target, contributionAmount)
      await fundingRoundAsContributor.contribute(userPubKey, contributionAmount)
      const signUpData = abiCoder.encode(['address'], [contributor.address])
      await expect(
        maci.signUp(userPubKey, signUpData, encodedContributorAddress)
      ).to.be.revertedWithCustomError(fundingRound, 'UserAlreadyRegistered')
    })

    it('should not return the amount of voice credits for user who has not contributed', async () => {
      await expect(
        fundingRound.getVoiceCredits(
          fundingRound.target,
          encodedContributorAddress
        )
      ).to.be.revertedWithCustomError(fundingRound, 'NoVoiceCredits')
    })
  })

  describe('voting', () => {
    const singleVote = UNIT * BigInt(4)
    let fundingRoundAsContributor: Contract
    let userStateIndex: number
    let recipientIndex = 1
    let nonce = 1

    beforeEach(async () => {
      const tokenAsContributor = token.connect(contributor) as Contract
      await tokenAsContributor.approve(fundingRound.target, contributionAmount)
      fundingRoundAsContributor = fundingRound.connect(contributor) as Contract
      const contributionTx = await fundingRoundAsContributor.contribute(
        userKeypair.pubKey.asContractParam(),
        contributionAmount
      )
      userStateIndex = await getEventArg(
        contributionTx,
        maci,
        'SignUp',
        '_stateIndex'
      )
    })

    it('submits a vote', async () => {
      const [message, encPubKey] = createMessage(
        userStateIndex,
        userKeypair,
        null,
        coordinatorPubKey,
        recipientIndex,
        singleVote,
        nonce,
        pollId
      )
      const messagePublished = poll.publishMessage(
        message.asContractParam(),
        encPubKey.asContractParam()
      )
      await expect(messagePublished).to.emit(poll, 'PublishMessage')
      const publishTx = await messagePublished
      expect(await getGasUsage(publishTx)).lessThan(2135000)
    })

    it('submits a key-changing message', async () => {
      const newUserKeypair = new Keypair()
      const [message, encPubKey] = createMessage(
        userStateIndex,
        userKeypair,
        newUserKeypair,
        coordinatorPubKey,
        null,
        null,
        nonce,
        pollId
      )
      await poll.publishMessage(
        message.asContractParam(),
        encPubKey.asContractParam()
      )
    })

    it('use a seed to generate new key and submit change change message', async () => {
      const signature = await contributor.signMessage('hello world')
      const hash = sha256(signature)
      const newUserKeypair = Keypair.createFromSeed(hash)
      const [message, encPubKey] = createMessage(
        userStateIndex,
        userKeypair,
        newUserKeypair,
        coordinatorPubKey,
        null,
        null,
        nonce,
        pollId
      )
      await poll.publishMessage(
        message.asContractParam(),
        encPubKey.asContractParam()
      )
    })

    it('submits an invalid vote', async () => {
      const newUserKeypair = new Keypair()
      const [message1, encPubKey1] = createMessage(
        userStateIndex,
        userKeypair,
        newUserKeypair,
        coordinatorPubKey,
        null,
        null,
        nonce,
        pollId
      )
      await poll.publishMessage(
        message1.asContractParam(),
        encPubKey1.asContractParam()
      )
      const [message2, encPubKey2] = createMessage(
        userStateIndex,
        userKeypair,
        null,
        coordinatorPubKey,
        recipientIndex,
        singleVote,
        nonce + 1,
        pollId
      )
      await poll.publishMessage(
        message2.asContractParam(),
        encPubKey2.asContractParam()
      )
    })

    it('submits a vote for invalid vote option', async () => {
      recipientIndex = 999
      const [message, encPubKey] = createMessage(
        userStateIndex,
        userKeypair,
        null,
        coordinatorPubKey,
        recipientIndex,
        singleVote,
        nonce,
        pollId
      )
      await poll.publishMessage(
        message.asContractParam(),
        encPubKey.asContractParam()
      )
    })

    it('submits a batch of messages', async () => {
      const messages = []
      const encPubKeys = []
      const numMessages = 3
      for (
        let recipientIndex = 1;
        recipientIndex < numMessages + 1;
        recipientIndex++
      ) {
        nonce = recipientIndex
        const [message, encPubKey] = createMessage(
          userStateIndex,
          userKeypair,
          null,
          coordinatorPubKey,
          recipientIndex,
          singleVote,
          nonce,
          pollId
        )
        messages.push(message.asContractParam())
        encPubKeys.push(encPubKey.asContractParam())
      }
      const messageBatchSubmitted = await poll.publishMessageBatch(
        messages,
        encPubKeys
      )
      expect(await getGasUsage(messageBatchSubmitted)).lessThan(4900000)
    }).timeout(100000)
  })

  describe('publishing tally hash', () => {
    it('allows coordinator to publish vote tally hash', async () => {
      await expect(fundingRoundAsCoordinator.publishTallyHash(tallyHash))
        .to.emit(fundingRound, 'TallyPublished')
        .withArgs(tallyHash)
      expect(await fundingRound.tallyHash()).to.equal(tallyHash)

      // Should be possible to re-publish
      await expect(fundingRoundAsCoordinator.publishTallyHash('fixed')).to.emit(
        fundingRound,
        'TallyPublished'
      )
    })

    it('allows only coordinator to publish tally hash', async () => {
      await expect(
        fundingRound.publishTallyHash(tallyHash)
      ).to.be.revertedWithCustomError(fundingRound, 'NotCoordinator')
    })

    it('reverts if round has been finalized', async () => {
      await fundingRound.cancel()
      await expect(
        fundingRoundAsCoordinator.publishTallyHash(tallyHash)
      ).to.be.revertedWithCustomError(fundingRound, 'RoundAlreadyFinalized')
    })

    it('rejects empty string', async () => {
      await expect(
        fundingRoundAsCoordinator.publishTallyHash('')
      ).to.be.revertedWithCustomError(fundingRound, 'EmptyTallyHash')
    })
  })

  describe('finalizing round', () => {
    const matchingPoolSize = UNIT * BigInt(10000)
    const totalContributions = UNIT * BigInt(1000)
    const totalSpent = totalContributions / VOICE_CREDIT_FACTOR
    const totalSpentSalt = genRandomSalt().toString()
    const totalVotes = bnSqrt(totalSpent)
    expect(totalVotes).to.equal(BigInt(10000))

    beforeEach(async () => {
      await (token.connect(contributor) as Contract).approve(
        fundingRound.target,
        totalContributions
      )
    })

    it('allows owner to finalize round', async () => {
      await (fundingRound.connect(contributor) as Contract).contribute(
        userKeypair.pubKey.asContractParam(),
        totalContributions
      )
      await time.increase(roundDuration)

      await mergeMaciSubtrees({ maciAddress, pollId, signer: deployer })
      await fundingRoundAsCoordinator.publishTallyHash(tallyHash)
      await token.transfer(fundingRound.target, matchingPoolSize)

      await addTallyResultsBatch(
        fundingRoundAsCoordinator,
        tallyTreeDepth,
        smallTallyTestData,
        5
      )
      await fundingRound.finalize(
        totalSpent,
        totalSpentSalt,
        newResultCommitment,
        perVOSpentVoiceCreditsHash
      )
      expect(await fundingRound.isFinalized()).to.equal(true)
      expect(await fundingRound.isCancelled()).to.equal(false)
      expect(await fundingRound.totalSpent()).to.equal(totalSpent)
      expect(await fundingRound.matchingPoolSize()).to.equal(matchingPoolSize)
    })

    it('allows owner to finalize round when matching pool is empty', async () => {
      await (fundingRound.connect(contributor) as Contract).contribute(
        userKeypair.pubKey.asContractParam(),
        totalContributions
      )
      await time.increase(roundDuration)
      await mergeMaciSubtrees({ maciAddress, pollId, signer: deployer })
      await fundingRoundAsCoordinator.publishTallyHash(tallyHash)

      await addTallyResultsBatch(
        fundingRoundAsCoordinator,
        tallyTreeDepth,
        smallTallyTestData,
        5
      )
      await fundingRound.finalize(
        totalSpent,
        totalSpentSalt,
        newResultCommitment,
        perVOSpentVoiceCreditsHash
      )
      expect(await fundingRound.totalSpent()).to.equal(totalSpent)
      expect(await fundingRound.matchingPoolSize()).to.equal(0)
    })

    it('counts direct token transfers to funding round as matching pool contributions', async () => {
      await (fundingRound.connect(contributor) as Contract).contribute(
        userKeypair.pubKey.asContractParam(),
        totalContributions
      )
      await time.increase(roundDuration)
      await mergeMaciSubtrees({ maciAddress, pollId, signer: deployer })
      await fundingRoundAsCoordinator.publishTallyHash(tallyHash)
      await token.transfer(fundingRound.target, matchingPoolSize)
      await (token.connect(contributor) as Contract).transfer(
        fundingRound.target,
        contributionAmount
      )

      await addTallyResultsBatch(
        fundingRoundAsCoordinator,
        tallyTreeDepth,
        smallTallyTestData,
        5
      )
      await fundingRound.finalize(
        totalSpent,
        totalSpentSalt,
        newResultCommitment,
        perVOSpentVoiceCreditsHash
      )
      expect(await fundingRound.matchingPoolSize()).to.equal(
        matchingPoolSize + contributionAmount
      )
    })

    it('reverts if round has been finalized already', async () => {
      await (fundingRound.connect(contributor) as Contract).contribute(
        userKeypair.pubKey.asContractParam(),
        totalContributions
      )
      await time.increase(roundDuration)

      await mergeMaciSubtrees({ maciAddress, pollId, signer: deployer })
      await fundingRoundAsCoordinator.publishTallyHash(tallyHash)
      await token.transfer(fundingRound.target, matchingPoolSize)
      await addTallyResultsBatch(
        fundingRoundAsCoordinator,
        tallyTreeDepth,
        smallTallyTestData,
        5
      )

      await fundingRound.finalize(
        totalSpent,
        totalSpentSalt,
        newResultCommitment,
        perVOSpentVoiceCreditsHash
      )
      await expect(
        fundingRound.finalize(
          totalSpent,
          totalSpentSalt,
          newResultCommitment,
          perVOSpentVoiceCreditsHash
        )
      ).to.be.revertedWithCustomError(fundingRound, 'RoundAlreadyFinalized')
    })

    it('reverts if voting is still in progress', async () => {
      await (fundingRound.connect(contributor) as Contract).contribute(
        userKeypair.pubKey.asContractParam(),
        totalContributions
      )
      await time.increase(roundDuration / 2)

      await expect(
        fundingRound.finalize(
          totalSpent,
          totalSpentSalt,
          newResultCommitment,
          perVOSpentVoiceCreditsHash
        )
      ).to.be.revertedWithCustomError(fundingRound, 'VotingPeriodNotPassed')
    })

    it('reverts if votes has not been tallied', async () => {
      await (fundingRound.connect(contributor) as Contract).contribute(
        userKeypair.pubKey.asContractParam(),
        totalContributions
      )
      await time.increase(roundDuration)

      await mergeMaciSubtrees({ maciAddress, pollId, signer: deployer })
      await tally.mock.tallyBatchNum.returns(0)
      await expect(
        fundingRound.finalize(
          totalSpent,
          totalSpentSalt,
          newResultCommitment,
          perVOSpentVoiceCreditsHash
        )
      ).to.be.revertedWithCustomError(fundingRound, 'VotesNotTallied')
    })

    it('reverts if tally hash has not been published', async () => {
      await (fundingRound.connect(contributor) as Contract).contribute(
        userKeypair.pubKey.asContractParam(),
        totalContributions
      )
      await time.increase(roundDuration)

      await mergeMaciSubtrees({ maciAddress, pollId, signer: deployer })
      await expect(
        fundingRound.finalize(
          totalSpent,
          totalSpentSalt,
          newResultCommitment,
          perVOSpentVoiceCreditsHash
        )
      ).to.be.revertedWithCustomError(fundingRound, 'TallyHashNotPublished')
    })

    it('reverts if total votes (== totalSpent) is zero', async () => {
      await (fundingRound.connect(contributor) as Contract).contribute(
        userKeypair.pubKey.asContractParam(),
        totalContributions
      )
      await time.increase(roundDuration)
      await mergeMaciSubtrees({ maciAddress, pollId, signer: deployer })
      await fundingRoundAsCoordinator.publishTallyHash(tallyHash)
      await token.transfer(fundingRound.target, matchingPoolSize)

      await addTallyResultsBatch(
        fundingRoundAsCoordinator,
        tallyTreeDepth,
        smallTallyTestData,
        5
      )
      await expect(
        fundingRound.finalize(
          0, // totalSpent
          totalSpentSalt,
          newResultCommitment,
          perVOSpentVoiceCreditsHash
        )
      ).to.be.revertedWithCustomError(fundingRound, 'NoVotes')
    })

    it('reverts if total amount of spent voice credits is incorrect', async () => {
      await (fundingRound.connect(contributor) as Contract).contribute(
        userKeypair.pubKey.asContractParam(),
        totalContributions
      )

      await time.increase(roundDuration)

      await mergeMaciSubtrees({ maciAddress, pollId, signer: deployer })
      await fundingRoundAsCoordinator.publishTallyHash(tallyHash)
      await token.transfer(fundingRound.target, matchingPoolSize)

      await addTallyResultsBatch(
        fundingRoundAsCoordinator,
        tallyTreeDepth,
        smallTallyTestData,
        5
      )

      await tally.mock.verifySpentVoiceCredits.returns(false)
      await expect(
        fundingRound.finalize(
          totalSpent,
          totalSpentSalt,
          newResultCommitment,
          perVOSpentVoiceCreditsHash
        )
      ).to.be.revertedWithCustomError(
        fundingRound,
        'IncorrectSpentVoiceCredits'
      )
    })

    it('allows only owner to finalize round', async () => {
      await (fundingRound.connect(contributor) as Contract).contribute(
        userKeypair.pubKey.asContractParam(),
        totalContributions
      )
      await time.increase(roundDuration)

      const fundingRoundAsCoordinator = fundingRound.connect(
        coordinator
      ) as Contract

      await mergeMaciSubtrees({ maciAddress, pollId, signer: deployer })
      await fundingRoundAsCoordinator.publishTallyHash(tallyHash)
      await token.transfer(fundingRound.target, matchingPoolSize)

      await expect(
        fundingRoundAsCoordinator.finalize(
          totalSpent,
          totalSpentSalt,
          newResultCommitment,
          perVOSpentVoiceCreditsHash
        )
      ).to.be.revertedWith('Ownable: caller is not the owner')
    })
  })

  describe('cancelling round', () => {
    it('allows owner to cancel round', async () => {
      await fundingRound.cancel()
      expect(await fundingRound.isFinalized()).to.equal(true)
      expect(await fundingRound.isCancelled()).to.equal(true)
    })

    it('reverts if round has been finalized already', async () => {
      const matchingPoolSize = UNIT * BigInt(10000)
      const totalContributions = UNIT * BigInt(1000)
      const totalSpent = totalContributions / VOICE_CREDIT_FACTOR
      const totalSpentSalt = genRandomSalt().toString()

      await (token.connect(contributor) as Contract).approve(
        fundingRound.target,
        totalContributions
      )
      await (fundingRound.connect(contributor) as Contract).contribute(
        userKeypair.pubKey.asContractParam(),
        totalContributions
      )
      await time.increase(roundDuration)

      await mergeMaciSubtrees({ maciAddress, pollId, signer: deployer })
      await fundingRoundAsCoordinator.publishTallyHash(tallyHash)
      await token.transfer(fundingRound.target, matchingPoolSize)
      await addTallyResultsBatch(
        fundingRoundAsCoordinator,
        tallyTreeDepth,
        smallTallyTestData,
        3
      )
      await fundingRound.finalize(
        totalSpent,
        totalSpentSalt,
        newResultCommitment,
        perVOSpentVoiceCreditsHash
      )

      await expect(fundingRound.cancel()).to.be.revertedWithCustomError(
        fundingRound,
        'RoundAlreadyFinalized'
      )
    })

    it('reverts if round has been cancelled already', async () => {
      await fundingRound.cancel()
      await expect(fundingRound.cancel()).to.be.revertedWithCustomError(
        fundingRound,
        'RoundAlreadyFinalized'
      )
    })

    it('allows only owner to cancel round', async () => {
      const fundingRoundAsCoordinator = fundingRound.connect(
        coordinator
      ) as Contract
      await expect(fundingRoundAsCoordinator.cancel()).to.be.revertedWith(
        'Ownable: caller is not the owner'
      )
    })
  })

  describe('withdrawing funds', () => {
    const userPubKey = userKeypair.pubKey.asContractParam()
    const anotherUserPubKey = userKeypair.pubKey.asContractParam()
    const contributionAmount = UNIT * BigInt(10)
    let fundingRoundAsContributor: Contract

    beforeEach(async () => {
      fundingRoundAsContributor = fundingRound.connect(contributor) as Contract
      await (token.connect(contributor) as Contract).approve(
        fundingRound.target,
        contributionAmount
      )
      await (token.connect(anotherContributor) as Contract).approve(
        fundingRound.target,
        contributionAmount
      )
    })

    it('allows contributors to withdraw funds', async () => {
      await fundingRoundAsContributor.contribute(userPubKey, contributionAmount)
      await (fundingRound.connect(anotherContributor) as Contract).contribute(
        anotherUserPubKey,
        contributionAmount
      )
      await fundingRound.cancel()

      await expect(fundingRoundAsContributor.withdrawContribution())
        .to.emit(fundingRound, 'ContributionWithdrawn')
        .withArgs(contributor.address)
      await (
        fundingRound.connect(anotherContributor) as Contract
      ).withdrawContribution()
      expect(await token.balanceOf(fundingRound.target)).to.equal(0)
    })

    it('disallows withdrawal if round is not cancelled', async () => {
      await fundingRoundAsContributor.contribute(userPubKey, contributionAmount)
      await expect(
        fundingRoundAsContributor.withdrawContribution()
      ).to.be.revertedWithCustomError(fundingRound, 'RoundNotCancelled')
    })

    it('reverts if user did not contribute to the round', async () => {
      await fundingRound.cancel()
      await expect(
        fundingRoundAsContributor.withdrawContribution()
      ).to.be.revertedWithCustomError(fundingRound, 'NothingToWithdraw')
    })

    it('reverts if funds are already withdrawn', async () => {
      const fundingRoundAsContributor = fundingRound.connect(
        contributor
      ) as Contract
      await fundingRoundAsContributor.contribute(userPubKey, contributionAmount)
      await (fundingRound.connect(anotherContributor) as Contract).contribute(
        anotherUserPubKey,
        contributionAmount
      )
      await fundingRound.cancel()

      await fundingRoundAsContributor.withdrawContribution()
      await expect(
        fundingRoundAsContributor.withdrawContribution()
      ).to.be.revertedWithCustomError(fundingRound, 'NothingToWithdraw')
    })

    it('allows anyone to withdraw multiple contributions', async () => {
      await (fundingRound.connect(contributor) as Contract).contribute(
        userPubKey,
        contributionAmount
      )
      await (fundingRound.connect(anotherContributor) as Contract).contribute(
        anotherUserPubKey,
        contributionAmount
      )
      await fundingRound.cancel()

      const tx = await (
        fundingRound.connect(coordinator) as Contract
      ).withdrawContributions([contributor.address, anotherContributor.address])
      await tx.wait()
      expect(await token.balanceOf(fundingRound.target)).to.equal(0)
    })

    it('allows transaction to complete even if some contributions fail to withdraw', async () => {
      await (fundingRound.connect(contributor) as Contract).contribute(
        userPubKey,
        contributionAmount
      )
      await fundingRound.cancel()

      const tx = await (
        fundingRound.connect(coordinator) as Contract
      ).withdrawContributions([contributor.address, anotherContributor.address])
      await tx.wait()
      expect(await token.balanceOf(fundingRound.target)).to.equal(0)
    })
  })

  describe('claiming funds', () => {
    const recipientIndex = 3
    const { spent: totalSpent, salt: totalSpentSalt } =
      smallTallyTestData.totalSpentVoiceCredits
    const contributions =
      smallTallyTestData.perVOSpentVoiceCredits.tally[recipientIndex]

    const expectedAllocatedAmount = calcAllocationAmount(
      smallTallyTestData.results.tally[recipientIndex],
      smallTallyTestData.perVOSpentVoiceCredits.tally[recipientIndex]
    )
    let fundingRoundAsRecipient: Contract
    let fundingRoundAsContributor: Contract

    beforeEach(async () => {
      await recipientRegistry.mock.getRecipientAddress.returns(
        recipient.address
      )

      const tokenAsContributor = token.connect(contributor) as Contract
      await tokenAsContributor.approve(fundingRound.target, contributions)
      fundingRoundAsContributor = fundingRound.connect(contributor) as Contract

      await time.increase(roundDuration)
      await mergeMaciSubtrees({ maciAddress, pollId, signer: deployer })
      await (fundingRound.connect(coordinator) as Contract).publishTallyHash(
        tallyHash
      )
      fundingRoundAsRecipient = fundingRound.connect(recipient) as Contract
      await tally.mock.verifyPerVOSpentVoiceCredits.returns(true)
    })

    it('allows recipient to claim allocated funds', async () => {
      await token.transfer(fundingRound.target, budget)
      await addTallyResultsBatch(
        fundingRoundAsCoordinator,
        tallyTreeDepth,
        smallTallyTestData,
        3
      )
      await fundingRound.finalize(
        totalSpent,
        totalSpentSalt,
        newResultCommitment,
        perVOSpentVoiceCreditsHash
      )

      const { results, perVOSpentVoiceCredits } = smallTallyTestData
      expect(
        await fundingRound.getAllocatedAmount(
          results.tally[recipientIndex],
          perVOSpentVoiceCredits.tally[recipientIndex]
        )
      ).to.equal(expectedAllocatedAmount, 'mismatch allocated amount')

      const claimData = getRecipientClaimData(
        recipientIndex,
        tallyTreeDepth,
        smallTallyTestData
      )
      await expect(fundingRoundAsRecipient.claimFunds(...claimData))
        .to.emit(fundingRound, 'FundsClaimed')
        .withArgs(recipientIndex, recipient.address, expectedAllocatedAmount)
      expect(await token.balanceOf(recipient.address)).to.equal(
        expectedAllocatedAmount,
        'mismatch token balance'
      )
    })

    it('allows address different than recipient to claim allocated funds', async () => {
      await token.transfer(fundingRound.target, budget)
      await addTallyResultsBatch(
        fundingRoundAsCoordinator,
        tallyTreeDepth,
        smallTallyTestData,
        3
      )
      await fundingRound.finalize(
        totalSpent,
        totalSpentSalt,
        newResultCommitment,
        perVOSpentVoiceCreditsHash
      )

      const claimData = getRecipientClaimData(
        recipientIndex,
        tallyTreeDepth,
        smallTallyTestData
      )
      await expect(fundingRoundAsContributor.claimFunds(...claimData))
        .to.emit(fundingRound, 'FundsClaimed')
        .withArgs(recipientIndex, recipient.address, expectedAllocatedAmount)

      expect(await token.balanceOf(recipient.address)).to.equal(
        expectedAllocatedAmount
      )
    })

    it('allows recipient to claim zero amount', async () => {
      await token.transfer(fundingRound.target, budget)
      await addTallyResultsBatch(
        fundingRoundAsCoordinator,
        tallyTreeDepth,
        smallTallyTestData,
        3
      )
      await fundingRound.finalize(
        totalSpent,
        totalSpentSalt,
        newResultCommitment,
        perVOSpentVoiceCreditsHash
      )

      const recipientWithZeroFunds = 2
      const claimData = getRecipientClaimData(
        recipientWithZeroFunds,
        tallyTreeDepth,
        smallTallyTestData
      )

      await expect(fundingRoundAsRecipient.claimFunds(...claimData))
        .to.emit(fundingRound, 'FundsClaimed')
        .withArgs(recipientWithZeroFunds, recipient.address, 0)
    })

    it('allows recipient to claim if the matching pool is empty', async () => {
      const totalContributions = BigInt(totalSpent) * VOICE_CREDIT_FACTOR
      await token.transfer(fundingRound.target, totalContributions)
      await addTallyResultsBatch(
        fundingRoundAsCoordinator,
        tallyTreeDepth,
        smallTallyTestData,
        3
      )
      await fundingRound.finalize(
        totalSpent,
        totalSpentSalt,
        newResultCommitment,
        perVOSpentVoiceCreditsHash
      )

      const expectedWithoutMatching =
        BigInt(contributions) * VOICE_CREDIT_FACTOR

      const claimData = getRecipientClaimData(
        recipientIndex,
        tallyTreeDepth,
        smallTallyTestData
      )
      await expect(fundingRoundAsRecipient.claimFunds(...claimData))
        .to.emit(fundingRound, 'FundsClaimed')
        .withArgs(recipientIndex, recipient.address, expectedWithoutMatching)
    })

    it('should not allow recipient to claim funds if round has not been finalized', async () => {
      await token.transfer(fundingRound.target, budget)

      const claimData = getRecipientClaimData(
        recipientIndex,
        tallyTreeDepth,
        smallTallyTestData
      )
      await expect(
        fundingRoundAsRecipient.claimFunds(...claimData)
      ).to.be.revertedWithCustomError(fundingRound, 'RoundNotFinalized')
    })

    it('should not allow recipient to claim funds if round has been cancelled', async () => {
      await token.transfer(fundingRound.target, budget)
      await fundingRound.cancel()

      const claimData = getRecipientClaimData(
        recipientIndex,
        tallyTreeDepth,
        smallTallyTestData
      )
      await expect(
        fundingRoundAsRecipient.claimFunds(...claimData)
      ).to.be.revertedWithCustomError(fundingRound, 'RoundCancelled')
    })

    it('sends funds allocated to unverified recipients back to matching pool', async () => {
      await token.transfer(fundingRound.target, budget)
      await addTallyResultsBatch(
        fundingRoundAsCoordinator,
        tallyTreeDepth,
        smallTallyTestData,
        3
      )
      await fundingRound.finalize(
        totalSpent,
        totalSpentSalt,
        newResultCommitment,
        perVOSpentVoiceCreditsHash
      )
      await recipientRegistry.mock.getRecipientAddress.returns(ZERO_ADDRESS)

      const claimData = getRecipientClaimData(
        recipientIndex,
        tallyTreeDepth,
        smallTallyTestData
      )
      const initialDeployerBalance = await token.balanceOf(deployer.address)
      await expect(fundingRoundAsRecipient.claimFunds(...claimData))
        .to.emit(fundingRound, 'FundsClaimed')
        .withArgs(recipientIndex, deployer.address, expectedAllocatedAmount)
      expect(await token.balanceOf(deployer.address)).to.equal(
        BigInt(initialDeployerBalance) + expectedAllocatedAmount
      )
    })

    it('allows recipient to claim allocated funds only once', async () => {
      await token.transfer(fundingRound.target, budget)
      await addTallyResultsBatch(
        fundingRoundAsCoordinator,
        tallyTreeDepth,
        smallTallyTestData,
        3
      )
      await fundingRound.finalize(
        totalSpent,
        totalSpentSalt,
        newResultCommitment,
        perVOSpentVoiceCreditsHash
      )

      const claimData = getRecipientClaimData(
        recipientIndex,
        tallyTreeDepth,
        smallTallyTestData
      )
      await fundingRoundAsRecipient.claimFunds(...claimData)
      await expect(
        fundingRoundAsRecipient.claimFunds(...claimData)
      ).to.be.revertedWithCustomError(fundingRound, 'FundsAlreadyClaimed')
    })

    it('should verify that tally result is correct', async () => {
      await token.transfer(fundingRound.target, budget)
      await tally.mock.verifyTallyResult.returns(false)
      await expect(
        addTallyResultsBatch(
          fundingRoundAsCoordinator,
          tallyTreeDepth,
          smallTallyTestData,
          3
        )
      ).to.be.revertedWithCustomError(fundingRound, 'IncorrectTallyResult')
    })

    it('should verify that amount of spent voice credits is correct', async () => {
      await token.transfer(fundingRound.target, budget)

      await addTallyResultsBatch(
        fundingRoundAsCoordinator,
        tallyTreeDepth,
        smallTallyTestData,
        3
      )
      await fundingRound.finalize(
        totalSpent,
        totalSpentSalt,
        newResultCommitment,
        perVOSpentVoiceCreditsHash
      )

      const claimData = getRecipientClaimData(
        recipientIndex,
        tallyTreeDepth,
        smallTallyTestData
      )

      await tally.mock.verifyPerVOSpentVoiceCredits.returns(false)
      await expect(
        fundingRoundAsRecipient.claimFunds(...claimData)
      ).to.be.revertedWithCustomError(
        fundingRound,
        'IncorrectPerVOSpentVoiceCredits'
      )
    })
  })

  describe('finalizing with alpha', function () {
    this.timeout(2 * 60 * 1000)
    const treeDepth = 2
    beforeEach(async () => {
      await recipientRegistry.mock.getRecipientAddress.returns(
        recipient.address
      )

      await token.transfer(fundingRound.target, budget)

      const fundingRoundAsCoordinator = fundingRound.connect(
        coordinator
      ) as Contract
      await fundingRoundAsCoordinator.publishTallyHash(tallyHash)

      await time.increase(roundDuration)
      await mergeMaciSubtrees({ maciAddress, pollId, signer: deployer })
    })

    it('adds and verifies tally results', async function () {
      this.timeout(2 * 60 * 1000)
      await addTallyResultsBatch(
        fundingRoundAsCoordinator,
        treeDepth,
        smallTallyTestData,
        5
      )

      const totalResults = await fundingRound.totalTallyResults()
      expect(toNumber(totalResults)).to.eq(25, 'total verified mismatch')

      const totalSquares = await fundingRound.totalVotesSquares()
      expect(totalSquares.toString()).to.eq(
        totalQuadraticVotes,
        'sum of squares mismatch'
      )
    })

    it('calculates alpha correctly', async function () {
      this.timeout(2 * 60 * 1000)
      await addTallyResultsBatch(
        fundingRoundAsCoordinator,
        treeDepth,
        smallTallyTestData,
        5
      )

      const totalVotes = await fundingRound.totalVotesSquares()
      const { spent: totalSpent } = smallTallyTestData.totalSpentVoiceCredits
      const calculatedAlpha = await fundingRound.calcAlpha(
        budget,
        totalVotes,
        totalSpent
      )
      expect(calculatedAlpha.toString()).to.eq(expectedAlpha, 'alpha mismatch')
    })

    it('finalizes successfully', async function () {
      await addTallyResultsBatch(
        fundingRoundAsCoordinator,
        treeDepth,
        smallTallyTestData,
        3
      )
      const { spent, salt } = smallTallyTestData.totalSpentVoiceCredits
      await fundingRound.finalize(
        spent,
        salt,
        newResultCommitment,
        perVOSpentVoiceCreditsHash
      )

      const alpha = await fundingRound.alpha()
      expect(alpha.toString()).to.eq(
        expectedAlpha.toString(),
        'invalid funding round alpha'
      )
    })

    it('fails to finalize if all projects only have 1 contributor', async function () {
      const tallyWith1Contributor = {
        newTallyCommitment:
          '0xae3fc926f8347c17f9787eded70bc60e32a175cb46c58c03ffe2f4372cd736',
        results: {
          commitment:
            '0x2f44c97ce649078012fd686eaf996fc6b8d817e11ab574f0d0a0d750ee1ec101',
          tally: [
            0, 200, 200, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0,
          ],
          salt: '0xa1f71f9e48a5f2ec55020051a190f079ca43d66457879972554c3c2e8a07ea0',
        },
        totalSpentVoiceCredits: {
          spent: '80000',
          commitment:
            '0x18b52cbe2a91777772d10c80d1b883cdc98e0f19475bcd907c693fddd6c675b8',
          salt: '0x2013aa4e350542684f78adbf3e716c3bcf96e12c64b8e8ef3d962e3568132778',
        },
        perVOSpentVoiceCredits: {
          commitment:
            '0x26e6ae35c82006eff6408b713d477307b2da16c7a1ff15fb46c0762ee308e88a',
          tally: [
            '0',
            '40000',
            '40000',
            '0',
            '0',
            '0',
            '0',
            '0',
            '0',
            '0',
            '0',
            '0',
            '0',
            '0',
            '0',
            '0',
            '0',
            '0',
            '0',
            '0',
            '0',
            '0',
            '0',
            '0',
            '0',
          ],
          salt: '0x63c80f2b0319790c19b3b17ecd7b00fc1dc7398198601d0dfb30253306ecb34',
        },
      }
      const batchSize = 3
      await addTallyResultsBatch(
        fundingRoundAsCoordinator,
        tallyTreeDepth,
        tallyWith1Contributor,
        batchSize
      )
      const { spent, salt } = smallTallyTestData.totalSpentVoiceCredits
      await expect(
        fundingRound.finalize(
          spent,
          salt,
          newResultCommitment,
          perVOSpentVoiceCreditsHash
        )
      ).to.be.revertedWithCustomError(
        fundingRound,
        'NoProjectHasMoreThanOneVote'
      )
    })

    it('calculates claim funds correctly', async function () {
      await addTallyResultsBatch(
        fundingRoundAsCoordinator,
        treeDepth,
        smallTallyTestData,
        20
      )
      const { spent, salt } = smallTallyTestData.totalSpentVoiceCredits
      await fundingRound.finalize(
        spent,
        salt,
        newResultCommitment,
        perVOSpentVoiceCreditsHash
      )
      await tally.mock.verifyPerVOSpentVoiceCredits.returns(true)

      const { tally: tallyResults } = smallTallyTestData.results
      const { tally: spents } = smallTallyTestData.perVOSpentVoiceCredits

      for (let i = 0; i < tallyResults.length; i++) {
        const tallyResult = tallyResults[i]
        if (tallyResult !== '0') {
          const amount = await fundingRound.getAllocatedAmount(
            tallyResult,
            spents[i]
          )
          const expectedClaimAmount = calcAllocationAmount(
            tallyResult,
            spents[i]
          )
          expect(amount.toString()).to.eq(expectedClaimAmount, 'bad amount')

          const claimData = getRecipientClaimData(
            i,
            treeDepth,
            smallTallyTestData
          )

          await expect(fundingRound.claimFunds(...claimData))
            .to.emit(fundingRound, 'FundsClaimed')
            .withArgs(i, recipient.address, expectedClaimAmount)
        }
      }
    })

    it('prevents finalize if tally results not completely received', async function () {
      const { spent, salt } = smallTallyTestData.totalSpentVoiceCredits
      await expect(
        fundingRound.finalize(
          spent,
          salt,
          newResultCommitment,
          perVOSpentVoiceCreditsHash
        )
      ).to.be.revertedWithCustomError(fundingRound, 'IncompleteTallyResults')
    })

    it('allows only coordinator to add tally results', async function () {
      await expect(
        addTallyResultsBatch(
          fundingRoundAsContributor,
          tallyTreeDepth,
          smallTallyTestData,
          5
        )
      ).to.be.revertedWithCustomError(fundingRound, 'NotCoordinator')
    })

    it('allows only coordinator to add tally results in batches', async function () {
      await expect(
        addTallyResultsBatch(
          fundingRoundAsContributor,
          tallyTreeDepth,
          smallTallyTestData,
          5
        )
      ).to.be.revertedWithCustomError(fundingRound, 'NotCoordinator')
    })

    it('prevents adding tally results if maci has not completed tallying', async function () {
      await tally.mock.tallyBatchNum.returns(0)
      await expect(
        addTallyResultsBatch(
          fundingRoundAsCoordinator,
          tallyTreeDepth,
          smallTallyTestData,
          5
        )
      ).to.be.revertedWithCustomError(fundingRound, 'VotesNotTallied')
    })

    it('prevents adding batches of tally results if maci has not completed tallying', async function () {
      await tally.mock.tallyBatchNum.returns(0)
      await expect(
        addTallyResultsBatch(
          fundingRoundAsCoordinator,
          tallyTreeDepth,
          smallTallyTestData,
          5
        )
      ).to.be.revertedWithCustomError(fundingRound, 'VotesNotTallied')
    })

    it('prevent adding more tally results if already finalized', async () => {
      await addTallyResultsBatch(
        fundingRoundAsCoordinator,
        tallyTreeDepth,
        smallTallyTestData,
        5
      )

      const { spent, salt } = smallTallyTestData.totalSpentVoiceCredits
      await fundingRound.finalize(
        spent,
        salt,
        newResultCommitment,
        perVOSpentVoiceCreditsHash
      )
      await expect(
        addTallyResultsBatch(
          fundingRoundAsCoordinator,
          tallyTreeDepth,
          smallTallyTestData,
          5
        )
      ).to.be.revertedWithCustomError(fundingRound, 'RoundAlreadyFinalized')
    })

    it('prevents adding tally results that were already verified', async function () {
      await addTallyResultsBatch(
        fundingRoundAsCoordinator,
        tallyTreeDepth,
        smallTallyTestData,
        5
      )
      await expect(
        addTallyResultsBatch(
          fundingRoundAsCoordinator,
          tallyTreeDepth,
          smallTallyTestData,
          5
        )
      ).to.revertedWithCustomError(fundingRound, 'VoteResultsAlreadyVerified')
    })

    it('returns correct proccessed count in the callback for processing tally results', async () => {
      const startIndex = 0
      const batchSize = 10
      let batchCount = 0
      const total = smallTallyTestData.results.tally.length
      const lastBatch = Math.ceil(total / batchSize)
      await addTallyResultsBatch(
        fundingRoundAsCoordinator,
        tallyTreeDepth,
        smallTallyTestData,
        batchSize,
        startIndex,
        (processed) => {
          batchCount++
          if (batchCount === lastBatch) {
            expect(processed).to.equal(total, 'Incorrect last batch count')
          } else {
            expect(processed).to.equal(
              batchCount * batchSize,
              'Incorrect proccesed count'
            )
          }
        }
      )
    })
  })

  describe('Alpha calculation', () => {
    it('fails alpha calculation if budget less than contributions', async function () {
      const totalBudget = 99
      const totalVotesSquares = 120
      const totalSpent = 100
      await expect(
        fundingRound.calcAlpha(totalBudget, totalVotesSquares, totalSpent)
      ).to.be.revertedWithCustomError(fundingRound, 'InvalidBudget')
    })

    it('fails alpha calculation if total votes square less than total spent', async function () {
      const totalBudget = parseEther('200')
      const totalVotesSquares = 88
      const totalSpent = 100
      await expect(
        fundingRound.calcAlpha(totalBudget, totalVotesSquares, totalSpent)
      ).to.be.revertedWithCustomError(
        fundingRound,
        'NoProjectHasMoreThanOneVote'
      )
    })
  })
})
