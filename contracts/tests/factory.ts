import { ethers, waffle } from '@nomiclabs/buidler';
import { use, expect } from 'chai';
import { deployContract, solidity } from 'ethereum-waffle';
import { Contract } from 'ethers';
import { Keypair } from 'maci-domainobjs';

import { deployMaciFactory } from '../scripts/helpers';
import { ZERO_ADDRESS, getGasUsage, getEventArg, MaciParameters } from './utils';

import FactoryArtifact from '../build/contracts/FundingRoundFactory.json';
import TokenArtifact from '../build/contracts/AnyOldERC20Token.json';

use(solidity);

describe('Funding Round Factory', () => {
  const provider = waffle.provider;
  const [, deployer, coordinator, contributor] = provider.getWallets()

  let maciFactory: Contract;
  let factory: Contract;
  let token: Contract;

  const maciParameters = new MaciParameters();
  const coordinatorPubKey = (new Keypair()).pubKey.asContractParam()

  beforeEach(async () => {
    maciFactory = await deployMaciFactory(deployer);

    factory = await deployContract(deployer, FactoryArtifact, [
      maciFactory.address,
    ], { gasLimit: 5000000 });

    expect(factory.address).to.properAddress;
    expect(await getGasUsage(factory.deployTransaction)).lessThan(4700000);
    await maciFactory.transferOwnership(factory.address);

    // Deploy token contract and transfer tokens to contributor
    const tokenInitialSupply = 10000000000;
    token = await deployContract(deployer, TokenArtifact, [tokenInitialSupply]);
    expect(token.address).to.properAddress;
    await token.transfer(contributor.address, tokenInitialSupply);
  });

  describe('contributing to matching pool', () => {
    const contributionAmount = 1000;

    it('allows user to contribute to matching pool', async () => {
      await factory.setToken(token.address);
      const tokenAsContributor = token.connect(contributor);
      await tokenAsContributor.approve(
        factory.address,
        contributionAmount,
      );
      const factoryAsContributor = factory.connect(contributor);
      await expect(factoryAsContributor.contribute(contributionAmount))
        .to.emit(factory, 'NewContribution')
        .withArgs(contributor.address, contributionAmount);
      expect(await token.balanceOf(factory.address)).to.equal(contributionAmount);
    });

    it('rejects contribution if token address is not set', async () => {
      const tokenAsContributor = token.connect(contributor);
      await tokenAsContributor.approve(
        factory.address,
        contributionAmount,
      );
      const factoryAsContributor = factory.connect(contributor);
      await expect(factoryAsContributor.contribute(contributionAmount))
        .to.be.revertedWith('Factory: Native token is not set');
    });

    it('requires approval', async () => {
      await factory.setToken(token.address);
      const factoryAsContributor = factory.connect(contributor);
      await expect(factoryAsContributor.contribute(contributionAmount))
        .to.be.revertedWith('revert ERC20: transfer amount exceeds allowance');
    });
  });

  describe('managing verified users', () => {
    it('allows owner to add user to the registry', async () => {
      expect(await factory.isVerifiedUser(contributor.address)).to.equal(false);
      await expect(factory.addUser(contributor.address))
        .to.emit(factory, 'UserAdded')
        .withArgs(contributor.address);
      expect(await factory.isVerifiedUser(contributor.address)).to.equal(true);
    });

    it('rejects zero-address', async () => {
      await expect(factory.addUser(ZERO_ADDRESS))
        .to.be.revertedWith('Factory: User address is zero');
    });

    it('rejects user who is already in the registry', async () => {
      await factory.addUser(contributor.address);
      await expect(factory.addUser(contributor.address))
        .to.be.revertedWith('Factory: User already verified');
    });

    it('allows only owner to add users', async () => {
      const contributorFactory = factory.connect(contributor);
      await expect(contributorFactory.addUser(contributor.address))
        .to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('allows owner to remove user', async () => {
      await factory.addUser(contributor.address);
      await expect(factory.removeUser(contributor.address))
        .to.emit(factory, 'UserRemoved')
        .withArgs(contributor.address);
      expect(await factory.isVerifiedUser(contributor.address)).to.equal(false);
    });

    it('reverts when trying to remove user who is not in the registry', async () => {
      await expect(factory.removeUser(contributor.address))
        .to.be.revertedWith('Factory: User is not in the registry');
    });

    it('allows only owner to remove users', async () => {
      await factory.addUser(contributor.address);
      const contributorFactory = factory.connect(contributor);
      await expect(contributorFactory.removeUser(contributor.address))
        .to.be.revertedWith('Ownable: caller is not the owner');
    });
  });

  describe('adding recipients', () => {
    let fundingAddress: string;
    let metadata: string;
    beforeEach(() => {
      fundingAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
      metadata = JSON.stringify({ name: "Recipient 1", description: "Description 1", imageHash: "Ipfs imageHash 1" });
    });

    it('allows owner to add recipient', async () => {
      const expectedIndex = 1;
      await expect(factory.addRecipient(fundingAddress, metadata))
        .to.emit(factory, 'RecipientAdded')
        .withArgs(fundingAddress, metadata, expectedIndex);
      expect(await factory.getRecipientIndex(fundingAddress))
        .to.equal(expectedIndex);
    });

    it('rejects calls from anyone except owner', async () => {
      const contributorFactory = factory.connect(contributor);
      await expect(contributorFactory.addRecipient(fundingAddress, metadata))
        .to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('should not accept zero-address', async () => {
      fundingAddress = ZERO_ADDRESS;
      await expect(factory.addRecipient(fundingAddress, metadata))
        .to.be.revertedWith('Factory: Recipient address is zero');
    });

    it('should not accept empty string as metadata', async () => {
      metadata = ''
      await expect(factory.addRecipient(fundingAddress, metadata))
        .to.be.revertedWith('Factory: Metadata info is empty string');
    });

    it('should not accept already registered address', async () => {
      await factory.addRecipient(fundingAddress, metadata);
      metadata = JSON.stringify({ name: "Recipient 2", description: "Description 2", imageHash: "Ipfs imageHash 2" })
      await expect(factory.addRecipient(fundingAddress, metadata))
        .to.be.revertedWith('Factory: Recipient already registered');
    });

    it('should limit the number of recipients', async () => {
      const maxRecipientCount = 5 ** maciParameters.voteOptionTreeDepth - 1;
      let recipientName;
      for (let i = 0; i < maxRecipientCount + 1; i++) {
        recipientName = String(i + 1).padStart(4, '0')
        metadata = JSON.stringify({ name: recipientName, description: "Description", imageHash: "Ipfs imageHash" })
        fundingAddress = `0x000000000000000000000000000000000000${recipientName}`;
        if (i < maxRecipientCount) {
          await factory.addRecipient(fundingAddress, metadata);
        } else {
          await expect(factory.addRecipient(fundingAddress, metadata))
            .to.be.revertedWith('Factory: Recipient limit reached');
        }
      }
    });
  });

  it('sets MACI parameters', async () => {
    await expect(factory.setMaciParameters(...maciParameters.values()))
      .to.emit(maciFactory, 'MaciParametersChanged');
  });

  it('allows only owner to set MACI parameters', async () => {
    const coordinatorFactory = factory.connect(coordinator);
    await expect(coordinatorFactory.setMaciParameters(...maciParameters.values()))
      .to.be.revertedWith('Ownable: caller is not the owner');
  });

  it('prevents from changing MACI parameters when waiting for MACI deployment', async () => {
    await factory.setCoordinator(coordinator.address, coordinatorPubKey);
    await factory.setToken(token.address);
    await factory.deployNewRound();
    await expect(factory.setMaciParameters(...maciParameters.values()))
      .to.be.revertedWith('Factory: Waiting for MACI deployment');
  });

  describe('deploying funding round', () => {
    it('deploys funding round', async () => {
      await factory.setToken(token.address);
      await factory.setCoordinator(coordinator.address, coordinatorPubKey);
      await expect(factory.deployNewRound())
        .to.emit(factory, 'NewRound');
      const fundingRoundAddress = await factory.getCurrentRound();
      expect(fundingRoundAddress).to.properAddress;
      expect(fundingRoundAddress).to.not.equal(ZERO_ADDRESS);

      const fundingRound = await ethers.getContractAt(
        'FundingRound',
        fundingRoundAddress,
      );
      expect(await fundingRound.owner()).to.equal(factory.address);
      expect(await fundingRound.nativeToken()).to.equal(token.address);
      const roundCoordinatorPubKey = await fundingRound.coordinatorPubKey();
      expect(roundCoordinatorPubKey.x).to.equal(coordinatorPubKey.x);
      expect(roundCoordinatorPubKey.y).to.equal(coordinatorPubKey.y);
      const contributionDeadline = await fundingRound.contributionDeadline();
      expect(parseInt(contributionDeadline)).to.be.greaterThan(0);
    });

    it('reverts if native token is not set', async () => {
      await factory.setCoordinator(coordinator.address, coordinatorPubKey);
      await expect(factory.deployNewRound())
        .to.be.revertedWith('Factory: Native token is not set');
    });

    it('reverts if coordinator is not set', async () => {
      await factory.setToken(token.address);
      await expect(factory.deployNewRound())
        .to.be.revertedWith('Factory: No coordinator');
    });

    it('reverts if current round is not finalized', async () => {
      await factory.setToken(token.address);
      await factory.setCoordinator(coordinator.address, coordinatorPubKey);
      await factory.deployNewRound();
      await expect(factory.deployNewRound())
        .to.be.revertedWith('Factory: Current round is not finalized');
    });

    it('deploys new funding round after previous round has been finalized', async () => {
      await factory.setToken(token.address);
      await factory.setCoordinator(coordinator.address, coordinatorPubKey);
      await factory.deployNewRound();
      // Re-set coordinator and cancel current round
      await factory.setCoordinator(coordinator.address, coordinatorPubKey);
      await expect(factory.deployNewRound())
        .to.emit(factory, 'NewRound');
    });

    it('only owner can deploy funding round', async () => {
      await factory.setToken(token.address);
      await factory.setCoordinator(coordinator.address, coordinatorPubKey);
      const factoryAsContributor = factory.connect(contributor);
      await expect(factoryAsContributor.deployNewRound())
        .to.be.revertedWith('Ownable: caller is not the owner');
    });
  });

  describe('deploying MACI', () => {
    it('deploys MACI', async () => {
      await factory.setCoordinator(
        coordinator.address,
        coordinatorPubKey,
      );
      await factory.setToken(token.address);
      await factory.deployNewRound();

      const deployTx = await factory.deployMaci();
      expect(await getGasUsage(deployTx)).lessThan(7200000);
      const maciAddress = await getEventArg(
        deployTx,
        maciFactory,
        'MaciDeployed',
        '_maci',
      );

      const fundingRoundAddress = await factory.getCurrentRound();
      const fundingRound = await ethers.getContractAt(
        'FundingRound',
        fundingRoundAddress,
      );
      expect(await fundingRound.maci()).to.equal(maciAddress);
    });

    it('reverts if round has not been deployed', async () => {
      await expect(factory.deployMaci())
        .to.be.revertedWith('Factory: Funding round has not been deployed');
    });

    it('reverts if MACI is already deployed', async () => {
      await factory.setCoordinator(
        coordinator.address,
        coordinatorPubKey,
      );
      await factory.setToken(token.address);
      await factory.deployNewRound();
      await factory.deployMaci();
      await expect(factory.deployMaci())
        .to.be.revertedWith('Factory: MACI already deployed');
    });

    it('only owner can deploy MACI', async () => {
      await factory.setCoordinator(
        coordinator.address,
        coordinatorPubKey,
      );
      await factory.setToken(token.address);
      const factoryAsContributor = factory.connect(contributor);
      await expect(factoryAsContributor.deployMaci())
        .to.be.revertedWith('Ownable: caller is not the owner');
    });
  });

  describe('transferring matching funds', () => {
    const signUpDuration = maciParameters.signUpDuration
    const votingDuration = maciParameters.votingDuration
    const roundDuration = signUpDuration + votingDuration + 10
    const contributionAmount = 1000;

    beforeEach(async () => {
      await factory.setToken(token.address)
      await factory.setCoordinator(coordinator.address, coordinatorPubKey)
      const tokenAsContributor = token.connect(contributor)
      await tokenAsContributor.approve(
        factory.address,
        contributionAmount,
      )
    })

    it('moves matching funds to the current round after its finalization', async () => {
      const factoryAsContributor = factory.connect(contributor);
      await factoryAsContributor.contribute(contributionAmount)
      await factory.deployNewRound();
      const fundingRoundAddress = await factory.getCurrentRound();
      const fundingRound = await ethers.getContractAt(
        'FundingRound',
        fundingRoundAddress,
      );
      await factory.deployMaci();
      await provider.send('evm_increaseTime', [roundDuration]);
      await expect(factory.transferMatchingFunds())
        .to.emit(factory, 'RoundFinalized')
        .withArgs(fundingRoundAddress);
      expect(await fundingRound.isFinalized()).to.equal(true);
      expect(await token.balanceOf(fundingRoundAddress)).to.equal(contributionAmount);
    });

    it('reverts if round has not been deployed', async () => {
      await expect(factory.transferMatchingFunds())
        .to.be.revertedWith('Factory: Funding round has not been deployed');
    });

    it('finalizes current round even if matching pool is empty', async () => {
      await factory.deployNewRound();
      await factory.deployMaci();
      await provider.send('evm_increaseTime', [roundDuration]);
      await expect(factory.transferMatchingFunds())
        .to.emit(factory, 'RoundFinalized');
    });
  });

  it('allows owner to set native token', async () => {
    await expect(factory.setToken(token.address))
      .to.emit(factory, 'NewToken')
      .withArgs(token.address);
    expect(await factory.nativeToken()).to.equal(token.address);
  });

  it('only owner can set native token', async () => {
    const factoryAsContributor = factory.connect(contributor);
    await expect(factoryAsContributor.setToken(token.address))
      .to.be.revertedWith('Ownable: caller is not the owner');
  });

  it('allows owner to change coordinator', async () => {
    await expect(factory.setCoordinator(
        coordinator.address,
        coordinatorPubKey,
      ))
      .to.emit(factory, 'CoordinatorTransferred')
      .withArgs(coordinator.address);
    expect(await factory.coordinator()).to.eq(coordinator.address);
  });

  it('allows only the owner to set a new coordinator', async () => {
    const factoryAsContributor = factory.connect(contributor);
    await expect(factoryAsContributor.setCoordinator(
        coordinator.address,
        coordinatorPubKey,
      ))
      .to.be.revertedWith('Ownable: caller is not the owner');
  });

  it('allows coordinator to call coordinatorQuit and sets coordinator to null', async () => {
    await factory.setCoordinator(coordinator.address, coordinatorPubKey);
    const factoryAsCoordinator = factory.connect(coordinator);
    await expect(factoryAsCoordinator.coordinatorQuit())
      .to.emit(factory, 'CoordinatorTransferred')
      .withArgs(ZERO_ADDRESS);
    expect(await factory.coordinator()).to.equal(ZERO_ADDRESS);
  });

  it('only coordinator can call coordinatorQuit', async () => {
    await factory.setCoordinator(coordinator.address, coordinatorPubKey);
    await expect(factory.coordinatorQuit())
      .to.be.revertedWith('Sender is not the coordinator');
  });

  it('should cancel current round when coordinator is changed', async () => {
    await factory.setToken(token.address);
    await factory.setCoordinator(coordinator.address, coordinatorPubKey);
    await factory.deployNewRound();
    const fundingRoundAddress = await factory.getCurrentRound();
    const fundingRound = await ethers.getContractAt(
      'FundingRound',
      fundingRoundAddress,
    );

    const factoryAsCoordinator = factory.connect(coordinator);
    await expect(factoryAsCoordinator.coordinatorQuit())
      .to.emit(factory, 'RoundFinalized')
      .withArgs(fundingRoundAddress);
    expect(await fundingRound.isCancelled()).to.equal(true);
  });
});
