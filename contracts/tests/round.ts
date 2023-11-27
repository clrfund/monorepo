import { ethers, waffle, artifacts, config } from 'hardhat'
import { use, expect } from 'chai'
import { solidity } from 'ethereum-waffle'
import { deployMockContract } from '@ethereum-waffle/mock-contract'
import { Contract, BigNumber, ContractTransaction } from 'ethers'
import { defaultAbiCoder } from '@ethersproject/abi'
import { genRandomSalt } from '@clrfund/maci-crypto'
import { Keypair } from '@clrfund/common'

import {
  ZERO_ADDRESS,
  UNIT,
  VOICE_CREDIT_FACTOR,
  ALPHA_PRECISION,
} from '../utils/constants'
import { getEventArg, getGasUsage } from '../utils/contracts'
import {
  deployContract,
  deployPoseidonLibraries,
  deployMaciFactory,
} from '../utils/deployment'
import {
  bnSqrt,
  createMessage,
  addTallyResultsBatch,
  getRecipientClaimData,
  getRecipientTallyResultsBatch,
} from '../utils/maci'
import { sha256 } from 'ethers/lib/utils'
import { MaciParameters } from '../utils/maciParameters'
import { DEFAULT_CIRCUIT } from '../utils/circuits'

use(solidity)

// ethStaker test vectors for Quadratic Funding with alpha
import smallTallyTestData from './data/testTallySmall.json'
const totalSpent = BigNumber.from(
  smallTallyTestData.totalSpentVoiceCredits.spent
)
const budget = BigNumber.from(totalSpent).mul(VOICE_CREDIT_FACTOR).mul(2)
const totalQuadraticVotes = smallTallyTestData.results.tally.reduce(
  (total, tally) => {
    return BigNumber.from(tally).pow(2).add(total)
  },
  BigNumber.from(0)
)
const matchingPoolSize = budget.sub(totalSpent.mul(VOICE_CREDIT_FACTOR))

const expectedAlpha = matchingPoolSize
  .mul(ALPHA_PRECISION)
  .div(totalQuadraticVotes.sub(totalSpent))
  .div(VOICE_CREDIT_FACTOR)

function calcAllocationAmount(tally: string, voiceCredit: string): BigNumber {
  const quadratic = expectedAlpha
    .mul(VOICE_CREDIT_FACTOR)
    .mul(BigNumber.from(tally).pow(2))
  const linear = ALPHA_PRECISION.sub(expectedAlpha).mul(
    VOICE_CREDIT_FACTOR.mul(voiceCredit)
  )
  const allocation = quadratic.add(linear)
  return allocation.div(ALPHA_PRECISION)
}

async function finalizeRound(
  fundingRound: Contract,
  totalSpent: string | BigNumber,
  totalSpentSalt: string
): Promise<ContractTransaction> {
  // generate random 32 bytes for test only
  const newResultCommitment = genRandomSalt().toString()
  const perVOVoiceCreditsCommitment = genRandomSalt().toString()
  return fundingRound.finalize(
    totalSpent,
    totalSpentSalt,
    newResultCommitment,
    perVOVoiceCreditsCommitment
  )
}

