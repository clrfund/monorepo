import { ethers, waffle } from '@nomiclabs/buidler';
import { use, expect } from 'chai';
import { solidity } from 'ethereum-waffle';
import { deployMockContract } from '@ethereum-waffle/mock-contract';
import { Contract } from 'ethers';

import { deployMaciFactory } from '../scripts/helpers';
import { ZERO_ADDRESS, getEventArg } from './utils';
import IRecipientRegistryArtifact from '../build/contracts/IRecipientRegistry.json';
import MACIArtifact from '../build/contracts/MACI.json';

use(solidity);

describe('Funding Round', () => {
  const provider = waffle.provider;
  const [dontUseMe, deployer, coordinator, contributor] = provider.getWallets();// eslint-disable-line @typescript-eslint/no-unused-vars

  const coordinatorPubKey = { x: 0, y: 1 };
  const roundDuration = 86400 * 7;

  let token: Contract;
  let recipientRegistry: Contract;
  let fundingRound: Contract;
  let maci: Contract;

  beforeEach(async () => {
    const tokenInitialSupply = 10000000000;
    const Token = await ethers.getContractFactory('AnyOldERC20Token', deployer);
    token = await Token.deploy(tokenInitialSupply);
    await token.transfer(contributor.address, tokenInitialSupply);

    recipientRegistry = await deployMockContract(deployer, IRecipientRegistryArtifact.abi);
    await recipientRegistry.mock.getRecipientIndex.returns(3);
    expect(await recipientRegistry.getRecipientIndex(ZERO_ADDRESS)).to.equal(3);

    const FundingRound = await ethers.getContractFactory('FundingRound', deployer);
    fundingRound = await FundingRound.deploy(
      token.address,
      recipientRegistry.address,
      roundDuration,
      coordinatorPubKey,
    );

    const maciFactory = await deployMaciFactory(deployer);
    const maciDeployed = await maciFactory.deployMaci(coordinatorPubKey);
    const maciAddress = await getEventArg(maciDeployed, maciFactory, 'MaciDeployed', '_maci');
    maci = await ethers.getContractAt(MACIArtifact.abi, maciAddress);
  });

  it('initializes funding round correctly', async () => {
    expect(await fundingRound.owner()).to.equal(deployer.address);
    expect(await fundingRound.nativeToken()).to.equal(token.address);
    expect(await fundingRound.recipientRegistry()).to.equal(recipientRegistry.address);
    expect(await fundingRound.isFinalized()).to.equal(false);
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
      // TODO: add test later
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

  it('allows owner to finalize round', async () => {
    // TODO: add tests later
  });

  it('allows recipient to claim funds', async () => {
    // TODO: add tests later
  });
});
