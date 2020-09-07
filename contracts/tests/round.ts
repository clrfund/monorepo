import { ethers, waffle } from '@nomiclabs/buidler';
import { use, expect } from 'chai';
import { solidity } from 'ethereum-waffle';
import { deployMockContract } from '@ethereum-waffle/mock-contract';
import { Contract } from 'ethers';
import { defaultAbiCoder } from '@ethersproject/abi';
import { genRandomSalt } from 'maci-crypto';
import { Keypair } from 'maci-domainobjs';

import IVerifiedUserRegistryArtifact from '../build/contracts/IVerifiedUserRegistry.json';
import IRecipientRegistryArtifact from '../build/contracts/IRecipientRegistry.json';
import MACIArtifact from '../build/contracts/MACI.json';
import { ZERO_ADDRESS, UNIT, VOICE_CREDIT_FACTOR } from '../utils/constants'
import { getEventArg, getGasUsage } from '../utils/contracts'
import { deployMaciFactory } from '../utils/deployment'
import { bnSqrt, createMessage } from '../utils/maci'

use(solidity);

describe('Funding Round', () => {
  const provider = waffle.provider;
  const [, deployer, coordinator, contributor, recipient] = provider.getWallets()

  const coordinatorPubKey = (new Keypair()).pubKey;
  const signUpDuration = 86400 * 7;  // Default duration in MACI factory
  const votingDuration = 86400 * 7;  // Default duration in MACI factory
  const userKeypair = new Keypair()
  const contributionAmount = UNIT.mul(10)

  let token: Contract;
  let verifiedUserRegistry: Contract;
  let recipientRegistry: Contract;
  let fundingRound: Contract;
  let maci: Contract;

  async function deployMaciMock(): Promise<Contract> {
    const maci = await deployMockContract(deployer, MACIArtifact.abi)
    const signUpDeadline = (await provider.getBlock('latest')).timestamp + signUpDuration
    const votingDeadline = signUpDeadline + votingDuration
    await maci.mock.calcSignUpDeadline.returns(signUpDeadline)
    await maci.mock.calcVotingDeadline.returns(votingDeadline)
    await maci.mock.maxUsers.returns(100)
    await maci.mock.treeDepths.returns(10, 10, 2)
    await maci.mock.signUp.returns()
    return maci
  }

  beforeEach(async () => {
    const tokenInitialSupply = UNIT.mul(1000000)
    const Token = await ethers.getContractFactory('AnyOldERC20Token', deployer);
    token = await Token.deploy(tokenInitialSupply);
    await token.transfer(contributor.address, tokenInitialSupply.div(4))
    await token.transfer(coordinator.address, tokenInitialSupply.div(4))

    verifiedUserRegistry = await deployMockContract(deployer, IVerifiedUserRegistryArtifact.abi);
    await verifiedUserRegistry.mock.isVerifiedUser.returns(true);

    recipientRegistry = await deployMockContract(deployer, IRecipientRegistryArtifact.abi);

    const FundingRound = await ethers.getContractFactory('FundingRound', deployer);
    fundingRound = await FundingRound.deploy(
      token.address,
      verifiedUserRegistry.address,
      recipientRegistry.address,
      signUpDuration,
      coordinatorPubKey.asContractParam(),
    );
    const maciFactory = await deployMaciFactory(deployer);
    const maciDeployed = await maciFactory.deployMaci(
      fundingRound.address,
      fundingRound.address,
      coordinatorPubKey.asContractParam(),
    );
    const maciAddress = await getEventArg(maciDeployed, maciFactory, 'MaciDeployed', '_maci');
    maci = await ethers.getContractAt(MACIArtifact.abi, maciAddress);
  });

  it('initializes funding round correctly', async () => {
    expect(await fundingRound.owner()).to.equal(deployer.address);
    expect(await fundingRound.nativeToken()).to.equal(token.address);
    expect(await fundingRound.voiceCreditFactor()).to.equal(VOICE_CREDIT_FACTOR)
    expect(await fundingRound.verifiedUserRegistry()).to.equal(verifiedUserRegistry.address);
    expect(await fundingRound.recipientRegistry()).to.equal(recipientRegistry.address);
    expect(await fundingRound.isFinalized()).to.equal(false);
    expect(await fundingRound.isCancelled()).to.equal(false);
    expect(await fundingRound.maci()).to.equal(ZERO_ADDRESS);
  });

  it('allows owner to set MACI address', async () => {
    await fundingRound.setMaci(maci.address);
    expect(await fundingRound.maci()).to.equal(maci.address);
  });

  it('allows to set MACI address only once', async () => {
    await fundingRound.setMaci(maci.address);
    await expect(fundingRound.setMaci(maci.address))
      .to.be.revertedWith('FundingRound: Already linked to MACI instance');
  });

  it('allows only owner to set MACI address', async () => {
    const fundingRoundAsCoordinator = fundingRound.connect(coordinator);
    await expect(fundingRoundAsCoordinator.setMaci(maci.address))
      .to.be.revertedWith('Ownable: caller is not the owner');
  });

  describe('accepting contributions', () => {
    const userPubKey = userKeypair.pubKey.asContractParam()
    const encodedContributorAddress = defaultAbiCoder.encode(['address'], [contributor.address]);
    let tokenAsContributor: Contract;
    let fundingRoundAsContributor: Contract;

    beforeEach(async () => {
      tokenAsContributor = token.connect(contributor);
      fundingRoundAsContributor = fundingRound.connect(contributor);
    });

    it('accepts contributions from everyone', async () => {
      await fundingRound.setMaci(maci.address);
      await tokenAsContributor.approve(
        fundingRound.address,
        contributionAmount,
      );
      const expectedVoiceCredits = contributionAmount.div(VOICE_CREDIT_FACTOR)
      await expect(fundingRoundAsContributor.contribute(userPubKey, contributionAmount))
        .to.emit(fundingRound, 'NewContribution')
        .withArgs(contributor.address, contributionAmount)
        .to.emit(maci, 'SignUp')
        // We use [] to skip argument matching, otherwise it will fail
        // Possibly related: https://github.com/EthWorks/Waffle/issues/245
        .withArgs([], 1, expectedVoiceCredits)
      expect(await token.balanceOf(fundingRound.address))
        .to.equal(contributionAmount);

      expect(await fundingRound.getVoiceCredits(
        fundingRound.address,
        encodedContributorAddress,
      )).to.equal(expectedVoiceCredits)
    });

    it('rejects contributions if MACI has not been linked to a round', async () => {
      await tokenAsContributor.approve(
        fundingRound.address,
        contributionAmount,
      );
      await expect(fundingRoundAsContributor.contribute(userPubKey, contributionAmount))
        .to.be.revertedWith('FundingRound: MACI not deployed');
    });

    it('limits the number of contributors', async () => {
      // TODO: add test later
    });

    it('rejects contributions if funding round has been finalized', async () => {
      await fundingRound.setMaci(maci.address);
      await fundingRound.cancel();
      await tokenAsContributor.approve(
        fundingRound.address,
        contributionAmount,
      );
      await expect(fundingRoundAsContributor.contribute(userPubKey, contributionAmount))
        .to.be.revertedWith('FundingRound: Round finalized');
    });

    it('rejects contributions with zero amount', async () => {
      await fundingRound.setMaci(maci.address);
      await tokenAsContributor.approve(
        fundingRound.address,
        contributionAmount,
      );
      await expect(fundingRoundAsContributor.contribute(userPubKey, 0))
        .to.be.revertedWith('FundingRound: Contribution amount must be greater than zero');
    });

    it('rejects contributions that are too large', async () => {
      await fundingRound.setMaci(maci.address)
      const contributionAmount = UNIT.mul(10001)
      await tokenAsContributor.approve(
        fundingRound.address,
        contributionAmount,
      )
      await expect(fundingRoundAsContributor.contribute(userPubKey, contributionAmount))
        .to.be.revertedWith('FundingRound: Contribution amount is too large')
    })

    it('allows to contribute only once per round', async () => {
      await fundingRound.setMaci(maci.address);
      await tokenAsContributor.approve(
        fundingRound.address,
        contributionAmount.mul(2),
      );
      await fundingRoundAsContributor.contribute(userPubKey, contributionAmount)
      await expect(fundingRoundAsContributor.contribute(userPubKey, contributionAmount))
        .to.be.revertedWith('FundingRound: Already contributed');
    });

    it('requires approval', async () => {
      await fundingRound.setMaci(maci.address);
      await expect(fundingRoundAsContributor.contribute(userPubKey, contributionAmount))
        .to.be.revertedWith('revert ERC20: transfer amount exceeds allowance');
    });

    it('rejects contributions from unverified users', async () => {
      await fundingRound.setMaci(maci.address);
      await tokenAsContributor.approve(
        fundingRound.address,
        contributionAmount,
      );
      await verifiedUserRegistry.mock.isVerifiedUser.returns(false);
      await expect(fundingRoundAsContributor.contribute(userPubKey, contributionAmount))
        .to.be.revertedWith('FundingRound: User has not been verified');
    });

    it('should not allow users who have not contributed to sign up directly in MACI', async () => {
      await fundingRound.setMaci(maci.address);
      const signUpData = defaultAbiCoder.encode(
        ['address'],
        [contributor.address],
      );
      await expect(maci.signUp(userPubKey, signUpData, encodedContributorAddress))
        .to.be.revertedWith('FundingRound: User has not contributed');
    });

    it('should not allow users who have already signed up to sign up directly in MACI', async () => {
      await fundingRound.setMaci(maci.address);
      await tokenAsContributor.approve(
        fundingRound.address,
        contributionAmount,
      );
      await fundingRoundAsContributor.contribute(userPubKey, contributionAmount);
      const signUpData = defaultAbiCoder.encode(
        ['address'],
        [contributor.address],
      );
      await expect(maci.signUp(userPubKey, signUpData, encodedContributorAddress))
        .to.be.revertedWith('FundingRound: User already registered');
    });

    it('should not return the amount of voice credits for user who has not contributed', async () => {
      await expect(fundingRound.getVoiceCredits(
        fundingRound.address,
        encodedContributorAddress,
      )).to.be.revertedWith('FundingRound: User does not have any voice credits');
    });
  });

  describe('voting', () => {
    const singleVote = UNIT.mul(4)
    let fundingRoundAsContributor: Contract;
    let userStateIndex: number;
    let recipientIndex = 1
    let nonce = 1

    beforeEach(async () => {
      await fundingRound.setMaci(maci.address);
      const tokenAsContributor = token.connect(contributor);
      await tokenAsContributor.approve(
        fundingRound.address,
        contributionAmount,
      );
      fundingRoundAsContributor = fundingRound.connect(contributor);
      const contributionTx = await fundingRoundAsContributor.contribute(
        userKeypair.pubKey.asContractParam(),
        contributionAmount,
      );
      userStateIndex = await getEventArg(contributionTx, maci, 'SignUp', '_stateIndex');
      await provider.send('evm_increaseTime', [signUpDuration]);
    });

    it('submits a vote', async () => {
      const [message, encPubKey] = createMessage(
        userStateIndex,
        userKeypair, null,
        coordinatorPubKey,
        recipientIndex, singleVote, nonce,
      );
      const messagePublished = maci.publishMessage(
        message.asContractParam(),
        encPubKey.asContractParam(),
      );
      await expect(messagePublished).to.emit(maci, 'PublishMessage');
      const publishTx = await messagePublished;
      expect(await getGasUsage(publishTx)).lessThan(800000);
    });

    it('submits a key-changing message', async () => {
      const newUserKeypair = new Keypair()
      const [message, encPubKey] = createMessage(
        userStateIndex,
        userKeypair, newUserKeypair,
        coordinatorPubKey,
        null, null, nonce,
      )
      await maci.publishMessage(
        message.asContractParam(),
        encPubKey.asContractParam(),
      )
    })

    it('submits an invalid vote', async () => {
      const newUserKeypair = new Keypair()
      const [message1, encPubKey1] = createMessage(
        userStateIndex,
        userKeypair, newUserKeypair,
        coordinatorPubKey,
        null, null, nonce,
      )
      await maci.publishMessage(
        message1.asContractParam(),
        encPubKey1.asContractParam(),
      )
      const [message2, encPubKey2] = createMessage(
        userStateIndex,
        userKeypair, null,
        coordinatorPubKey,
        recipientIndex, singleVote, nonce + 1,
      )
      await maci.publishMessage(
        message2.asContractParam(),
        encPubKey2.asContractParam(),
      )
    })

    it('submits a vote for invalid vote option', async () => {
      recipientIndex = 999
      const [message, encPubKey] = createMessage(
        userStateIndex,
        userKeypair, null,
        coordinatorPubKey,
        recipientIndex, singleVote, nonce,
      )
      await maci.publishMessage(
        message.asContractParam(),
        encPubKey.asContractParam(),
      )
    })

    it('submits a batch of messages', async () => {
      const messages = [];
      const encPubKeys = [];
      const numMessages = 3;
      for (let recipientIndex = 1; recipientIndex < numMessages + 1; recipientIndex++) {
        nonce = recipientIndex
        const [message, encPubKey] = createMessage(
          userStateIndex,
          userKeypair, null,
          coordinatorPubKey,
          recipientIndex, singleVote, nonce,
        );
        messages.push(message.asContractParam());
        encPubKeys.push(encPubKey.asContractParam());
      }
      const messageBatchSubmitted = await fundingRound.submitMessageBatch(messages, encPubKeys);
      expect(await getGasUsage(messageBatchSubmitted)).lessThan(2100000);
    }).timeout(100000);
  });

  describe('finalizing round', () => {
    const matchingPoolSize = UNIT.mul(10000)
    const totalContributions = UNIT.mul(1000)
    const totalSpent = totalContributions.div(VOICE_CREDIT_FACTOR)
    const totalSpentSalt = genRandomSalt().toString()
    const totalVotes = bnSqrt(totalSpent)
    expect(totalVotes.toNumber()).to.equal(10000)

    beforeEach(async () => {
      maci = await deployMaciMock()
      await maci.mock.hasUntalliedStateLeaves.returns(false)
      await maci.mock.totalVotes.returns(totalVotes)
      await maci.mock.verifySpentVoiceCredits.returns(true)

      await token.connect(contributor).approve(
        fundingRound.address,
        totalContributions,
      )
    })

    it('allows owner to finalize round', async () => {
      await fundingRound.setMaci(maci.address);
      await fundingRound.connect(contributor).contribute(
        userKeypair.pubKey.asContractParam(),
        totalContributions,
      )
      await provider.send('evm_increaseTime', [signUpDuration + votingDuration]);
      await token.transfer(fundingRound.address, matchingPoolSize)

      await fundingRound.finalize(matchingPoolSize, totalSpent, totalSpentSalt)
      expect(await fundingRound.isFinalized()).to.equal(true);
      expect(await fundingRound.isCancelled()).to.equal(false);
      expect(await fundingRound.totalVotes()).to.equal(totalVotes)
      expect(await fundingRound.matchingPoolSize()).to.equal(matchingPoolSize)
    });

    it('allows owner to finalize round when matching pool is empty', async () => {
      await fundingRound.setMaci(maci.address)
      await fundingRound.connect(contributor).contribute(
        userKeypair.pubKey.asContractParam(),
        totalContributions,
      )
      await provider.send('evm_increaseTime', [signUpDuration + votingDuration])

      await fundingRound.finalize(0, totalSpent, totalSpentSalt)
      expect(await fundingRound.totalVotes()).to.equal(totalVotes)
      expect(await fundingRound.matchingPoolSize()).to.equal(0)
    })

    it('reverts if round has been finalized already', async () => {
      await fundingRound.setMaci(maci.address);
      await fundingRound.connect(contributor).contribute(
        userKeypair.pubKey.asContractParam(),
        totalContributions,
      )
      await provider.send('evm_increaseTime', [signUpDuration + votingDuration]);
      await token.transfer(fundingRound.address, matchingPoolSize)
      await fundingRound.finalize(matchingPoolSize, totalSpent, totalSpentSalt)

      await expect(fundingRound.finalize(matchingPoolSize, totalSpent, totalSpentSalt))
        .to.be.revertedWith('FundingRound: Already finalized');
    });

    it('reverts MACI has not been deployed', async () => {
      await provider.send('evm_increaseTime', [signUpDuration + votingDuration]);
      await expect(fundingRound.finalize(matchingPoolSize, totalSpent, totalSpentSalt))
        .to.be.revertedWith('FundingRound: MACI not deployed');
    });

    it('reverts if voting is still in progress', async () => {
      await fundingRound.setMaci(maci.address);
      await fundingRound.connect(contributor).contribute(
        userKeypair.pubKey.asContractParam(),
        totalContributions,
      )
      await provider.send('evm_increaseTime', [signUpDuration]);

      await expect(fundingRound.finalize(matchingPoolSize, totalSpent, totalSpentSalt))
        .to.be.revertedWith('FundingRound: Voting has not been finished');
    });

    it('reverts if votes has not been tallied', async () => {
      await fundingRound.setMaci(maci.address)
      await fundingRound.connect(contributor).contribute(
        userKeypair.pubKey.asContractParam(),
        totalContributions,
      )
      await provider.send('evm_increaseTime', [signUpDuration + votingDuration])
      await maci.mock.hasUntalliedStateLeaves.returns(true)

      await expect(fundingRound.finalize(matchingPoolSize, totalSpent, totalSpentSalt))
        .to.be.revertedWith('FundingRound: Votes has not been tallied')
    })

    it('reverts if total votes is zero', async () => {
      await fundingRound.setMaci(maci.address)
      await fundingRound.connect(contributor).contribute(
        userKeypair.pubKey.asContractParam(),
        totalContributions,
      )
      await provider.send('evm_increaseTime', [signUpDuration + votingDuration])
      await token.transfer(fundingRound.address, matchingPoolSize)
      await maci.mock.totalVotes.returns(0)

      await expect(fundingRound.finalize(matchingPoolSize, totalSpent, totalSpentSalt))
        .to.be.revertedWith('FundingRound: No votes')
    });

    it('reverts if total amount of spent voice credits is incorrect', async () => {
      await fundingRound.setMaci(maci.address)
      await fundingRound.connect(contributor).contribute(
        userKeypair.pubKey.asContractParam(),
        totalContributions,
      )
      await provider.send('evm_increaseTime', [signUpDuration + votingDuration])
      await token.transfer(fundingRound.address, matchingPoolSize)
      await maci.mock.verifySpentVoiceCredits.returns(false)

      await expect(fundingRound.finalize(matchingPoolSize, totalSpent, totalSpentSalt))
        .to.be.revertedWith('FundingRound: Incorrect total amount of spent voice credits')
    })

    it('allows only owner to finalize round', async () => {
      await fundingRound.setMaci(maci.address);
      await fundingRound.connect(contributor).contribute(
        userKeypair.pubKey.asContractParam(),
        totalContributions,
      )
      await provider.send('evm_increaseTime', [signUpDuration + votingDuration]);
      await token.transfer(fundingRound.address, matchingPoolSize)

      const fundingRoundAsCoordinator = fundingRound.connect(coordinator);
      await expect(fundingRoundAsCoordinator.finalize(matchingPoolSize, totalSpent, totalSpentSalt))
        .to.be.revertedWith('Ownable: caller is not the owner');
    });
  });

  describe('cancelling round', () => {
    it('allows owner to cancel round', async () => {
      await fundingRound.cancel();
      expect(await fundingRound.isFinalized()).to.equal(true);
      expect(await fundingRound.isCancelled()).to.equal(true);
    });

    it('reverts if round has been finalized already', async () => {
      const matchingPoolSize = UNIT.mul(10000)
      const totalContributions = UNIT.mul(1000)
      const totalSpent = totalContributions.div(VOICE_CREDIT_FACTOR)
      const totalSpentSalt = genRandomSalt().toString()
      maci = await deployMaciMock()
      await fundingRound.setMaci(maci.address);
      await token.connect(contributor).approve(
        fundingRound.address,
        totalContributions,
      )
      await fundingRound.connect(contributor).contribute(
        userKeypair.pubKey.asContractParam(),
        totalContributions,
      )
      await provider.send('evm_increaseTime', [signUpDuration + votingDuration]);
      await maci.mock.hasUntalliedStateLeaves.returns(false)
      await maci.mock.totalVotes.returns(bnSqrt(totalSpent))
      await maci.mock.verifySpentVoiceCredits.returns(true)
      await token.transfer(fundingRound.address, matchingPoolSize)
      await fundingRound.finalize(matchingPoolSize, totalSpent, totalSpentSalt)

      await expect(fundingRound.cancel())
        .to.be.revertedWith('FundingRound: Already finalized');
    });

    it('reverts if round has been cancelled already', async () => {
      await fundingRound.cancel();
      await expect(fundingRound.cancel())
        .to.be.revertedWith('FundingRound: Already finalized');
    });

    it('allows only owner to cancel round', async () => {
      const fundingRoundAsCoordinator = fundingRound.connect(coordinator);
      await expect(fundingRoundAsCoordinator.cancel())
        .to.be.revertedWith('Ownable: caller is not the owner');
    });
  });

  describe('withdrawing funds', () => {
    const userPubKey = userKeypair.pubKey.asContractParam()
    const contributionAmount = UNIT.mul(10)
    let tokenAsContributor: Contract;
    let fundingRoundAsContributor: Contract;

    beforeEach(async () => {
      tokenAsContributor = token.connect(contributor);
      fundingRoundAsContributor = fundingRound.connect(contributor);
      await fundingRound.setMaci(maci.address);
      await tokenAsContributor.approve(
        fundingRound.address,
        contributionAmount,
      );
    });

    it('allows contributor to withdraw funds', async () => {
      await fundingRoundAsContributor.contribute(userPubKey, contributionAmount);
      await fundingRound.cancel();
      await expect(fundingRoundAsContributor.withdraw())
        .to.emit(fundingRound, 'FundsWithdrawn')
        .withArgs(contributor.address);
      expect(await token.balanceOf(fundingRound.address))
        .to.equal(0);
    });

    it('disallows withdrawal if round is not cancelled', async () => {
      await fundingRoundAsContributor.contribute(userPubKey, contributionAmount);
      await expect(fundingRoundAsContributor.withdraw())
        .to.be.revertedWith('FundingRound: Round not cancelled');
    });

    it('reverts if user did not contribute to the round', async () => {
      await fundingRound.cancel();
      await expect(fundingRoundAsContributor.withdraw())
        .to.be.revertedWith('FundingRound: Nothing to withdraw');
    });
  });

  describe('claiming funds', () => {
    const matchingPoolSize = UNIT.mul(10000)
    const totalContributions = UNIT.mul(1000)
    const totalSpent = totalContributions.div(VOICE_CREDIT_FACTOR)
    const totalSpentSalt = genRandomSalt().toString();
    const totalVotes = bnSqrt(totalSpent)
    const recipientIndex = 3;
    const recipientClaimData = [
      recipient.address, // recipient
      totalVotes.div(2), // Tally result
      [[0]], // Proof
      genRandomSalt().toString(),
      totalSpent.div(2), // Total spent
      [[0]],
      genRandomSalt().toString(),
    ];
    let expectedClaimableAmount = matchingPoolSize.div(2).add(totalContributions.div(2))
    let fundingRoundAsRecipient: Contract;
    let fundingRoundAsContributor: Contract;

    beforeEach(async () => {
      maci = await deployMaciMock()
      await maci.mock.hasUntalliedStateLeaves.returns(false);
      await maci.mock.totalVotes.returns(totalVotes);
      await maci.mock.verifySpentVoiceCredits.returns(true);
      await maci.mock.verifyTallyResult.returns(true);
      await maci.mock.verifyPerVOSpentVoiceCredits.returns(true);

      await recipientRegistry.mock.getRecipientIndex.returns(recipientIndex);

      await fundingRound.setMaci(maci.address);
      const tokenAsContributor = token.connect(contributor);
      await tokenAsContributor.approve(
        fundingRound.address,
        totalContributions,
      );
      fundingRoundAsContributor = fundingRound.connect(contributor);
      await fundingRoundAsContributor.contribute(
        userKeypair.pubKey.asContractParam(),
        totalContributions,
      );
      await provider.send('evm_increaseTime', [signUpDuration + votingDuration]);
      fundingRoundAsRecipient = fundingRound.connect(recipient);
    });

    it('allows recipient to claim allocated funds', async () => {
      await token.transfer(fundingRound.address, matchingPoolSize);
      await fundingRound.finalize(matchingPoolSize, totalSpent, totalSpentSalt)

      await expect(fundingRoundAsRecipient.claimFunds(...recipientClaimData))
        .to.emit(fundingRound, 'FundsClaimed')
        .withArgs(recipient.address, expectedClaimableAmount);
      expect(await token.balanceOf(recipient.address))
        .to.equal(expectedClaimableAmount);
    });

    it('allows address different than recipient to claim allocated funds', async () => {
      await token.transfer(fundingRound.address, matchingPoolSize);
      await fundingRound.finalize(matchingPoolSize, totalSpent, totalSpentSalt)

      await expect(fundingRoundAsContributor.claimFunds(...recipientClaimData))
        .to.emit(fundingRound, 'FundsClaimed')
        .withArgs(recipient.address, expectedClaimableAmount);
      expect(await token.balanceOf(recipient.address))
        .to.equal(expectedClaimableAmount);
    });

    it('allows recipient to claim zero amount', async () => {
      await token.transfer(fundingRound.address, matchingPoolSize)
      await fundingRound.finalize(matchingPoolSize, totalSpent, totalSpentSalt)

      const recipientClaimZeroData = recipientClaimData.slice()  // Make a copy
      recipientClaimZeroData[1] = 0
      recipientClaimZeroData[4] = 0
      await expect(fundingRoundAsRecipient.claimFunds(...recipientClaimZeroData))
        .to.emit(fundingRound, 'FundsClaimed')
        .withArgs(recipient.address, 0)
    })

    it('allows recipient to claim if the matching pool is empty', async () => {
      await fundingRound.finalize(0, totalSpent, totalSpentSalt)

      expectedClaimableAmount = totalContributions.div(2)
      await expect(fundingRoundAsRecipient.claimFunds(...recipientClaimData))
        .to.emit(fundingRound, 'FundsClaimed')
        .withArgs(recipient.address, expectedClaimableAmount)
    })

    it('should not allow recipient to claim funds if round has not been finalized', async () => {
      await token.transfer(fundingRound.address, matchingPoolSize);

      await expect(fundingRoundAsRecipient.claimFunds(...recipientClaimData))
        .to.be.revertedWith('FundingRound: Round not finalized')
    });

    it('should not allow recipient to claim funds if round has been cancelled', async () => {
      await token.transfer(fundingRound.address, matchingPoolSize);
      await fundingRound.cancel()

      await expect(fundingRoundAsRecipient.claimFunds(...recipientClaimData))
        .to.be.revertedWith('FundingRound: Round has been cancelled')
    });

    it('allows only verified recipients to claim funds', async () => {
      await token.transfer(fundingRound.address, matchingPoolSize);
      await fundingRound.finalize(matchingPoolSize, totalSpent, totalSpentSalt)
      await recipientRegistry.mock.getRecipientIndex.returns(0);

      await expect(fundingRoundAsRecipient.claimFunds(...recipientClaimData))
        .to.be.revertedWith('FundingRound: Invalid recipient address');
    });

    it('allows recipient to claim allocated funds only once', async () => {
      await token.transfer(fundingRound.address, matchingPoolSize);
      await fundingRound.finalize(matchingPoolSize, totalSpent, totalSpentSalt)

      await fundingRoundAsRecipient.claimFunds(...recipientClaimData);
      await expect(fundingRoundAsRecipient.claimFunds(...recipientClaimData))
        .to.be.revertedWith('FundingRound: Funds already claimed');
    });

    it('should verify that tally result is correct', async () => {
      await token.transfer(fundingRound.address, matchingPoolSize);
      await fundingRound.finalize(matchingPoolSize, totalSpent, totalSpentSalt)
      await maci.mock.verifyTallyResult.returns(false)

      await expect(fundingRoundAsRecipient.claimFunds(...recipientClaimData))
        .to.be.revertedWith('FundingRound: Incorrect tally result');
    });

    it('should verify that amount of spent voice credits is correct', async () => {
      await token.transfer(fundingRound.address, matchingPoolSize);
      await fundingRound.finalize(matchingPoolSize, totalSpent, totalSpentSalt)
      await maci.mock.verifyPerVOSpentVoiceCredits.returns(false)

      await expect(fundingRoundAsRecipient.claimFunds(...recipientClaimData))
        .to.be.revertedWith('FundingRound: Incorrect amount of spent voice credits');
    });
  });
});
