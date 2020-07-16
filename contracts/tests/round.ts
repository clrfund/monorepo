import { ethers, waffle } from '@nomiclabs/buidler';
import { use, expect } from 'chai';
import { solidity } from 'ethereum-waffle';
import { deployMockContract } from '@ethereum-waffle/mock-contract';
import { Contract } from 'ethers';
import { Keypair } from 'maci-domainobjs';

import { deployMaciFactory } from '../scripts/helpers';
import { ZERO_ADDRESS, getEventArg, getGasUsage, createMessage } from './utils';
import IRecipientRegistryArtifact from '../build/contracts/IRecipientRegistry.json';
import MACIArtifact from '../build/contracts/MACI.json';

use(solidity);

describe('Funding Round', () => {
  const provider = waffle.provider;
  const [dontUseMe, deployer, coordinator, contributor] = provider.getWallets();// eslint-disable-line @typescript-eslint/no-unused-vars

  const coordinatorPubKey = (new Keypair()).pubKey;
  const roundDuration = 86400 * 7;  // Default duration in MACI factory
  const votingDuration = 86400 * 7;  // Default duration in MACI factory

  let token: Contract;
  let recipientRegistry: Contract;
  let fundingRound: Contract;
  let maci: Contract;

  beforeEach(async () => {
    const tokenInitialSupply = 10000000000;
    const Token = await ethers.getContractFactory('AnyOldERC20Token', deployer);
    token = await Token.deploy(tokenInitialSupply);
    await token.transfer(contributor.address, tokenInitialSupply / 2);
    await token.transfer(coordinator.address, tokenInitialSupply / 2);

    recipientRegistry = await deployMockContract(deployer, IRecipientRegistryArtifact.abi);
    await recipientRegistry.mock.getRecipientIndex.returns(3);
    expect(await recipientRegistry.getRecipientIndex(ZERO_ADDRESS)).to.equal(3);

    const FundingRound = await ethers.getContractFactory('FundingRound', deployer);
    fundingRound = await FundingRound.deploy(
      token.address,
      recipientRegistry.address,
      roundDuration,
      coordinatorPubKey.asContractParam(),
    );

    const maciFactory = await deployMaciFactory(deployer);
    const maciDeployed = await maciFactory.deployMaci(coordinatorPubKey.asContractParam());
    const maciAddress = await getEventArg(maciDeployed, maciFactory, 'MaciDeployed', '_maci');
    maci = await ethers.getContractAt(MACIArtifact.abi, maciAddress);
  });

  it('initializes funding round correctly', async () => {
    expect(await fundingRound.owner()).to.equal(deployer.address);
    expect(await fundingRound.nativeToken()).to.equal(token.address);
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
    const userPubKey = { x: 1, y: 0 };
    const contributionAmount = 1000;
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
      await provider.send('evm_increaseTime', [roundDuration]);
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
      await provider.send('evm_increaseTime', [roundDuration + votingDuration]);
      await fundingRound.finalize();
      expect(await fundingRound.isFinalized()).to.equal(true);
      expect(await fundingRound.isCancelled()).to.equal(false);
    });

    it('reverts if round has been finalized already', async () => {
      await fundingRound.setMaci(maci.address);
      await provider.send('evm_increaseTime', [roundDuration + votingDuration]);
      await fundingRound.finalize();
      await expect(fundingRound.finalize())
        .to.be.revertedWith('FundingRound: Already finalized');
    });

    it('reverts MACI has not been deployed', async () => {
      await provider.send('evm_increaseTime', [roundDuration + votingDuration]);
      await expect(fundingRound.finalize())
        .to.be.revertedWith('FundingRound: MACI not deployed');
    });

    it('reverts if voting is still in progress', async () => {
      await fundingRound.setMaci(maci.address);
      await provider.send('evm_increaseTime', [roundDuration]);
      await expect(fundingRound.finalize())
        .to.be.revertedWith('FundingRound: Voting has not been finished');
    });

    it('allows only owner to finalize round', async () => {
      await fundingRound.setMaci(maci.address);
      await provider.send('evm_increaseTime', [roundDuration + votingDuration]);
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
      await provider.send('evm_increaseTime', [roundDuration + votingDuration]);
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

  it('allows recipient to claim funds', async () => {
    // TODO: add tests later
  });
});