describe('Funding Round', () => {
  const provider = waffle.provider
  const [, deployer, coordinator, contributor, anotherContributor, recipient] =
    provider.getWallets()

  const coordinatorPubKey = new Keypair().pubKey
  const userKeypair = new Keypair()
  const contributionAmount = UNIT.mul(10)
  const tallyHash = 'test'
  const tallyTreeDepth = 2
  const pollDuration = 86400 * 7
  const halfPollDuration = Math.floor(pollDuration / 2)
  const numSignUps = 4
  const tallyBatchSize = 2
  const tallyBatchNum = 2

  let token: Contract
  let userRegistry: Contract
  let recipientRegistry: Contract
  let fundingRound: Contract
  let maci: Contract
  let pollId: bigint
  let poll: Contract
  let tally: Contract

  async function deployMaciMock(): Promise<Contract> {
    const MACIArtifact = await artifacts.readArtifact('MACI')
    const maci = await deployMockContract(deployer, MACIArtifact.abi)
    await maci.mock.signUp.returns()
    return maci
  }

  async function deployMockContractByName(name: string): Promise<Contract> {
    const artifact = await artifacts.readArtifact(name)
    const contract = await deployMockContract(deployer, artifact.abi)
    return contract
  }

  beforeEach(async () => {
    const tokenInitialSupply = UNIT.mul(1000000)
    const Token = await ethers.getContractFactory('AnyOldERC20Token', deployer)
    token = await Token.deploy(tokenInitialSupply.add(budget))
    await token.transfer(contributor.address, tokenInitialSupply.div(4))
    await token.transfer(anotherContributor.address, tokenInitialSupply.div(4))
    await token.transfer(coordinator.address, tokenInitialSupply.div(4))

    const IUserRegistryArtifact = await artifacts.readArtifact('IUserRegistry')
    userRegistry = await deployMockContract(deployer, IUserRegistryArtifact.abi)
    await userRegistry.mock.isVerifiedUser.returns(true)

    const IRecipientRegistryArtifact =
      await artifacts.readArtifact('IRecipientRegistry')
    recipientRegistry = await deployMockContract(
      deployer,
      IRecipientRegistryArtifact.abi
    )

    const libraries = await deployPoseidonLibraries({
      artifactsPath: config.paths.artifacts,
      ethers,
      signer: deployer,
    })
    fundingRound = await deployContract({
      name: 'FundingRound',
      libraries,
      contractArgs: [
        token.address,
        userRegistry.address,
        recipientRegistry.address,
        coordinator.address,
      ],
      ethers,
      signer: deployer,
    })
    const maciFactory = await deployMaciFactory({
      ethers,
      signer: deployer,
      libraries,
    })

    const maciParams = MaciParameters.mock(DEFAULT_CIRCUIT)
    await maciFactory.setMaciParameters(...maciParams.asContractParam())

    const maciDeployed = await maciFactory.deployMaci(
      fundingRound.address,
      fundingRound.address,
      token.address,
      pollDuration,
      coordinator.address,
      coordinatorPubKey.asContractParam()
    )

    const maciAddress = await getEventArg(
      maciDeployed,
      maciFactory,
      'MaciDeployed',
      '_maci'
    )

    maci = await ethers.getContractAt('MACI', maciAddress)

    pollId = await getEventArg(maciDeployed, maci, 'DeployPoll', '_pollId')
    const pollAddress = await getEventArg(
      maciDeployed,
      maci,
      'DeployPoll',
      '_pollAddr'
    )
    poll = await ethers.getContractAt('Poll', pollAddress)
  })

  it('initializes funding round correctly', async () => {
    expect(await fundingRound.owner()).to.equal(deployer.address)
    expect(await fundingRound.nativeToken()).to.equal(token.address)
    expect(await fundingRound.voiceCreditFactor()).to.equal(VOICE_CREDIT_FACTOR)
    expect(await fundingRound.matchingPoolSize()).to.equal(0)
    expect(await fundingRound.totalSpent()).to.equal(0)
    expect(await fundingRound.totalVotes()).to.equal(0)
    expect(await fundingRound.userRegistry()).to.equal(userRegistry.address)
    expect(await fundingRound.recipientRegistry()).to.equal(
      recipientRegistry.address
    )
    expect(await fundingRound.isFinalized()).to.equal(false)
    expect(await fundingRound.isCancelled()).to.equal(false)
    expect(await fundingRound.coordinator()).to.equal(coordinator.address)
    expect(await fundingRound.maci()).to.equal(ZERO_ADDRESS)
  })

  it('allows owner to set MACI address', async () => {
    await fundingRound.setMaci(maci.address)
    expect(await fundingRound.maci()).to.equal(maci.address)
  })

  it('allows to set MACI address only once', async () => {
    await fundingRound.setMaci(maci.address)
    await expect(fundingRound.setMaci(maci.address)).to.be.revertedWith(
      'MaciAlreadySet'
    )
  })

  it('allows only owner to set MACI address', async () => {
    const fundingRoundAsCoordinator = fundingRound.connect(coordinator)
    await expect(
      fundingRoundAsCoordinator.setMaci(maci.address)
    ).to.be.revertedWith('Ownable: caller is not the owner')
  })

  describe('accepting contributions', () => {
    const userPubKey = userKeypair.pubKey.asContractParam()
    const encodedContributorAddress = defaultAbiCoder.encode(
      ['address'],
      [contributor.address]
    )
    let tokenAsContributor: Contract
    let fundingRoundAsContributor: Contract

    beforeEach(async () => {
      tokenAsContributor = token.connect(contributor)
      fundingRoundAsContributor = fundingRound.connect(contributor)
    })

    it('accepts contributions from everyone', async () => {
      await fundingRound.setMaci(maci.address)
      await tokenAsContributor.approve(fundingRound.address, contributionAmount)
      const expectedVoiceCredits = contributionAmount.div(VOICE_CREDIT_FACTOR)
      await expect(
        fundingRoundAsContributor.contribute(userPubKey, contributionAmount)
      )
        .to.emit(fundingRound, 'Contribution')
        .withArgs(contributor.address, contributionAmount)
        .to.emit(maci, 'SignUp')
      // We use [] to skip argument matching, otherwise it will fail
      // Possibly related: https://github.com/EthWorks/Waffle/issues/245
      //.withArgs([], 1, expectedVoiceCredits, [])
      expect(await token.balanceOf(fundingRound.address)).to.equal(
        contributionAmount
      )

      expect(await fundingRound.contributorCount()).to.equal(1)
      expect(
        await fundingRound.getVoiceCredits(
          fundingRound.address,
          encodedContributorAddress
        )
      ).to.equal(expectedVoiceCredits)
    })

    it('rejects contributions if MACI has not been linked to a round', async () => {
      await tokenAsContributor.approve(fundingRound.address, contributionAmount)
      await expect(
        fundingRoundAsContributor.contribute(userPubKey, contributionAmount)
      ).to.be.revertedWith('MaciNotSet')
    })

    it('limits the number of contributors', async () => {
      // TODO: add test later
    })

    it('rejects contributions if funding round has been finalized', async () => {
      await fundingRound.setMaci(maci.address)
      await fundingRound.cancel()
      await tokenAsContributor.approve(fundingRound.address, contributionAmount)
      await expect(
        fundingRoundAsContributor.contribute(userPubKey, contributionAmount)
      ).to.be.revertedWith('AlreadyFinalized')
    })

    it('rejects contributions with zero amount', async () => {
      await fundingRound.setMaci(maci.address)
      await tokenAsContributor.approve(fundingRound.address, contributionAmount)
      await expect(
        fundingRoundAsContributor.contribute(userPubKey, 0)
      ).to.be.revertedWith('ContributionAmountIsZero')
    })

    it('rejects contributions that are too large', async () => {
      await fundingRound.setMaci(maci.address)
      const contributionAmount = UNIT.mul(10001)
      await tokenAsContributor.approve(fundingRound.address, contributionAmount)
      await expect(
        fundingRoundAsContributor.contribute(userPubKey, contributionAmount)
      ).to.be.revertedWith('ContributionAmountTooLarge')
    })

    it('allows to contribute only once per round', async () => {
      await fundingRound.setMaci(maci.address)
      await tokenAsContributor.approve(
        fundingRound.address,
        contributionAmount.mul(2)
      )
      await fundingRoundAsContributor.contribute(userPubKey, contributionAmount)
      await expect(
        fundingRoundAsContributor.contribute(userPubKey, contributionAmount)
      ).to.be.revertedWith('AlreadyContributed')
    })

    it('requires approval', async () => {
      await fundingRound.setMaci(maci.address)
      await expect(
        fundingRoundAsContributor.contribute(userPubKey, contributionAmount)
      ).to.be.revertedWith('ERC20: insufficient allowance')
    })

    it('rejects contributions from unverified users', async () => {
      await fundingRound.setMaci(maci.address)
      await tokenAsContributor.approve(fundingRound.address, contributionAmount)
      await userRegistry.mock.isVerifiedUser.returns(false)
      await expect(
        fundingRoundAsContributor.contribute(userPubKey, contributionAmount)
      ).to.be.revertedWith('UserNotVerified')
    })

    it('should not allow users who have not contributed to sign up directly in MACI', async () => {
      await fundingRound.setMaci(maci.address)
      const signUpData = defaultAbiCoder.encode(
        ['address'],
        [contributor.address]
      )
      await expect(
        maci.signUp(userPubKey, signUpData, encodedContributorAddress)
      ).to.be.revertedWith('UserHasNotContributed')
    })

    it('should not allow users who have already signed up to sign up directly in MACI', async () => {
      await fundingRound.setMaci(maci.address)
      await tokenAsContributor.approve(fundingRound.address, contributionAmount)
      await fundingRoundAsContributor.contribute(userPubKey, contributionAmount)
      const signUpData = defaultAbiCoder.encode(
        ['address'],
        [contributor.address]
      )
      await expect(
        maci.signUp(userPubKey, signUpData, encodedContributorAddress)
      ).to.be.revertedWith('UserAlreadyRegistered')
    })

    it('should not return the amount of voice credits for user who has not contributed', async () => {
      await expect(
        fundingRound.getVoiceCredits(
          fundingRound.address,
          encodedContributorAddress
        )
      ).to.be.revertedWith('NoVoiceCredits')
    })
  })

  describe('voting', () => {
    const singleVote = UNIT.mul(4)
    let fundingRoundAsContributor: Contract
    let userStateIndex: number
    let recipientIndex = 1
    let nonce = 1

    beforeEach(async () => {
      await fundingRound.setMaci(maci.address)
      const tokenAsContributor = token.connect(contributor)
      await tokenAsContributor.approve(fundingRound.address, contributionAmount)
      fundingRoundAsContributor = fundingRound.connect(contributor)
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
      const messagePublished = await poll.publishMessage(
        message.asContractParam(),
        encPubKey.asContractParam()
      )
      await expect(messagePublished).to.emit(poll, 'PublishMessage')
    })

    it('use a seed to generate new key and submit change message', async () => {
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
      const messagePublished = await poll.publishMessage(
        message.asContractParam(),
        encPubKey.asContractParam()
      )
      await expect(messagePublished).to.emit(poll, 'PublishMessage')
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
      const publishTx1 = await poll.publishMessage(
        message1.asContractParam(),
        encPubKey1.asContractParam()
      )
      await expect(publishTx1).to.emit(poll, 'PublishMessage')
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
      const publishTx2 = await poll.publishMessage(
        message2.asContractParam(),
        encPubKey2.asContractParam()
      )
      await expect(publishTx2).to.emit(poll, 'PublishMessage')
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
      const messagePublished = await poll.publishMessage(
        message.asContractParam(),
        encPubKey.asContractParam()
      )
      await expect(messagePublished).to.emit(poll, 'PublishMessage')
    })

    it('submits a batch of messages', async () => {
      await fundingRound.setPoll(pollId)

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
      const messageBatchSubmitted = await fundingRound.submitMessageBatch(
        messages,
        encPubKeys
      )
      expect(await getGasUsage(messageBatchSubmitted)).lessThan(4900000)
    }).timeout(100000)
  })

  describe('publishing tally hash', () => {
    it('allows coordinator to publish vote tally hash', async () => {
      await expect(
        fundingRound.connect(coordinator).publishTallyHash(tallyHash)
      )
        .to.emit(fundingRound, 'TallyPublished')
        .withArgs(tallyHash)
      expect(await fundingRound.tallyHash()).to.equal(tallyHash)

      // Should be possible to re-publish
      await expect(
        fundingRound.connect(coordinator).publishTallyHash('fixed')
      ).to.emit(fundingRound, 'TallyPublished')
    })

    it('allows only coordinator to publish tally hash', async () => {
      await expect(fundingRound.publishTallyHash(tallyHash)).to.be.revertedWith(
        'NotCoordinator'
      )
    })

    it('reverts if round has been finalized', async () => {
      await fundingRound.cancel()
      await expect(
        fundingRound.connect(coordinator).publishTallyHash(tallyHash)
      ).to.be.revertedWith('RoundAlreadyFinalized')
    })

    it('rejects empty string', async () => {
      await expect(
        fundingRound.connect(coordinator).publishTallyHash('')
      ).to.be.revertedWith('EmptyTallyHash')
    })
  })

  describe('finalizing round', () => {
    const matchingPoolSize = UNIT.mul(10000)
    const totalContributions = UNIT.mul(1000)
    const totalSpent = totalContributions.div(VOICE_CREDIT_FACTOR)
    const totalSpentSalt = genRandomSalt().toString()
    const totalVotes = bnSqrt(totalSpent)
    const tallyTreeDepth = 2

    expect(totalVotes.toNumber()).to.equal(10000)

    beforeEach(async () => {
      maci = await deployMaciMock()
      poll = await deployMockContractByName('Poll')
      tally = await deployMockContractByName('Tally')
      pollId = BigInt(0)
      await poll.mock.treeDepths.returns(1, 1, 1, tallyTreeDepth)
      await maci.mock.getPoll.returns(poll.address)

      // round.isTallied() = tallyBatchSize * tallyBatchNum >= numSignups
      await poll.mock.numSignUpsAndMessages.returns(numSignUps, 1)
      await poll.mock.batchSizes.returns(1, tallyBatchSize, 1)
      await tally.mock.tallyBatchNum.returns(tallyBatchNum)
      await tally.mock.verifyTallyResult.returns(true)
      await tally.mock.verifySpentVoiceCredits.returns(true)

      // round.isVotingOver()
      const deployTime = (await provider.getBlock('latest')).timestamp
      await poll.mock.getDeployTimeAndDuration.returns(deployTime, pollDuration)

      await token
        .connect(contributor)
        .approve(fundingRound.address, totalContributions)
    })

    it('allows owner to finalize round', async () => {
      await fundingRound.setMaci(maci.address)
      await fundingRound.setPoll(pollId)
      await fundingRound.connect(coordinator).setTally(tally.address)

      await fundingRound
        .connect(contributor)
        .contribute(userKeypair.pubKey.asContractParam(), totalContributions)
      await provider.send('evm_increaseTime', [pollDuration])
      await fundingRound.connect(coordinator).publishTallyHash(tallyHash)
      expect(await fundingRound.tallyHash()).to.equal(tallyHash)
      await token.transfer(fundingRound.address, matchingPoolSize)

      await addTallyResultsBatch(
        fundingRound.connect(coordinator),
        tallyTreeDepth,
        smallTallyTestData,
        5
      )

      await finalizeRound(fundingRound, totalSpent, totalSpentSalt)
      expect(await fundingRound.isFinalized()).to.equal(true)
      expect(await fundingRound.isCancelled()).to.equal(false)
      expect(await fundingRound.totalSpent()).to.equal(totalSpent)
      expect(await fundingRound.matchingPoolSize()).to.equal(matchingPoolSize)
    })

    it('allows owner to finalize round when matching pool is empty', async () => {
      await fundingRound.setMaci(maci.address)
      await fundingRound.setPoll(pollId)
      await fundingRound.connect(coordinator).setTally(tally.address)

      await fundingRound
        .connect(contributor)
        .contribute(userKeypair.pubKey.asContractParam(), totalContributions)
      await provider.send('evm_increaseTime', [pollDuration])
      await fundingRound.connect(coordinator).publishTallyHash(tallyHash)

      await addTallyResultsBatch(
        fundingRound.connect(coordinator),
        tallyTreeDepth,
        smallTallyTestData,
        5
      )
      await finalizeRound(fundingRound, totalSpent, totalSpentSalt)
      expect(await fundingRound.totalSpent()).to.equal(totalSpent)
      // TODO: how to get totalVotes from maci v1?
      //expect(await fundingRound.totalVotes()).to.equal(totalVotes)
      expect(await fundingRound.matchingPoolSize()).to.equal(0)
    })

    it('counts direct token transfers to funding round as matching pool contributions', async () => {
      await fundingRound.setMaci(maci.address)
      await fundingRound.setPoll(pollId)
      await fundingRound.connect(coordinator).setTally(tally.address)

      await fundingRound
        .connect(contributor)
        .contribute(userKeypair.pubKey.asContractParam(), totalContributions)
      await provider.send('evm_increaseTime', [pollDuration])
      await fundingRound.connect(coordinator).publishTallyHash(tallyHash)
      await token.transfer(fundingRound.address, matchingPoolSize)
      await token
        .connect(contributor)
        .transfer(fundingRound.address, contributionAmount)

      await addTallyResultsBatch(
        fundingRound.connect(coordinator),
        tallyTreeDepth,
        smallTallyTestData,
        5
      )
      await finalizeRound(fundingRound, totalSpent, totalSpentSalt)
      expect(await fundingRound.matchingPoolSize()).to.equal(
        matchingPoolSize.add(contributionAmount)
      )
    })

    it('reverts if round has been finalized already', async () => {
      await fundingRound.setMaci(maci.address)
      await fundingRound.setPoll(pollId)
      await fundingRound.connect(coordinator).setTally(tally.address)

      await fundingRound
        .connect(contributor)
        .contribute(userKeypair.pubKey.asContractParam(), totalContributions)
      await provider.send('evm_increaseTime', [pollDuration])
      await fundingRound.connect(coordinator).publishTallyHash(tallyHash)
      await token.transfer(fundingRound.address, matchingPoolSize)
      await addTallyResultsBatch(
        fundingRound.connect(coordinator),
        tallyTreeDepth,
        smallTallyTestData,
        5
      )

      await finalizeRound(fundingRound, totalSpent, totalSpentSalt)
      await expect(
        finalizeRound(fundingRound, totalSpent, totalSpentSalt)
      ).to.be.revertedWith('RoundAlreadyFinalized')
    })

    it('reverts MACI has not been deployed', async () => {
      await provider.send('evm_increaseTime', [pollDuration])
      await expect(
        finalizeRound(fundingRound, totalSpent, totalSpentSalt)
      ).to.be.revertedWith('MaciNotSet')
    })

    it('reverts if voting is still in progress', async () => {
      await fundingRound.setMaci(maci.address)
      await fundingRound.setPoll(pollId)
      await fundingRound.connect(coordinator).setTally(tally.address)

      await fundingRound
        .connect(contributor)
        .contribute(userKeypair.pubKey.asContractParam(), totalContributions)
      await provider.send('evm_increaseTime', [halfPollDuration])

      await expect(
        finalizeRound(fundingRound, totalSpent, totalSpentSalt)
      ).to.be.revertedWith('VotingIsNotOver')
    })

    it('reverts if votes has not been tallied', async () => {
      await fundingRound.setMaci(maci.address)
      await fundingRound.setPoll(pollId)
      await fundingRound.connect(coordinator).setTally(tally.address)

      await fundingRound
        .connect(contributor)
        .contribute(userKeypair.pubKey.asContractParam(), totalContributions)
      await provider.send('evm_increaseTime', [pollDuration])
      await poll.mock.numSignUpsAndMessages.returns(numSignUps * 2, 1)

      await expect(
        finalizeRound(fundingRound, totalSpent, totalSpentSalt)
      ).to.be.revertedWith('VotesNotTallied')
    })

    it('reverts if tally hash has not been published', async () => {
      await fundingRound.setMaci(maci.address)
      await fundingRound.setPoll(pollId)
      await fundingRound.connect(coordinator).setTally(tally.address)

      await fundingRound
        .connect(contributor)
        .contribute(userKeypair.pubKey.asContractParam(), totalContributions)
      await provider.send('evm_increaseTime', [pollDuration])

      await expect(
        finalizeRound(fundingRound, totalSpent, totalSpentSalt)
      ).to.be.revertedWith('TallyHashNotPublished')
    })

    // TODO: get total votes in maci v1
    it.skip('reverts if total votes is zero', async () => {
      await fundingRound.setMaci(maci.address)
      await fundingRound.setPoll(pollId)
      await fundingRound.connect(coordinator).setTally(tally.address)

      await fundingRound
        .connect(contributor)
        .contribute(userKeypair.pubKey.asContractParam(), totalContributions)
      await provider.send('evm_increaseTime', [pollDuration])
      await fundingRound.connect(coordinator).publishTallyHash(tallyHash)
      await token.transfer(fundingRound.address, matchingPoolSize)
      await maci.mock.totalVotes.returns(0)

      await addTallyResultsBatch(
        fundingRound.connect(coordinator),
        tallyTreeDepth,
        smallTallyTestData,
        5
      )
      await expect(
        await finalizeRound(fundingRound, totalSpent, totalSpentSalt)
      ).to.be.revertedWith('FundingRound: No votes')
    })

    it.skip('reverts if total amount of spent voice credits is incorrect', async () => {
      await fundingRound.setMaci(maci.address)
      await fundingRound.setPoll(pollId)
      await fundingRound.connect(coordinator).setTally(tally.address)

      await fundingRound
        .connect(contributor)
        .contribute(userKeypair.pubKey.asContractParam(), totalContributions)
      await provider.send('evm_increaseTime', [pollDuration])
      await fundingRound.connect(coordinator).publishTallyHash(tallyHash)
      await token.transfer(fundingRound.address, matchingPoolSize)
      await poll.mock.verifySpentVoiceCredits.returns(false)

      await addTallyResultsBatch(
        fundingRound.connect(coordinator),
        tallyTreeDepth,
        smallTallyTestData,
        5
      )

      await expect(
        finalizeRound(fundingRound, totalSpent, totalSpentSalt)
      ).to.be.revertedWith('IncorrectSpentVoiceCredits')
    })

    it('allows only owner to finalize round', async () => {
      await fundingRound.setMaci(maci.address)
      await fundingRound.setPoll(pollId)
      await fundingRound.connect(coordinator).setTally(tally.address)

      await fundingRound
        .connect(contributor)
        .contribute(userKeypair.pubKey.asContractParam(), totalContributions)
      await provider.send('evm_increaseTime', [pollDuration])
      await fundingRound.connect(coordinator).publishTallyHash(tallyHash)
      await token.transfer(fundingRound.address, matchingPoolSize)

      const fundingRoundAsCoordinator = fundingRound.connect(coordinator)
      await expect(
        finalizeRound(fundingRoundAsCoordinator, totalSpent, totalSpentSalt)
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
      const matchingPoolSize = UNIT.mul(10000)
      const totalContributions = UNIT.mul(1000)
      const totalSpent = totalContributions.div(VOICE_CREDIT_FACTOR)
      const totalSpentSalt = genRandomSalt().toString()

      maci = await deployMaciMock()
      poll = await deployMockContractByName('Poll')
      tally = await deployMockContractByName('Tally')
      pollId = BigInt(0)
      await tally.mock.verifyTallyResult.returns(true)
      await tally.mock.verifySpentVoiceCredits.returns(true)
      await poll.mock.treeDepths.returns(1, 2, 3, tallyTreeDepth)
      await maci.mock.getPoll.returns(poll.address)

      // round.isTallied() = tallyBatchSize * tallyBatchNum >= numSignups
      await poll.mock.numSignUpsAndMessages.returns(numSignUps, 1)
      await poll.mock.batchSizes.returns(1, tallyBatchSize, 1)
      await tally.mock.tallyBatchNum.returns(tallyBatchNum)

      // round.isVotingOver()
      const deployTime = (await provider.getBlock('latest')).timestamp
      await poll.mock.getDeployTimeAndDuration.returns(deployTime, pollDuration)

      await fundingRound.setMaci(maci.address)
      await fundingRound.setPoll(pollId)
      await fundingRound.connect(coordinator).setTally(tally.address)
      await token
        .connect(contributor)
        .approve(fundingRound.address, totalContributions)
      await fundingRound
        .connect(contributor)
        .contribute(userKeypair.pubKey.asContractParam(), totalContributions)
      await provider.send('evm_increaseTime', [pollDuration])
      await fundingRound.connect(coordinator).publishTallyHash(tallyHash)
      await token.transfer(fundingRound.address, matchingPoolSize)
      await addTallyResultsBatch(
        fundingRound.connect(coordinator),
        tallyTreeDepth,
        smallTallyTestData,
        3
      )
      await finalizeRound(fundingRound, totalSpent, totalSpentSalt)

      await expect(fundingRound.cancel()).to.be.revertedWith(
        'RoundAlreadyFinalized'
      )
    })

    it('reverts if round has been cancelled already', async () => {
      await fundingRound.cancel()
      await expect(fundingRound.cancel()).to.be.revertedWith(
        'RoundAlreadyFinalized'
      )
    })

    it('allows only owner to cancel round', async () => {
      const fundingRoundAsCoordinator = fundingRound.connect(coordinator)
      await expect(fundingRoundAsCoordinator.cancel()).to.be.revertedWith(
        'Ownable: caller is not the owner'
      )
    })
  })

  describe('withdrawing funds', () => {
    const userPubKey = userKeypair.pubKey.asContractParam()
    const anotherUserPubKey = userKeypair.pubKey.asContractParam()
    const contributionAmount = UNIT.mul(10)
    let fundingRoundAsContributor: Contract

    beforeEach(async () => {
      fundingRoundAsContributor = fundingRound.connect(contributor)
      await fundingRound.setMaci(maci.address)
      await token
        .connect(contributor)
        .approve(fundingRound.address, contributionAmount)
      await token
        .connect(anotherContributor)
        .approve(fundingRound.address, contributionAmount)
    })

    it('allows contributors to withdraw funds', async () => {
      await fundingRoundAsContributor.contribute(userPubKey, contributionAmount)
      await fundingRound
        .connect(anotherContributor)
        .contribute(anotherUserPubKey, contributionAmount)
      await fundingRound.cancel()

      await expect(fundingRoundAsContributor.withdrawContribution())
        .to.emit(fundingRound, 'ContributionWithdrawn')
        .withArgs(contributor.address)
      await fundingRound.connect(anotherContributor).withdrawContribution()
      expect(await token.balanceOf(fundingRound.address)).to.equal(0)
    })

    it('disallows withdrawal if round is not cancelled', async () => {
      await fundingRoundAsContributor.contribute(userPubKey, contributionAmount)
      await expect(
        fundingRoundAsContributor.withdrawContribution()
      ).to.be.revertedWith('RoundNotCancelled')
    })

    it('reverts if user did not contribute to the round', async () => {
      await fundingRound.cancel()
      await expect(
        fundingRoundAsContributor.withdrawContribution()
      ).to.be.revertedWith('NothingToWithdraw')
    })

    it('reverts if funds are already withdrawn', async () => {
      await fundingRound
        .connect(contributor)
        .contribute(userPubKey, contributionAmount)
      await fundingRound
        .connect(anotherContributor)
        .contribute(anotherUserPubKey, contributionAmount)
      await fundingRound.cancel()

      await fundingRound.connect(contributor).withdrawContribution()
      await expect(
        fundingRound.connect(contributor).withdrawContribution()
      ).to.be.revertedWith('NothingToWithdraw')
    })

    it('allows anyone to withdraw multiple contributions', async () => {
      await fundingRound
        .connect(contributor)
        .contribute(userPubKey, contributionAmount)
      await fundingRound
        .connect(anotherContributor)
        .contribute(anotherUserPubKey, contributionAmount)
      await fundingRound.cancel()

      const tx = await fundingRound
        .connect(coordinator)
        .withdrawContributions([
          contributor.address,
          anotherContributor.address,
        ])
      await tx.wait()
      expect(await token.balanceOf(fundingRound.address)).to.equal(0)
    })

    it('allows transaction to complete even if some contributions fail to withdraw', async () => {
      await fundingRound
        .connect(contributor)
        .contribute(userPubKey, contributionAmount)
      await fundingRound.cancel()

      const tx = await fundingRound
        .connect(coordinator)
        .withdrawContributions([
          contributor.address,
          anotherContributor.address,
        ])
      await tx.wait()
      expect(await token.balanceOf(fundingRound.address)).to.equal(0)
    })
  })

  describe('claiming funds', () => {
    const totalVotes = totalQuadraticVotes
    const recipientIndex = 3

    const { spent: totalSpent, salt: totalSpentSalt } =
      smallTallyTestData.totalSpentVoiceCredits
    const contributions =
      smallTallyTestData.perVOSpentVoiceCredits.tally[recipientIndex]

    const expectedAllocatedAmount = calcAllocationAmount(
      smallTallyTestData.results.tally[recipientIndex],
      smallTallyTestData.perVOSpentVoiceCredits.tally[recipientIndex]
    ).toString()
    let fundingRoundAsRecipient: Contract
    let fundingRoundAsContributor: Contract

    beforeEach(async () => {
      maci = await deployMaciMock()
      poll = await deployMockContractByName('Poll')
      tally = await deployMockContractByName('Tally')
      pollId = BigInt(0)
      await poll.mock.treeDepths.returns(1, 1, 1, tallyTreeDepth)
      await maci.mock.getPoll.returns(poll.address)

      // round.isTallied() = tallyBatchSize * tallyBatchNum >= numSignups
      await poll.mock.numSignUpsAndMessages.returns(numSignUps, 1)
      await poll.mock.batchSizes.returns(1, tallyBatchSize, 1)
      await tally.mock.verifyPerVOSpentVoiceCredits.returns(true)
      await tally.mock.verifyTallyResult.returns(true)
      await tally.mock.verifySpentVoiceCredits.returns(true)
      await tally.mock.tallyBatchNum.returns(tallyBatchNum)

      // round.isVotingOver()
      const deployTime = (await provider.getBlock('latest')).timestamp
      await poll.mock.getDeployTimeAndDuration.returns(deployTime, pollDuration)
      await recipientRegistry.mock.getRecipientAddress.returns(
        recipient.address
      )

      await fundingRound.setMaci(maci.address)
      await fundingRound.setPoll(pollId)
      await fundingRound.connect(coordinator).setTally(tally.address)
      const tokenAsContributor = token.connect(contributor)
      await tokenAsContributor.approve(fundingRound.address, contributions)
      fundingRoundAsContributor = fundingRound.connect(contributor)

      await provider.send('evm_increaseTime', [pollDuration])
      await fundingRound.connect(coordinator).publishTallyHash(tallyHash)
      fundingRoundAsRecipient = fundingRound.connect(recipient)
    })

    it('allows recipient to claim allocated funds', async () => {
      await token.transfer(fundingRound.address, budget)
      await addTallyResultsBatch(
        fundingRound.connect(coordinator),
        tallyTreeDepth,
        smallTallyTestData,
        3
      )
      await finalizeRound(fundingRound, totalSpent, totalSpentSalt)

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
      await token.transfer(fundingRound.address, budget)
      await addTallyResultsBatch(
        fundingRound.connect(coordinator),
        tallyTreeDepth,
        smallTallyTestData,
        3
      )
      await finalizeRound(fundingRound, totalSpent, totalSpentSalt)

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
      await token.transfer(fundingRound.address, budget)
      await addTallyResultsBatch(
        fundingRound.connect(coordinator),
        tallyTreeDepth,
        smallTallyTestData,
        3
      )
      await finalizeRound(fundingRound, totalSpent, totalSpentSalt)

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
      const totalContributions =
        ethers.BigNumber.from(totalSpent).mul(VOICE_CREDIT_FACTOR)
      await token.transfer(fundingRound.address, totalContributions)
      await addTallyResultsBatch(
        fundingRound.connect(coordinator),
        tallyTreeDepth,
        smallTallyTestData,
        3
      )
      await finalizeRound(fundingRound, totalSpent, totalSpentSalt)

      const expectedWithoutMatching = ethers.BigNumber.from(contributions)
        .mul(VOICE_CREDIT_FACTOR)
        .toString()

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
      await token.transfer(fundingRound.address, budget)

      const claimData = getRecipientClaimData(
        recipientIndex,
        tallyTreeDepth,
        smallTallyTestData
      )
      await expect(
        fundingRoundAsRecipient.claimFunds(...claimData)
      ).to.be.revertedWith('RoundNotFinalized')
    })

    it('should not allow recipient to claim funds if round has been cancelled', async () => {
      await token.transfer(fundingRound.address, budget)
      await fundingRound.cancel()

      const claimData = getRecipientClaimData(
        recipientIndex,
        tallyTreeDepth,
        smallTallyTestData
      )
      await expect(
        fundingRoundAsRecipient.claimFunds(...claimData)
      ).to.be.revertedWith('RoundCancelled')
    })

    it('sends funds allocated to unverified recipients back to matching pool', async () => {
      await token.transfer(fundingRound.address, budget)
      await addTallyResultsBatch(
        fundingRound.connect(coordinator),
        tallyTreeDepth,
        smallTallyTestData,
        3
      )
      await finalizeRound(fundingRound, totalSpent, totalSpentSalt)
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
        initialDeployerBalance.add(expectedAllocatedAmount)
      )
    })

    it('allows recipient to claim allocated funds only once', async () => {
      await token.transfer(fundingRound.address, budget)
      await addTallyResultsBatch(
        fundingRound.connect(coordinator),
        tallyTreeDepth,
        smallTallyTestData,
        3
      )
      await finalizeRound(fundingRound, totalSpent, totalSpentSalt)

      const claimData = getRecipientClaimData(
        recipientIndex,
        tallyTreeDepth,
        smallTallyTestData
      )
      await fundingRoundAsRecipient.claimFunds(...claimData)
      await expect(
        fundingRoundAsRecipient.claimFunds(...claimData)
      ).to.be.revertedWith('FundsAlreadyClaimed')
    })

    it('should verify that tally result is correct', async () => {
      await token.transfer(fundingRound.address, budget)

      await tally.mock.verifyTallyResult.returns(false)
      await expect(
        addTallyResultsBatch(
          fundingRound.connect(coordinator),
          tallyTreeDepth,
          smallTallyTestData,
          3
        )
      ).to.be.revertedWith('IncorrectTallyResult')
    })

    it.skip('should verify that amount of spent voice credits is correct', async () => {
      await token.transfer(fundingRound.address, budget)
      await tally.mock.verifyPerVOSpentVoiceCredits.returns(false)

      await addTallyResultsBatch(
        fundingRound.connect(coordinator),
        tallyTreeDepth,
        smallTallyTestData,
        3
      )
      await finalizeRound(fundingRound, totalSpent, totalSpentSalt)

      const claimData = getRecipientClaimData(
        recipientIndex,
        tallyTreeDepth,
        smallTallyTestData
      )
      await expect(
        fundingRoundAsRecipient.claimFunds(...claimData)
      ).to.be.revertedWith('IncorrectSpentVoiceCredits')
    })
  })

  describe('finalizing with alpha', function () {
    this.timeout(2 * 60 * 1000)
    const treeDepth = 2
    const totalSpentSalt = genRandomSalt().toString()

    beforeEach(async () => {
      maci = await deployMaciMock()
      poll = await deployMockContractByName('Poll')
      tally = await deployMockContractByName('Tally')
      pollId = BigInt(0)
      await tally.mock.verifyTallyResult.returns(true)
      await tally.mock.verifySpentVoiceCredits.returns(true)
      await poll.mock.treeDepths.returns(1, 1, 1, treeDepth)
      await maci.mock.getPoll.returns(poll.address)

      // round.isTallied() = tallyBatchSize * tallyBatchNum >= numSignups
      await poll.mock.numSignUpsAndMessages.returns(numSignUps, 1)
      await poll.mock.batchSizes.returns(1, tallyBatchSize, 1)
      await tally.mock.verifyPerVOSpentVoiceCredits.returns(true)
      await tally.mock.tallyBatchNum.returns(tallyBatchNum)

      // round.isVotingOver()
      const deployTime = (await provider.getBlock('latest')).timestamp
      await poll.mock.getDeployTimeAndDuration.returns(deployTime, pollDuration)
      await recipientRegistry.mock.getRecipientAddress.returns(
        recipient.address
      )

      await fundingRound.setMaci(maci.address)
      await fundingRound.setPoll(pollId)
      await fundingRound.connect(coordinator).setTally(tally.address)
      await recipientRegistry.mock.getRecipientAddress.returns(
        recipient.address
      )

      await token.transfer(fundingRound.address, budget)

      const fundingRoundAsCoordinator = fundingRound.connect(coordinator)
      await fundingRoundAsCoordinator.publishTallyHash(tallyHash)

      await provider.send('evm_increaseTime', [pollDuration])
    })

    it('adds and verifies tally results', async function () {
      this.timeout(2 * 60 * 1000)
      await addTallyResultsBatch(
        fundingRound.connect(coordinator),
        treeDepth,
        smallTallyTestData,
        5
      )

      const totalResults = await fundingRound.totalTallyResults()
      expect(totalResults.toNumber()).to.eq(25, 'total verified mismatch')

      const totalSquares = await fundingRound.totalVotesSquares()
      expect(totalSquares.toString()).to.eq(
        totalQuadraticVotes,
        'sum of squares mismatch'
      )
    })

    it('calculates alpha correctly', async function () {
      this.timeout(2 * 60 * 1000)
      await addTallyResultsBatch(
        fundingRound.connect(coordinator),
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
        fundingRound.connect(coordinator),
        treeDepth,
        smallTallyTestData,
        3
      )
      await finalizeRound(fundingRound, totalSpent, totalSpentSalt)

      const alpha = await fundingRound.alpha()
      expect(alpha.toString()).to.eq(
        expectedAlpha.toString(),
        'invalid funding round alpha'
      )
    })

    it('fails to finalize if no project has more than 1 vote', async function () {
      const tallyTreeDepth = 1
      await poll.mock.treeDepths.returns(1, 1, 1, tallyTreeDepth)
      const tallyWith1Contributor = {
        newTallyCommitment:
          '0x2a7a1fe8c2773fdba262033741655070ba52fea7c1333049ec87c2c248e600bb',
        results: {
          commitment:
            '0x2f44c97ce649078012fd686eaf996fc6b8d817e11ab574f0d0a0d750ee1ec101',
          tally: [0, 200, 200, 0, 0],
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
          tally: ['0', '40000', '40000', '0', '0'],
          salt: '0x2013aa4e350542684f78adbf3e716c3bcf96e12c64b8e8ef3d962e3568132778',
        },
        salt: '0x63c80f2b0319790c19b3b17ecd7b00fc1dc7398198601d0dfb30253306ecb34',
      }
      const batchSize = 3
      await addTallyResultsBatch(
        fundingRound.connect(coordinator),
        tallyTreeDepth,
        tallyWith1Contributor,
        batchSize
      )

      await expect(
        finalizeRound(fundingRound, totalSpent, totalSpentSalt)
      ).to.be.revertedWith('NoProjectHasMoreThanOneVote')
    })

    it('calculates claim funds correctly', async function () {
      await addTallyResultsBatch(
        fundingRound.connect(coordinator),
        treeDepth,
        smallTallyTestData,
        20
      )
      await finalizeRound(fundingRound, totalSpent, totalSpentSalt)

      const { tally } = smallTallyTestData.results
      const { tally: spents } = smallTallyTestData.perVOSpentVoiceCredits

      for (let i = 0; i < tally.length; i++) {
        const tallyResult = tally[i]
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

    it.skip('prevents finalize if tally results not completely received', async function () {
      // increase the number of signup to simulate incomplete tallying
      await poll.mock.numSignUpsAndMessages.returns(numSignUps * 2, 1)
      await addTallyResultsBatch(
        fundingRound.connect(coordinator),
        tallyTreeDepth,
        smallTallyTestData,
        tallyBatchSize
      )

      await expect(
        finalizeRound(fundingRound, totalSpent, totalSpentSalt)
      ).to.be.revertedWith('FundingRound: Incomplete tally results')
    })

    it('allows only coordinator to add tally results', async function () {
      const fundingRoundAsContributor = fundingRound.connect(contributor)
      await expect(
        addTallyResultsBatch(
          fundingRoundAsContributor,
          tallyTreeDepth,
          smallTallyTestData,
          5
        )
      ).to.be.revertedWith('NotCoordinator')
    })

    it('allows only coordinator to add tally results in batches', async function () {
      const fundingRoundAsContributor = fundingRound.connect(contributor)
      await expect(
        addTallyResultsBatch(
          fundingRoundAsContributor,
          tallyTreeDepth,
          smallTallyTestData,
          5
        )
      ).to.be.revertedWith('NotCoordinator')
    })

    it('prevents adding tally results if maci has not completed tallying', async function () {
      // increase the number of signup to simulate incomplete tallying
      await poll.mock.numSignUpsAndMessages.returns(numSignUps * 2, 1)

      await expect(
        addTallyResultsBatch(
          fundingRound.connect(coordinator),
          tallyTreeDepth,
          smallTallyTestData,
          5
        )
      ).to.be.revertedWith('VotesNotTallied')
    })

    it('prevents adding batches of tally results if maci has not completed tallying', async function () {
      // increase the number of signup to simulate incomplete tallying
      await poll.mock.numSignUpsAndMessages.returns(numSignUps * 2, 1)

      await expect(
        addTallyResultsBatch(
          fundingRound.connect(coordinator),
          tallyTreeDepth,
          smallTallyTestData,
          5
        )
      ).to.be.revertedWith('VotesNotTallied')
    })

    it('prevent adding more tally results if already finalized', async () => {
      //await maci.mock.treeDepths.returns(10, 10, tallyTreeDepth)

      await addTallyResultsBatch(
        fundingRound.connect(coordinator),
        tallyTreeDepth,
        smallTallyTestData,
        5
      )

      await finalizeRound(fundingRound, totalSpent, totalSpentSalt)
      await expect(
        addTallyResultsBatch(
          fundingRound.connect(coordinator),
          tallyTreeDepth,
          smallTallyTestData,
          5
        )
      ).to.be.revertedWith('RoundAlreadyFinalized')
    })

    it('prevents adding tally results that were already verified', async function () {
      await addTallyResultsBatch(
        fundingRound.connect(coordinator),
        tallyTreeDepth,
        smallTallyTestData,
        5
      )
      await expect(
        addTallyResultsBatch(
          fundingRound.connect(coordinator),
          tallyTreeDepth,
          smallTallyTestData,
          5
        )
      ).to.revertedWith('VoteResultsAlreadyVerified')
    })

    it('returns correct proccessed count in the callback for processing tally results', async () => {
      const startIndex = 0
      const batchSize = 10
      let batchCount = 0
      const total = smallTallyTestData.results.tally.length
      const lastBatch = Math.ceil(total / batchSize)
      await addTallyResultsBatch(
        fundingRound.connect(coordinator),
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

  describe('getRecipientTallyResultsBatch', () => {
    const treeDepth = 5
    const batchSize = 5
    const total = smallTallyTestData.results.tally.length
    for (const startIndex of [0, Math.floor(total / 2)]) {
      it(`should pass with startIndex ${startIndex}`, () => {
        const data = getRecipientTallyResultsBatch(
          startIndex,
          treeDepth,
          smallTallyTestData,
          batchSize
        )
        expect(data).to.have.lengthOf(3)
        expect(data[1]).to.have.lengthOf(5)
      })
    }
    it(`should pass with startIndex ${total - 1}`, () => {
      const data = getRecipientTallyResultsBatch(
        total - 1,
        treeDepth,
        smallTallyTestData,
        batchSize
      )
      expect(data).to.have.lengthOf(3)
      expect(data[1]).to.have.lengthOf(1)
    })
    it(`should fail with startIndex ${total}`, () => {
      const startIndex = total
      expect(() => {
        getRecipientTallyResultsBatch(
          startIndex,
          treeDepth,
          smallTallyTestData,
          batchSize
        )
      }).to.throw('Recipient index out of bound')
    })
  })

  describe('Alpha calculation', () => {
    it('fails alpha calculation if budget less than contributions', async function () {
      const totalBudget = 99
      const totalVotesSquares = 120
      const totalSpent = 100
      await expect(
        fundingRound.calcAlpha(totalBudget, totalVotesSquares, totalSpent)
      ).to.be.revertedWith('InvalidBudget')
    })

    it('fails alpha calculation if no project has more than 1 vote', async function () {
      const totalBudget = ethers.utils.parseEther('200')
      const totalVotesSquares = 88
      const totalSpent = 100
      await expect(
        fundingRound.calcAlpha(totalBudget, totalVotesSquares, totalSpent)
      ).to.be.revertedWith('NoProjectHasMoreThanOneVote')
    })
  })
})
