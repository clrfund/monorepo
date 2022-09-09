import { ethers, waffle, artifacts } from 'hardhat'
import { use, expect } from 'chai'
import { solidity } from 'ethereum-waffle'
import { deployMockContract } from '@ethereum-waffle/mock-contract'
import { Contract } from 'ethers'
import { defaultAbiCoder } from '@ethersproject/abi'
import { genRandomSalt } from 'maci-crypto'
import { Keypair } from 'maci-domainobjs'

import { ZERO_ADDRESS, UNIT, VOICE_CREDIT_FACTOR } from '../utils/constants'
import { getEventArg, getGasUsage } from '../utils/contracts'
import { deployMaciFactory } from '../utils/deployment'
import {
  bnSqrt,
  createMessage,
  addTallyResults,
  addTallyResultsBatch,
  getRecipientClaimData,
} from '../utils/maci'

use(solidity)

// ethStaker test vectors for Quadratic Funding with alpha
import smallTallyTestData from './data/testTallySmall.json'
import claimAmounts from './data/claimAmounts.json'
const budget = ethers.utils.parseEther('440274')
const expectedTotalVotes = '8202951014814'
const expectedAlpha = '4583670112189981'

describe('Funding Round', () => {
  const provider = waffle.provider
  const [, deployer, coordinator, contributor, anotherContributor, recipient] =
    provider.getWallets()

  const coordinatorPubKey = new Keypair().pubKey
  const signUpDuration = 86400 * 7 // Default duration in MACI factory
  const votingDuration = 86400 * 7 // Default duration in MACI factory
  const userKeypair = new Keypair()
  const contributionAmount = UNIT.mul(10)
  const tallyHash = 'test'
  const tallyTreeDepth = 2

  let token: Contract
  let userRegistry: Contract
  let recipientRegistry: Contract
  let fundingRound: Contract
  let maci: Contract

  async function deployMaciMock(): Promise<Contract> {
    const MACIArtifact = await artifacts.readArtifact('MACI')
    const maci = await deployMockContract(deployer, MACIArtifact.abi)
    const currentTime = (await provider.getBlock('latest')).timestamp
    const signUpDeadline = currentTime + signUpDuration
    const votingDeadline = signUpDeadline + votingDuration
    await maci.mock.signUpTimestamp.returns(currentTime)
    await maci.mock.signUpDurationSeconds.returns(signUpDuration)
    await maci.mock.votingDurationSeconds.returns(votingDuration)
    await maci.mock.calcSignUpDeadline.returns(signUpDeadline)
    await maci.mock.calcVotingDeadline.returns(votingDeadline)
    await maci.mock.maxUsers.returns(100)
    await maci.mock.treeDepths.returns(10, 10, 2)
    await maci.mock.signUp.returns()
    return maci
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

    const IRecipientRegistryArtifact = await artifacts.readArtifact(
      'IRecipientRegistry'
    )
    recipientRegistry = await deployMockContract(
      deployer,
      IRecipientRegistryArtifact.abi
    )

    const FundingRound = await ethers.getContractFactory('FundingRound', {
      signer: deployer,
    })
    fundingRound = await FundingRound.deploy(
      token.address,
      userRegistry.address,
      recipientRegistry.address,
      coordinator.address
    )
    const circuit = 'prod'
    const maciFactory = await deployMaciFactory(deployer, circuit)
    const maciDeployed = await maciFactory.deployMaci(
      fundingRound.address,
      fundingRound.address,
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
      'FundingRound: Already linked to MACI instance'
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
        .withArgs([], 1, expectedVoiceCredits)
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
      ).to.be.revertedWith('FundingRound: MACI not deployed')
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
      ).to.be.revertedWith('FundingRound: Round finalized')
    })

    it('rejects contributions with zero amount', async () => {
      await fundingRound.setMaci(maci.address)
      await tokenAsContributor.approve(fundingRound.address, contributionAmount)
      await expect(
        fundingRoundAsContributor.contribute(userPubKey, 0)
      ).to.be.revertedWith(
        'FundingRound: Contribution amount must be greater than zero'
      )
    })

    it('rejects contributions that are too large', async () => {
      await fundingRound.setMaci(maci.address)
      const contributionAmount = UNIT.mul(10001)
      await tokenAsContributor.approve(fundingRound.address, contributionAmount)
      await expect(
        fundingRoundAsContributor.contribute(userPubKey, contributionAmount)
      ).to.be.revertedWith('FundingRound: Contribution amount is too large')
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
      ).to.be.revertedWith('FundingRound: Already contributed')
    })

    it('requires approval', async () => {
      await fundingRound.setMaci(maci.address)
      await expect(
        fundingRoundAsContributor.contribute(userPubKey, contributionAmount)
      ).to.be.revertedWith('ERC20: transfer amount exceeds allowance')
    })

    it('rejects contributions from unverified users', async () => {
      await fundingRound.setMaci(maci.address)
      await tokenAsContributor.approve(fundingRound.address, contributionAmount)
      await userRegistry.mock.isVerifiedUser.returns(false)
      await expect(
        fundingRoundAsContributor.contribute(userPubKey, contributionAmount)
      ).to.be.revertedWith('FundingRound: User has not been verified')
    })

    it('should not allow users who have not contributed to sign up directly in MACI', async () => {
      await fundingRound.setMaci(maci.address)
      const signUpData = defaultAbiCoder.encode(
        ['address'],
        [contributor.address]
      )
      await expect(
        maci.signUp(userPubKey, signUpData, encodedContributorAddress)
      ).to.be.revertedWith('FundingRound: User has not contributed')
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
      ).to.be.revertedWith('FundingRound: User already registered')
    })

    it('should not return the amount of voice credits for user who has not contributed', async () => {
      await expect(
        fundingRound.getVoiceCredits(
          fundingRound.address,
          encodedContributorAddress
        )
      ).to.be.revertedWith('FundingRound: User does not have any voice credits')
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
      await provider.send('evm_increaseTime', [signUpDuration])
    })

    it('submits a vote', async () => {
      const [message, encPubKey] = createMessage(
        userStateIndex,
        userKeypair,
        null,
        coordinatorPubKey,
        recipientIndex,
        singleVote,
        nonce
      )
      const messagePublished = maci.publishMessage(
        message.asContractParam(),
        encPubKey.asContractParam()
      )
      await expect(messagePublished).to.emit(maci, 'PublishMessage')
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
        nonce
      )
      await maci.publishMessage(
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
        nonce
      )
      await maci.publishMessage(
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
        nonce + 1
      )
      await maci.publishMessage(
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
        nonce
      )
      await maci.publishMessage(
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
          nonce
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
        'FundingRound: Sender is not the coordinator'
      )
    })

    it('reverts if round has been finalized', async () => {
      await fundingRound.cancel()
      await expect(
        fundingRound.connect(coordinator).publishTallyHash(tallyHash)
      ).to.be.revertedWith('FundingRound: Round finalized')
    })

    it('rejects empty string', async () => {
      await expect(
        fundingRound.connect(coordinator).publishTallyHash('')
      ).to.be.revertedWith('FundingRound: Tally hash is empty string')
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
      await maci.mock.hasUntalliedStateLeaves.returns(false)
      await maci.mock.totalVotes.returns(totalVotes)
      await maci.mock.verifySpentVoiceCredits.returns(true)
      await maci.mock.verifyTallyResult.returns(true)
      await maci.mock.treeDepths.returns(10, 10, tallyTreeDepth)
      await maci.mock.verifyPerVOSpentVoiceCredits.returns(true)

      await token
        .connect(contributor)
        .approve(fundingRound.address, totalContributions)
    })

    it('allows owner to finalize round', async () => {
      await fundingRound.setMaci(maci.address)
      await fundingRound
        .connect(contributor)
        .contribute(userKeypair.pubKey.asContractParam(), totalContributions)
      await provider.send('evm_increaseTime', [signUpDuration + votingDuration])
      await fundingRound.connect(coordinator).publishTallyHash(tallyHash)
      await token.transfer(fundingRound.address, matchingPoolSize)

      await addTallyResultsBatch(
        fundingRound,
        tallyTreeDepth,
        smallTallyTestData,
        5
      )
      await fundingRound.finalize(totalSpent, totalSpentSalt)
      expect(await fundingRound.isFinalized()).to.equal(true)
      expect(await fundingRound.isCancelled()).to.equal(false)
      expect(await fundingRound.totalSpent()).to.equal(totalSpent)
      expect(await fundingRound.totalVotes()).to.equal(totalVotes)
      expect(await fundingRound.matchingPoolSize()).to.equal(matchingPoolSize)
    })

    it('allows owner to finalize round when matching pool is empty', async () => {
      await fundingRound.setMaci(maci.address)
      await fundingRound
        .connect(contributor)
        .contribute(userKeypair.pubKey.asContractParam(), totalContributions)
      await provider.send('evm_increaseTime', [signUpDuration + votingDuration])
      await fundingRound.connect(coordinator).publishTallyHash(tallyHash)

      await addTallyResultsBatch(
        fundingRound,
        tallyTreeDepth,
        smallTallyTestData,
        5
      )
      await fundingRound.finalize(totalSpent, totalSpentSalt)
      expect(await fundingRound.totalSpent()).to.equal(totalSpent)
      expect(await fundingRound.totalVotes()).to.equal(totalVotes)
      expect(await fundingRound.matchingPoolSize()).to.equal(0)
    })

    it('counts direct token transfers to funding round as matching pool contributions', async () => {
      await fundingRound.setMaci(maci.address)
      await fundingRound
        .connect(contributor)
        .contribute(userKeypair.pubKey.asContractParam(), totalContributions)
      await provider.send('evm_increaseTime', [signUpDuration + votingDuration])
      await fundingRound.connect(coordinator).publishTallyHash(tallyHash)
      await token.transfer(fundingRound.address, matchingPoolSize)
      await token
        .connect(contributor)
        .transfer(fundingRound.address, contributionAmount)

      await addTallyResultsBatch(
        fundingRound,
        tallyTreeDepth,
        smallTallyTestData,
        5
      )
      await fundingRound.finalize(totalSpent, totalSpentSalt)
      expect(await fundingRound.matchingPoolSize()).to.equal(
        matchingPoolSize.add(contributionAmount)
      )
    })

    it('reverts if round has been finalized already', async () => {
      await fundingRound.setMaci(maci.address)
      await fundingRound
        .connect(contributor)
        .contribute(userKeypair.pubKey.asContractParam(), totalContributions)
      await provider.send('evm_increaseTime', [signUpDuration + votingDuration])
      await fundingRound.connect(coordinator).publishTallyHash(tallyHash)
      await token.transfer(fundingRound.address, matchingPoolSize)
      await addTallyResultsBatch(
        fundingRound,
        tallyTreeDepth,
        smallTallyTestData,
        5
      )

      await fundingRound.finalize(totalSpent, totalSpentSalt)
      await expect(
        fundingRound.finalize(totalSpent, totalSpentSalt)
      ).to.be.revertedWith('FundingRound: Already finalized')
    })

    it('reverts MACI has not been deployed', async () => {
      await provider.send('evm_increaseTime', [signUpDuration + votingDuration])
      await expect(
        fundingRound.finalize(totalSpent, totalSpentSalt)
      ).to.be.revertedWith('FundingRound: MACI not deployed')
    })

    it('reverts if voting is still in progress', async () => {
      await fundingRound.setMaci(maci.address)
      await fundingRound
        .connect(contributor)
        .contribute(userKeypair.pubKey.asContractParam(), totalContributions)
      await provider.send('evm_increaseTime', [signUpDuration])

      await expect(
        fundingRound.finalize(totalSpent, totalSpentSalt)
      ).to.be.revertedWith('FundingRound: Voting has not been finished')
    })

    it('reverts if votes has not been tallied', async () => {
      await fundingRound.setMaci(maci.address)
      await fundingRound
        .connect(contributor)
        .contribute(userKeypair.pubKey.asContractParam(), totalContributions)
      await provider.send('evm_increaseTime', [signUpDuration + votingDuration])
      await maci.mock.hasUntalliedStateLeaves.returns(true)

      await expect(
        fundingRound.finalize(totalSpent, totalSpentSalt)
      ).to.be.revertedWith('FundingRound: Votes has not been tallied')
    })

    it('reverts if tally hash has not been published', async () => {
      await fundingRound.setMaci(maci.address)
      await fundingRound
        .connect(contributor)
        .contribute(userKeypair.pubKey.asContractParam(), totalContributions)
      await provider.send('evm_increaseTime', [signUpDuration + votingDuration])

      await expect(
        fundingRound.finalize(totalSpent, totalSpentSalt)
      ).to.be.revertedWith('FundingRound: Tally hash has not been published')
    })

    it('reverts if total votes is zero', async () => {
      await fundingRound.setMaci(maci.address)
      await fundingRound
        .connect(contributor)
        .contribute(userKeypair.pubKey.asContractParam(), totalContributions)
      await provider.send('evm_increaseTime', [signUpDuration + votingDuration])
      await fundingRound.connect(coordinator).publishTallyHash(tallyHash)
      await token.transfer(fundingRound.address, matchingPoolSize)
      await maci.mock.totalVotes.returns(0)

      await addTallyResultsBatch(
        fundingRound,
        tallyTreeDepth,
        smallTallyTestData,
        5
      )
      await expect(
        fundingRound.finalize(totalSpent, totalSpentSalt)
      ).to.be.revertedWith('FundingRound: No votes')
    })

    it('reverts if total amount of spent voice credits is incorrect', async () => {
      await fundingRound.setMaci(maci.address)
      await fundingRound
        .connect(contributor)
        .contribute(userKeypair.pubKey.asContractParam(), totalContributions)
      await provider.send('evm_increaseTime', [signUpDuration + votingDuration])
      await fundingRound.connect(coordinator).publishTallyHash(tallyHash)
      await token.transfer(fundingRound.address, matchingPoolSize)
      await maci.mock.verifySpentVoiceCredits.returns(false)

      await addTallyResultsBatch(
        fundingRound,
        tallyTreeDepth,
        smallTallyTestData,
        5
      )

      await expect(
        fundingRound.finalize(totalSpent, totalSpentSalt)
      ).to.be.revertedWith(
        'FundingRound: Incorrect total amount of spent voice credits'
      )
    })

    it('allows only owner to finalize round', async () => {
      await fundingRound.setMaci(maci.address)
      await fundingRound
        .connect(contributor)
        .contribute(userKeypair.pubKey.asContractParam(), totalContributions)
      await provider.send('evm_increaseTime', [signUpDuration + votingDuration])
      await fundingRound.connect(coordinator).publishTallyHash(tallyHash)
      await token.transfer(fundingRound.address, matchingPoolSize)

      const fundingRoundAsCoordinator = fundingRound.connect(coordinator)
      await expect(
        fundingRoundAsCoordinator.finalize(totalSpent, totalSpentSalt)
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
      await fundingRound.setMaci(maci.address)
      await token
        .connect(contributor)
        .approve(fundingRound.address, totalContributions)
      await fundingRound
        .connect(contributor)
        .contribute(userKeypair.pubKey.asContractParam(), totalContributions)
      await provider.send('evm_increaseTime', [signUpDuration + votingDuration])
      await maci.mock.hasUntalliedStateLeaves.returns(false)
      await maci.mock.totalVotes.returns(bnSqrt(totalSpent))
      await maci.mock.verifySpentVoiceCredits.returns(true)
      await maci.mock.treeDepths.returns(10, 10, tallyTreeDepth)
      await maci.mock.verifySpentVoiceCredits.returns(true)
      await maci.mock.verifyPerVOSpentVoiceCredits.returns(true)
      await maci.mock.verifyTallyResult.returns(true)
      await fundingRound.connect(coordinator).publishTallyHash(tallyHash)
      await token.transfer(fundingRound.address, matchingPoolSize)
      await addTallyResultsBatch(
        fundingRound,
        tallyTreeDepth,
        smallTallyTestData,
        3
      )
      await fundingRound.finalize(totalSpent, totalSpentSalt)

      await expect(fundingRound.cancel()).to.be.revertedWith(
        'FundingRound: Already finalized'
      )
    })

    it('reverts if round has been cancelled already', async () => {
      await fundingRound.cancel()
      await expect(fundingRound.cancel()).to.be.revertedWith(
        'FundingRound: Already finalized'
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
      ).to.be.revertedWith('FundingRound: Round not cancelled')
    })

    it('reverts if user did not contribute to the round', async () => {
      await fundingRound.cancel()
      await expect(
        fundingRoundAsContributor.withdrawContribution()
      ).to.be.revertedWith('FundingRound: Nothing to withdraw')
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
      ).to.be.revertedWith('FundingRound: Nothing to withdraw')
    })
  })

  describe('claiming funds', () => {
    const totalVotes = expectedTotalVotes
    const recipientIndex = 3
    const { spent: totalSpent, salt: totalSpentSalt } =
      smallTallyTestData.totalVoiceCredits
    const contributions =
      smallTallyTestData.totalVoiceCreditsPerVoteOption.tally[recipientIndex]

    const expectedAllocatedAmount = claimAmounts.amount[recipientIndex]
    let fundingRoundAsRecipient: Contract
    let fundingRoundAsContributor: Contract

    beforeEach(async () => {
      maci = await deployMaciMock()
      await maci.mock.hasUntalliedStateLeaves.returns(false)
      await maci.mock.totalVotes.returns(totalVotes)
      await maci.mock.verifySpentVoiceCredits.returns(true)
      await maci.mock.verifyTallyResult.returns(true)
      await maci.mock.verifyPerVOSpentVoiceCredits.returns(true)
      await maci.mock.treeDepths.returns(10, 10, tallyTreeDepth)

      await recipientRegistry.mock.getRecipientAddress.returns(
        recipient.address
      )

      await fundingRound.setMaci(maci.address)
      const tokenAsContributor = token.connect(contributor)
      await tokenAsContributor.approve(fundingRound.address, contributions)
      fundingRoundAsContributor = fundingRound.connect(contributor)

      await provider.send('evm_increaseTime', [signUpDuration + votingDuration])
      await fundingRound.connect(coordinator).publishTallyHash(tallyHash)
      fundingRoundAsRecipient = fundingRound.connect(recipient)
    })

    it('allows recipient to claim allocated funds', async () => {
      await token.transfer(fundingRound.address, budget)
      await addTallyResultsBatch(
        fundingRound,
        tallyTreeDepth,
        smallTallyTestData,
        3
      )
      await fundingRound.finalize(totalSpent, totalSpentSalt)

      const { results, totalVoiceCreditsPerVoteOption } = smallTallyTestData
      expect(
        await fundingRound.getAllocatedAmount(
          results.tally[recipientIndex],
          totalVoiceCreditsPerVoteOption.tally[recipientIndex]
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
        fundingRound,
        tallyTreeDepth,
        smallTallyTestData,
        3
      )
      await fundingRound.finalize(totalSpent, totalSpentSalt)

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
        fundingRound,
        tallyTreeDepth,
        smallTallyTestData,
        3
      )
      await fundingRound.finalize(totalSpent, totalSpentSalt)

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
        fundingRound,
        tallyTreeDepth,
        smallTallyTestData,
        3
      )
      await fundingRound.finalize(totalSpent, totalSpentSalt)

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
      ).to.be.revertedWith('FundingRound: Round not finalized')
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
      ).to.be.revertedWith('FundingRound: Round has been cancelled')
    })

    it('sends funds allocated to unverified recipients back to matching pool', async () => {
      await token.transfer(fundingRound.address, budget)
      await addTallyResultsBatch(
        fundingRound,
        tallyTreeDepth,
        smallTallyTestData,
        3
      )
      await fundingRound.finalize(totalSpent, totalSpentSalt)
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
        fundingRound,
        tallyTreeDepth,
        smallTallyTestData,
        3
      )
      await fundingRound.finalize(totalSpent, totalSpentSalt)

      const claimData = getRecipientClaimData(
        recipientIndex,
        tallyTreeDepth,
        smallTallyTestData
      )
      await fundingRoundAsRecipient.claimFunds(...claimData)
      await expect(
        fundingRoundAsRecipient.claimFunds(...claimData)
      ).to.be.revertedWith('FundingRound: Funds already claimed')
    })

    it('should verify that tally result is correct', async () => {
      await token.transfer(fundingRound.address, budget)

      await maci.mock.verifyTallyResult.returns(false)
      await expect(
        addTallyResultsBatch(
          fundingRound,
          tallyTreeDepth,
          smallTallyTestData,
          3
        )
      ).to.be.revertedWith('FundingRound: Incorrect tally result')
    })

    it('should verify that amount of spent voice credits is correct', async () => {
      await token.transfer(fundingRound.address, budget)
      await maci.mock.verifyPerVOSpentVoiceCredits.returns(false)

      await addTallyResultsBatch(
        fundingRound,
        tallyTreeDepth,
        smallTallyTestData,
        3
      )
      await fundingRound.finalize(totalSpent, totalSpentSalt)

      const claimData = getRecipientClaimData(
        recipientIndex,
        tallyTreeDepth,
        smallTallyTestData
      )
      await expect(
        fundingRoundAsRecipient.claimFunds(...claimData)
      ).to.be.revertedWith(
        'FundingRound: Incorrect amount of spent voice credits'
      )
    })
  })

  describe('finalizing with alpha', function () {
    this.timeout(2 * 60 * 1000)
    const treeDepth = 2
    const totalVotes = 11382064
    beforeEach(async () => {
      maci = await deployMaciMock()
      await maci.mock.hasUntalliedStateLeaves.returns(false)
      await maci.mock.totalVotes.returns(totalVotes)
      await maci.mock.verifySpentVoiceCredits.returns(true)
      await maci.mock.verifyTallyResult.returns(true)
      await maci.mock.verifyPerVOSpentVoiceCredits.returns(true)
      await maci.mock.treeDepths.returns(10, 10, treeDepth)

      await recipientRegistry.mock.getRecipientAddress.returns(
        recipient.address
      )

      await token.transfer(fundingRound.address, budget)

      await fundingRound.setMaci(maci.address)

      const fundingRoundAsCoordinator = fundingRound.connect(coordinator)
      await fundingRoundAsCoordinator.publishTallyHash(tallyHash)

      await provider.send('evm_increaseTime', [signUpDuration + votingDuration])
    })

    it('adds and verifies tally results', async function () {
      this.timeout(2 * 60 * 1000)
      const skipZero = true
      await addTallyResults(
        fundingRound,
        treeDepth,
        smallTallyTestData,
        skipZero
      )

      const totalResults = await fundingRound.totalTallyResults()
      expect(totalResults.toNumber()).to.eq(20, 'total verified mismatch')

      const totalSquares = await fundingRound.totalVotesSquares()
      expect(totalSquares.toString()).to.eq(
        expectedTotalVotes,
        'sum of squares mismatch'
      )
    })

    it('calculates alpha correctly', async function () {
      this.timeout(2 * 60 * 1000)
      const skipZero = true
      await addTallyResults(
        fundingRound,
        treeDepth,
        smallTallyTestData,
        skipZero
      )

      const totalVotes = await fundingRound.totalVotesSquares()
      const { spent: totalSpent } = smallTallyTestData.totalVoiceCredits
      const calculatedAlpha = await fundingRound.calcAlpha(
        budget,
        totalVotes,
        totalSpent
      )
      expect(calculatedAlpha.toString()).to.eq(expectedAlpha, 'alpha mismatch')
    })

    it('finalizes successfully', async function () {
      await addTallyResultsBatch(fundingRound, treeDepth, smallTallyTestData, 3)
      const { spent, salt } = smallTallyTestData.totalVoiceCredits
      await fundingRound.finalize(spent, salt)

      const alpha = await fundingRound.alpha()
      expect(alpha.toString()).to.eq(
        expectedAlpha.toString(),
        'invalid funding round alpha'
      )
    })

    it('calculates claim funds correctly', async function () {
      await addTallyResultsBatch(
        fundingRound,
        treeDepth,
        smallTallyTestData,
        20
      )
      const { spent, salt } = smallTallyTestData.totalVoiceCredits
      await fundingRound.finalize(spent, salt)

      const { tally } = smallTallyTestData.results
      const { tally: spents } =
        smallTallyTestData.totalVoiceCreditsPerVoteOption

      for (let i = 0; i < tally.length; i++) {
        const tallyResult = tally[i]
        if (tallyResult !== '0') {
          const amount = await fundingRound.getAllocatedAmount(
            tallyResult,
            spents[i]
          )
          const expectedClaimAmount = claimAmounts.amount[i]
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
      const { spent, salt } = smallTallyTestData.totalVoiceCredits
      await expect(fundingRound.finalize(spent, salt)).to.be.revertedWith(
        'FundingRound: Incomplete tally results'
      )
    })

    it('prevents finalize if tally results not completely received', async function () {
      const { spent, salt } = smallTallyTestData.totalVoiceCredits
      await expect(fundingRound.finalize(spent, salt)).to.be.revertedWith(
        'FundingRound: Incomplete tally results'
      )
    })

    it('allows only owner to add tally results', async function () {
      const fundingRoundAsContributor = fundingRound.connect(contributor)
      await expect(
        addTallyResults(
          fundingRoundAsContributor,
          tallyTreeDepth,
          smallTallyTestData,
          true
        )
      ).to.be.revertedWith('Ownable: caller is not the owner')
    })

    it('allows only owner to add tally results in batches', async function () {
      const fundingRoundAsContributor = fundingRound.connect(contributor)
      await expect(
        addTallyResultsBatch(
          fundingRoundAsContributor,
          tallyTreeDepth,
          smallTallyTestData,
          5
        )
      ).to.be.revertedWith('Ownable: caller is not the owner')
    })

    it('prevents adding tally results if maci has not completed tallying', async function () {
      await maci.mock.hasUntalliedStateLeaves.returns(true)

      await expect(
        addTallyResults(fundingRound, tallyTreeDepth, smallTallyTestData, true)
      ).to.be.revertedWith('FundingRound: Votes have not been tallied')
    })

    it('prevents adding batches of tally results if maci has not completed tallying', async function () {
      await maci.mock.hasUntalliedStateLeaves.returns(true)

      await expect(
        addTallyResultsBatch(
          fundingRound,
          tallyTreeDepth,
          smallTallyTestData,
          5
        )
      ).to.be.revertedWith('FundingRound: Votes have not been tallied')
    })

    it('prevent adding more tally results if already finalized', async () => {
      await maci.mock.treeDepths.returns(10, 10, tallyTreeDepth)

      await addTallyResultsBatch(
        fundingRound,
        tallyTreeDepth,
        smallTallyTestData,
        5
      )

      const { spent, salt } = smallTallyTestData.totalVoiceCredits
      await fundingRound.finalize(spent, salt)
      await expect(
        addTallyResultsBatch(
          fundingRound,
          tallyTreeDepth,
          smallTallyTestData,
          5
        )
      ).to.be.revertedWith('FundingRound: Already finalized')
    })

    it('prevents adding tally results that were already verified', async function () {
      await addTallyResultsBatch(
        fundingRound,
        tallyTreeDepth,
        smallTallyTestData,
        5
      )
      await expect(
        addTallyResultsBatch(
          fundingRound,
          tallyTreeDepth,
          smallTallyTestData,
          5
        )
      ).to.revertedWith('FundingRound: Vote results already verified')
    })
  })

  describe('Alpha calculation', () => {
    it('fails alpha calculation if budget less than contributions', async function () {
      const totalBudget = 99
      const totalVotesSquares = 120
      const totalSpent = 100
      await expect(
        fundingRound.calcAlpha(totalBudget, totalVotesSquares, totalSpent)
      ).to.be.revertedWith('FundingRound: Invalid budget')
    })

    it('fails alpha calculation if total votes square less than total spent', async function () {
      const totalBudget = ethers.utils.parseEther('200')
      const totalVotesSquares = 88
      const totalSpent = 100
      await expect(
        fundingRound.calcAlpha(totalBudget, totalVotesSquares, totalSpent)
      ).to.be.revertedWith('FundingRound: Invalid tally results')
    })
  })
})
