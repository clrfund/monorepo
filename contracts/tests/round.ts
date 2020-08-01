import { ethers, waffle } from '@nomiclabs/buidler';
import { use, expect } from 'chai';
import { solidity } from 'ethereum-waffle';
import { deployMockContract } from '@ethereum-waffle/mock-contract';
import { Contract } from 'ethers';
import { defaultAbiCoder } from '@ethersproject/abi';
import { genRandomSalt } from 'maci-crypto';
import { Keypair } from 'maci-domainobjs';

import { deployMaciFactory } from '../scripts/helpers';
import { ZERO_ADDRESS, getEventArg, getGasUsage, createMessage } from './utils';
import IVerifiedUserRegistryArtifact from '../build/contracts/IVerifiedUserRegistry.json';
import IRecipientRegistryArtifact from '../build/contracts/IRecipientRegistry.json';
import MACIArtifact from '../build/contracts/MACI.json';

use(solidity);

describe('Funding Round', () => {
  const provider = waffle.provider;
  const [dontUseMe, deployer, coordinator, contributor, recipient] = provider.getWallets();// eslint-disable-line @typescript-eslint/no-unused-vars

  const coordinatorPubKey = (new Keypair()).pubKey;
  const signUpDuration = 86400 * 7;  // Default duration in MACI factory
  const votingDuration = 86400 * 7;  // Default duration in MACI factory

  let token: Contract;
  let verifiedUserRegistry: Contract;
  let recipientRegistry: Contract;
  let fundingRound: Contract;
  let maci: Contract;

  beforeEach(async () => {
    const tokenInitialSupply = 10000000000;
    const Token = await ethers.getContractFactory('AnyOldERC20Token', deployer);
    token = await Token.deploy(tokenInitialSupply);
    await token.transfer(contributor.address, tokenInitialSupply / 4);
    await token.transfer(coordinator.address, tokenInitialSupply / 4);

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
    expect(await fundingRound.verifiedUserRegistry()).to.equal(verifiedUserRegistry.address);
    expect(await fundingRound.recipientRegistry()).to.equal(recipientRegistry.address);
    expect(await fundingRound.isFinalized()).to.equal(false);
    expect(await fundingRound.isCancelled()).to.equal(false);
    expect(await fundingRound.totalsVerified()).to.equal(false);
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
    const userPubKey = { x: 1, y: 0 };
    const contributionAmount = 1000;
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
      await expect(fundingRoundAsContributor.contribute(userPubKey, contributionAmount))
        .to.emit(fundingRound, 'NewContribution')
        .withArgs(contributor.address, contributionAmount)
        .to.emit(maci, 'SignUp')
        // We use [] to skip argument matching, otherwise it will fail
        // Possibly related: https://github.com/EthWorks/Waffle/issues/245
        .withArgs([], 1, contributionAmount);
      expect(await token.balanceOf(fundingRound.address))
        .to.equal(contributionAmount);

      expect(await fundingRound.getVoiceCredits(
        fundingRound.address,
        encodedContributorAddress,
      )).to.equal(contributionAmount);
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

    it('allows to contribute only once per round', async () => {
      await fundingRound.setMaci(maci.address);
      await tokenAsContributor.approve(
        fundingRound.address,
        contributionAmount * 2,
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
    const contributionAmount = 1000;
    const singleVote = 100;
    let fundingRoundAsContributor: Contract;
    let userKeypair: Keypair;
    let userStateIndex: number;

    beforeEach(async () => {
      await fundingRound.setMaci(maci.address);
      const tokenAsContributor = token.connect(contributor);
      await tokenAsContributor.approve(
        fundingRound.address,
        contributionAmount,
      );
      fundingRoundAsContributor = fundingRound.connect(contributor);
      userKeypair = new Keypair();
      const contributionTx = await fundingRoundAsContributor.contribute(
        userKeypair.pubKey.asContractParam(),
        contributionAmount,
      );
      userStateIndex = await getEventArg(contributionTx, maci, 'SignUp', '_stateIndex');
      await provider.send('evm_increaseTime', [signUpDuration]);
    });

    it('publishes a single message', async () => {
      const recipientIndex = 1;
      const nonce = 1;
      const [message, encPubKey] = createMessage(
        userStateIndex,
        userKeypair,
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

    it('submits a batch of messages', async () => {
      const messages = [];
      const encPubKeys = [];
      const numMessages = 3;
      for (let recipientIndex = 1; recipientIndex < numMessages + 1; recipientIndex++) {
        const nonce = recipientIndex;
        const [message, encPubKey] = createMessage(
          userStateIndex,
          userKeypair,
          coordinatorPubKey,
          recipientIndex, singleVote, nonce,
        );
        messages.push(message.asContractParam());
        encPubKeys.push(encPubKey.asContractParam());
      }
      const messageBatchSubmitted = await fundingRound.submitMessageBatch(messages, encPubKeys);
      expect(await getGasUsage(messageBatchSubmitted)).lessThan(2000000);
    }).timeout(100000);
  });

  describe('finalizing round', () => {
    it('allows owner to finalize round', async () => {
      await fundingRound.setMaci(maci.address);
      await provider.send('evm_increaseTime', [signUpDuration + votingDuration]);
      await fundingRound.finalize();
      expect(await fundingRound.isFinalized()).to.equal(true);
      expect(await fundingRound.isCancelled()).to.equal(false);
    });

    it('reverts if round has been finalized already', async () => {
      await fundingRound.setMaci(maci.address);
      await provider.send('evm_increaseTime', [signUpDuration + votingDuration]);
      await fundingRound.finalize();
      await expect(fundingRound.finalize())
        .to.be.revertedWith('FundingRound: Already finalized');
    });

    it('reverts MACI has not been deployed', async () => {
      await provider.send('evm_increaseTime', [signUpDuration + votingDuration]);
      await expect(fundingRound.finalize())
        .to.be.revertedWith('FundingRound: MACI not deployed');
    });

    it('reverts if voting is still in progress', async () => {
      await fundingRound.setMaci(maci.address);
      await provider.send('evm_increaseTime', [signUpDuration]);
      await expect(fundingRound.finalize())
        .to.be.revertedWith('FundingRound: Voting has not been finished');
    });

    it('allows only owner to finalize round', async () => {
      await fundingRound.setMaci(maci.address);
      await provider.send('evm_increaseTime', [signUpDuration + votingDuration]);
      const fundingRoundAsCoordinator = fundingRound.connect(coordinator);
      await expect(fundingRoundAsCoordinator.finalize())
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
      await fundingRound.setMaci(maci.address);
      await provider.send('evm_increaseTime', [signUpDuration + votingDuration]);
      await fundingRound.finalize();
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
    const userPubKey = { x: 1, y: 0 };
    const contributionAmount = 1000;
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
    const matchingPoolSize = 100000;
    const totalSpent = 10000;
    const totalSpentSalt = genRandomSalt().toString();
    const totalVotes = 100; // Math.sqrt(totalSpent)
    const recipientIndex = 3;
    const recipientClaimData = [
      totalVotes / 2, // Tally result
      [[0]], // Proof
      genRandomSalt().toString(),
      totalSpent / 2, // Total spent
      [[0]],
      genRandomSalt().toString(),
    ];
    const expectedClaimableAmount = matchingPoolSize / 2 + totalSpent / 2;
    let fundingRoundAsRecipient: Contract;

    beforeEach(async () => {
      const signUpDeadline = (await provider.getBlock('latest')).timestamp + signUpDuration;
      const votingDeadline = signUpDeadline + votingDuration;

      maci = await deployMockContract(deployer, MACIArtifact.abi);
      await maci.mock.calcSignUpDeadline.returns(signUpDeadline);
      await maci.mock.calcVotingDeadline.returns(votingDeadline);
      await maci.mock.maxUsers.returns(100);
      await maci.mock.signUp.returns();
      await maci.mock.numSignUps.returns(1);
      await maci.mock.hasUntalliedStateLeaves.returns(false);
      await maci.mock.totalVotes.returns(totalVotes);
      await maci.mock.verifySpentVoiceCredits.returns(true);
      await maci.mock.treeDepths.returns(10, 10, 2);
      await maci.mock.verifyTallyResult.returns(true);
      await maci.mock.verifyPerVOSpentVoiceCredits.returns(true);

      await recipientRegistry.mock.getRecipientIndex.returns(recipientIndex);

      await fundingRound.setMaci(maci.address);
      const tokenAsContributor = token.connect(contributor);
      await tokenAsContributor.approve(
        fundingRound.address,
        totalSpent,
      );
      const fundingRoundAsContributor = fundingRound.connect(contributor);
      await fundingRoundAsContributor.contribute(
        (new Keypair()).pubKey.asContractParam(),
        totalSpent,
      );
      await provider.send('evm_increaseTime', [signUpDuration + votingDuration]);
      fundingRoundAsRecipient = fundingRound.connect(recipient);
    });

    it('allows anyone to verify the totals', async () => {
      await token.transfer(fundingRound.address, matchingPoolSize);
      await fundingRound.finalize();
      await fundingRound.verifyTotals(totalSpent, totalSpentSalt);
      expect(await fundingRound.matchingPoolSize()).to.equal(matchingPoolSize);
      expect(await fundingRound.totalVotes()).to.equal(totalVotes);
      expect(await fundingRound.totalsVerified()).to.equal(true);
    });

    it('rejects verification if round has not been finalized', async () => {
      await expect(fundingRound.verifyTotals(totalSpent, totalSpentSalt))
        .to.be.revertedWith('FundingRound: Round not finalized');
    });

    it('rejects verification if round has been cancelled', async () => {
      await fundingRound.cancel();
      await expect(fundingRound.verifyTotals(totalSpent, totalSpentSalt))
        .to.be.revertedWith('FundingRound: Round has been cancelled');
    });

    it('reverts if totals has been already verified', async () => {
      await token.transfer(fundingRound.address, matchingPoolSize);
      await fundingRound.finalize();
      await fundingRound.verifyTotals(totalSpent, totalSpentSalt);
      await expect(fundingRound.verifyTotals(totalSpent, totalSpentSalt))
        .to.be.revertedWith('FundingRound: Totals has been already verified');
    });

    it('reverts if total amount of spent voice credits is incorrect', async () => {
      await maci.mock.verifySpentVoiceCredits.returns(false);
      await token.transfer(fundingRound.address, matchingPoolSize);
      await fundingRound.finalize();
      await expect(fundingRound.verifyTotals(totalSpent, totalSpentSalt))
        .to.be.revertedWith('FundingRound: Incorrect total amount of spent voice credits');
    });

    it('allows recipient to claim allocated funds', async () => {
      await token.transfer(fundingRound.address, matchingPoolSize);
      await fundingRound.finalize();
      await fundingRound.verifyTotals(totalSpent, totalSpentSalt);

      await expect(fundingRoundAsRecipient.claimFunds(...recipientClaimData))
        .to.emit(fundingRound, 'FundsClaimed')
        .withArgs(recipient.address, expectedClaimableAmount);
      expect(await token.balanceOf(recipient.address))
        .to.equal(expectedClaimableAmount);
    });

    it('should not allow recipient to claim funds if totals has not been verified', async () => {
      await token.transfer(fundingRound.address, matchingPoolSize);
      await fundingRound.finalize();

      await expect(fundingRoundAsRecipient.claimFunds(...recipientClaimData))
        .to.be.revertedWith('FundingRound: Totals has not been verified');
    });

    it('allows only verified recipients to claim funds', async () => {
      await token.transfer(fundingRound.address, matchingPoolSize);
      await fundingRound.finalize();
      await fundingRound.verifyTotals(totalSpent, totalSpentSalt);
      await recipientRegistry.mock.getRecipientIndex.returns(0);

      await expect(fundingRoundAsRecipient.claimFunds(...recipientClaimData))
        .to.be.revertedWith('FundingRound: Invalid recipient address');
    });

    it('allows recipient to claim allocated funds only once', async () => {
      await token.transfer(fundingRound.address, matchingPoolSize);
      await fundingRound.finalize();
      await fundingRound.verifyTotals(totalSpent, totalSpentSalt);

      await fundingRoundAsRecipient.claimFunds(...recipientClaimData);
      await expect(fundingRoundAsRecipient.claimFunds(...recipientClaimData))
        .to.be.revertedWith('FundingRound: Funds already claimed');
    });

    it('should verify that tally result is correct', async () => {
      await token.transfer(fundingRound.address, matchingPoolSize);
      await fundingRound.finalize();
      await fundingRound.verifyTotals(totalSpent, totalSpentSalt);
      await maci.mock.verifyTallyResult.returns(false)

      await expect(fundingRoundAsRecipient.claimFunds(...recipientClaimData))
        .to.be.revertedWith('FundingRound: Incorrect tally result');
    });

    it('should verify that amount of spent voice credits is correct', async () => {
      await token.transfer(fundingRound.address, matchingPoolSize);
      await fundingRound.finalize();
      await fundingRound.verifyTotals(totalSpent, totalSpentSalt);
      await maci.mock.verifyPerVOSpentVoiceCredits.returns(false)

      await expect(fundingRoundAsRecipient.claimFunds(...recipientClaimData))
        .to.be.revertedWith('FundingRound: Incorrect amount of spent voice credits');
    });
  });
});
