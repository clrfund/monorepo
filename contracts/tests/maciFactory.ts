import { waffle } from '@nomiclabs/buidler';
import { use, expect } from 'chai';
import { solidity } from 'ethereum-waffle';

import { deployMaciFactory } from '../scripts/helpers';
import { getGasUsage, MaciParameters } from './utils';
import { Contract } from 'ethers';

use(solidity);

describe('MACI factory', () => {
  const provider = waffle.provider;
  const [dontUseMe, deployer, coordinator] = provider.getWallets();// eslint-disable-line @typescript-eslint/no-unused-vars

  let maciFactory: Contract;

  const maciParameters = new MaciParameters();
  const coordinatorPubKey = { x: 0, y: 1 };

  beforeEach(async () => {
    maciFactory = await deployMaciFactory(deployer);
    expect(await getGasUsage(maciFactory.deployTransaction)).lessThan(5500000);
  });

  it('sets default MACI parameters', async () => {
    expect(await maciFactory.maxUsers()).to.equal(1023);
    expect(await maciFactory.maxMessages()).to.equal(1023);
    expect(await maciFactory.maxVoteOptions()).to.equal(624);
    expect(await maciFactory.signUpDuration()).to.equal(604800);
    expect(await maciFactory.votingDuration()).to.equal(604800);
  });

  it('sets MACI parameters', async () => {
    await expect(maciFactory.setMaciParameters(...maciParameters.values()))
      .to.emit(maciFactory, 'MaciParametersChanged');

    expect(await maciFactory.maxUsers())
      .to.equal(2 ** maciParameters.stateTreeDepth - 1);
    expect(await maciFactory.maxMessages())
      .to.equal(2 ** maciParameters.messageTreeDepth - 1);
    expect(await maciFactory.maxVoteOptions())
      .to.equal(5 ** maciParameters.voteOptionTreeDepth - 1);
    expect(await maciFactory.signUpDuration())
      .to.equal(maciParameters.signUpDuration);
    expect(await maciFactory.votingDuration())
      .to.equal(maciParameters.votingDuration);
  });

  it('allows only owner to set MACI parameters', async () => {
    const coordinatorMaciFactory = maciFactory.connect(coordinator);
    await expect(coordinatorMaciFactory.setMaciParameters(...maciParameters.values()))
      .to.be.revertedWith('Ownable: caller is not the owner');
  });

  it('deploys MACI', async () => {
    const maciDeployed = maciFactory.deployMaci(
      coordinatorPubKey,
    );
    await expect(maciDeployed).to.emit(maciFactory, 'MaciDeployed');

    const deployTx = await maciDeployed;
    expect(await getGasUsage(deployTx)).lessThan(7000000);
  });

  it('allows only owner to deploy MACI', async () => {
    const coordinatorMaciFactory = maciFactory.connect(coordinator);
    await expect(coordinatorMaciFactory.deployMaci(
        coordinatorPubKey,
      ))
      .to.be.revertedWith('Ownable: caller is not the owner');
    });
});
