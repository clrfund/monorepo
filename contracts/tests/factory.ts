import { ethers, waffle } from '@nomiclabs/buidler';
import { use, expect } from 'chai';
import { solidity } from 'ethereum-waffle'
import { Contract } from 'ethers';
import { genRandomSalt } from 'maci-crypto'
import { Keypair } from 'maci-domainobjs';

import MACIArtifact from '../build/contracts/MACI.json'
import { ZERO_ADDRESS, UNIT } from '../utils/constants'
import { getGasUsage, getEventArg } from '../utils/contracts'
import { deployMaciFactory } from '../utils/deployment'
import { MaciParameters } from '../utils/maci'

use(solidity);

describe('Funding Round Factory', () => {
  const provider = waffle.provider;
  const [, deployer, coordinator, contributor] = provider.getWallets()

  let maciFactory: Contract;
  let recipientRegistry: Contract
  let factory: Contract;
  let token: Contract;
  let maciParameters: MaciParameters
  const coordinatorPubKey = (new Keypair()).pubKey.asContractParam()

  beforeEach(async () => {
    maciFactory = await deployMaciFactory(deployer);
    maciParameters = await MaciParameters.read(maciFactory)

    const SimpleUserRegistry = await ethers.getContractFactory('SimpleUserRegistry', deployer)
    const verifiedUserRegistry = await SimpleUserRegistry.deploy()

    const SimpleRecipientRegistry = await ethers.getContractFactory('SimpleRecipientRegistry', deployer)
    recipientRegistry = await SimpleRecipientRegistry.deploy()
    await recipientRegistry.setController()
    await recipientRegistry.setMaxRecipients(24)

    const FundingRoundFactory = await ethers.getContractFactory('FundingRoundFactory', deployer)
    factory = await FundingRoundFactory.deploy(
      maciFactory.address,
      verifiedUserRegistry.address,
      recipientRegistry.address,
    )

    expect(factory.address).to.properAddress;
    expect(await getGasUsage(factory.deployTransaction)).lessThan(5100000)
    await maciFactory.transferOwnership(factory.address);

    // Deploy token contract and transfer tokens to contributor
    const tokenInitialSupply = UNIT.mul(1000)
    const Token = await ethers.getContractFactory('AnyOldERC20Token', deployer)
    token = await Token.deploy(tokenInitialSupply)
    expect(token.address).to.properAddress;
    await token.transfer(contributor.address, tokenInitialSupply);
  });

  it('initializes factory', async () => {
    expect(await factory.coordinator()).to.equal(ZERO_ADDRESS)
    expect(await factory.nativeToken()).to.equal(ZERO_ADDRESS)
    expect(await factory.maciFactory()).to.equal(maciFactory.address)
    expect(await factory.recipientRegistry()).to.equal(recipientRegistry.address)
    expect(await recipientRegistry.controller()).to.equal(deployer.address)
    expect(await recipientRegistry.maxRecipients())
      .to.equal(5 ** maciParameters.voteOptionTreeDepth - 1)
  })

  it('transfers ownership to another address', async () => {
    await expect(factory.transferOwnership(coordinator.address))
      .to.emit(factory, 'OwnershipTransferred')
      .withArgs(deployer.address, coordinator.address)
  })

  describe('contributing to matching pool', () => {
    const contributionAmount = UNIT.mul(10)

    it('allows user to contribute to matching pool', async () => {
      await factory.setToken(token.address);
      const tokenAsContributor = token.connect(contributor);
      await tokenAsContributor.approve(
        factory.address,
        contributionAmount,
      );
      const factoryAsContributor = factory.connect(contributor);
      await expect(factoryAsContributor.contributeMatchingFunds(contributionAmount))
        .to.emit(factory, 'MatchingPoolContribution')
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
      await expect(factoryAsContributor.contributeMatchingFunds(contributionAmount))
        .to.be.revertedWith('Factory: Native token is not set');
    });

    it('requires approval', async () => {
      await factory.setToken(token.address);
      const factoryAsContributor = factory.connect(contributor);
      await expect(factoryAsContributor.contributeMatchingFunds(contributionAmount))
        .to.be.revertedWith('revert ERC20: transfer amount exceeds allowance');
    });

    it('accepts direct token transfer', async () => {
      await factory.setToken(token.address)
      const tokenAsContributor = token.connect(contributor)
      await expect(tokenAsContributor.transfer(factory.address, contributionAmount))
        .to.emit(token, 'Transfer')
        .withArgs(contributor.address, factory.address, contributionAmount)
      expect(await token.balanceOf(factory.address)).to.equal(contributionAmount)
    })
  });

  it('sets MACI parameters', async () => {
    maciParameters.update({ voteOptionTreeDepth: 3 })
    await expect(factory.setMaciParameters(...maciParameters.values()))
      .to.emit(maciFactory, 'MaciParametersChanged')
    const treeDepths = await maciFactory.treeDepths()
    expect(treeDepths.voteOptionTreeDepth).to.equal(3)
  });

  it('allows only owner to set MACI parameters', async () => {
    const coordinatorFactory = factory.connect(coordinator);
    await expect(coordinatorFactory.setMaciParameters(...maciParameters.values()))
      .to.be.revertedWith('Ownable: caller is not the owner');
  });

  describe('deploying funding round', () => {
    it('deploys funding round', async () => {
      await factory.setToken(token.address);
      await factory.setCoordinator(coordinator.address, coordinatorPubKey);
      const deployed = factory.deployNewRound()
      await expect(deployed).to.emit(factory, 'RoundStarted')
      const deployTx = await deployed
      expect(await getGasUsage(deployTx)).lessThan(9000000)

      const fundingRoundAddress = await factory.getCurrentRound();
      expect(fundingRoundAddress).to.properAddress;
      expect(fundingRoundAddress).to.not.equal(ZERO_ADDRESS);

      const fundingRound = await ethers.getContractAt(
        'FundingRound',
        fundingRoundAddress,
      );
      expect(await fundingRound.owner()).to.equal(factory.address);
      expect(await fundingRound.nativeToken()).to.equal(token.address);

      const maciAddress = await getEventArg(
        deployTx,
        maciFactory,
        'MaciDeployed',
        '_maci',
      )
      expect(await fundingRound.maci()).to.equal(maciAddress)
      const maci = await ethers.getContractAt(MACIArtifact.abi, maciAddress)
      const roundCoordinatorPubKey = await maci.coordinatorPubKey()
      expect(roundCoordinatorPubKey.x).to.equal(coordinatorPubKey.x)
      expect(roundCoordinatorPubKey.y).to.equal(coordinatorPubKey.y)
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
        .to.emit(factory, 'RoundStarted')
    });

    it('only owner can deploy funding round', async () => {
      await factory.setToken(token.address);
      await factory.setCoordinator(coordinator.address, coordinatorPubKey);
      const factoryAsContributor = factory.connect(contributor);
      await expect(factoryAsContributor.deployNewRound())
        .to.be.revertedWith('Ownable: caller is not the owner');
    });
  });

  describe('transferring matching funds', () => {
    const contributionAmount = UNIT.mul(10)
    const totalSpent = UNIT.mul(100)
    const totalSpentSalt = genRandomSalt().toString()

    beforeEach(async () => {
      await factory.setToken(token.address)
      await factory.setCoordinator(coordinator.address, coordinatorPubKey)
      const tokenAsContributor = token.connect(contributor)
      await tokenAsContributor.approve(
        factory.address,
        contributionAmount,
      )
    })

    it('reverts if votes has not been tallied', async () => {
      const factoryAsContributor = factory.connect(contributor);
      await factoryAsContributor.contributeMatchingFunds(contributionAmount)
      await factory.deployNewRound();
      const roundDuration = maciParameters.signUpDuration + maciParameters.votingDuration + 10
      await provider.send('evm_increaseTime', [roundDuration]);
      await expect(factory.transferMatchingFunds(totalSpent, totalSpentSalt))
        .to.be.revertedWith('FundingRound: Votes has not been tallied')
    });

    it('reverts if round has not been deployed', async () => {
      await expect(factory.transferMatchingFunds(totalSpent, totalSpentSalt))
        .to.be.revertedWith('Factory: Funding round has not been deployed');
    });
  });

  it('allows owner to set native token', async () => {
    await expect(factory.setToken(token.address))
      .to.emit(factory, 'TokenChanged')
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
      .to.emit(factory, 'CoordinatorChanged')
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
      .to.emit(factory, 'CoordinatorChanged')
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
