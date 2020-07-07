import { ethers, waffle } from '@nomiclabs/buidler';
import { use, expect } from 'chai';
import { deployContract, solidity } from 'ethereum-waffle';
import { Contract } from 'ethers';

import { deployMaciFactory } from '../scripts/helpers';
import { ZERO_ADDRESS, getGasUsage, getEventArg, MaciParameters } from './utils';

import FactoryArtifact from '../build/contracts/FundingRoundFactory.json';
import TokenArtifact from '../build/contracts/AnyOldERC20Token.json';

use(solidity);

describe('Funding Round Factory', () => {
  const provider = waffle.provider;
  const [dontUseMe, deployer, coordinator, contributor] = provider.getWallets();// eslint-disable-line @typescript-eslint/no-unused-vars

  let maciFactory: Contract;
  let factory: Contract;
  let token: Contract;

  const maciParameters = new MaciParameters();
  const coordinatorPubKey = { x: 0, y: 1 };

  beforeEach(async () => {
    maciFactory = await deployMaciFactory(deployer);

    factory = await deployContract(deployer, FactoryArtifact, [
      maciFactory.address,
    ]);

    expect(factory.address).to.properAddress;
    expect(await getGasUsage(factory.deployTransaction)).lessThan(4000000);
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

  describe('adding recipients', () => {
    let fundingAddress: string;
    let recipientName: string;
    beforeEach(() => {
      fundingAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
      recipientName = 'test';
    });

    it('allows owner to add recipient', async () => {
      const expectedIndex = 1;
      await expect(factory.addRecipient(fundingAddress, recipientName))
        .to.emit(factory, 'RecipientAdded')
        .withArgs(fundingAddress, recipientName, expectedIndex);
      expect(await factory.recipients(fundingAddress))
        .to.equal(recipientName);
      expect(await factory.recipientIndex(fundingAddress))
        .to.equal(expectedIndex);
    });

    it('rejects calls from anyone except owner', async () => {
      const contributorFactory = factory.connect(contributor);
      await expect(contributorFactory.addRecipient(fundingAddress, recipientName))
        .to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('should not accept zero-address', async () => {
      fundingAddress = ZERO_ADDRESS;
      await expect(factory.addRecipient(fundingAddress, recipientName))
        .to.be.revertedWith('Factory: Recipient address is zero');
    });

    it('should not accept empty string as name', async () => {
      recipientName = ''
      await expect(factory.addRecipient(fundingAddress, recipientName))
        .to.be.revertedWith('Factory: Recipient name is empty string');
    });

    it('should not accept already registered address', async () => {
      await factory.addRecipient(fundingAddress, recipientName);
      recipientName = 'test-2';
      await expect(factory.addRecipient(fundingAddress, recipientName))
        .to.be.revertedWith('Factory: Recipient already registered');
    });

    it('should limit the number of recipients', async () => {
      const maxRecipientCount = 5 ** maciParameters.voteOptionTreeDepth - 1;
      for (let i = 0; i < maxRecipientCount + 1; i++) {
        recipientName = String(i + 1).padStart(4, '0');
        fundingAddress = `0x000000000000000000000000000000000000${recipientName}`;
        if (i < maxRecipientCount) {
          await factory.addRecipient(fundingAddress, recipientName);
        } else {
          await expect(factory.addRecipient(fundingAddress, recipientName))
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
      expect(parseInt(roundCoordinatorPubKey[0])).to.equal(coordinatorPubKey.x);
      expect(parseInt(roundCoordinatorPubKey[1])).to.equal(coordinatorPubKey.y);
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
      // TODO: write test when cancel() will be implemented
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
      expect(await getGasUsage(deployTx)).lessThan(7000000);
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
    it('moves matching funds to the current round after its finalization', async () => {
      // TODO: add tests later; needs time travel
    });

    it('reverts if round has not been deployed', async () => {
      await factory.setToken(token.address);
      await factory.setCoordinator(coordinator.address, coordinatorPubKey);
      await expect(factory.transferMatchingFunds())
        .to.be.revertedWith('Factory: Funding round has not been deployed');
    });

    it('finalizes current round even if matching pool is empty', async () => {
      // TODO: add tests later
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
});
