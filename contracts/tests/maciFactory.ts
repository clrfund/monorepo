import { waffle } from '@nomiclabs/buidler';
import { use, expect } from 'chai';
import { solidity } from 'ethereum-waffle';

import { deployMaciFactory } from '../scripts/helpers';
import { getGasUsage } from './utils';

use(solidity);

describe('MACI factory', () => {
  const provider = waffle.provider;
  const [dontUseMe, deployer, coordinator] = provider.getWallets();

  let maciFactory: any;

  const signUpDuration = 86400;
  const votingDuration = 86400;
  const coordinatorPubKey = { x: 0, y: 1 };

  beforeEach(async () => {
    maciFactory = await deployMaciFactory(deployer);
    expect(await getGasUsage(maciFactory.deployTransaction)).lessThan(5500000);
  });

  it('deploys MACI', async () => {
    const maciDeployed = maciFactory.deployMaci(
      signUpDuration,
      votingDuration,
      coordinatorPubKey,
    );
    await expect(maciDeployed).to.emit(maciFactory, 'MaciDeployed');

    const deployTx = await maciDeployed;
    expect(await getGasUsage(deployTx)).lessThan(7000000);
  });

  it('allows only owner to deploy MACI', async () => {
    const coordinatorMaciFactory = maciFactory.connect(coordinator);
    await expect(coordinatorMaciFactory.deployMaci(
        signUpDuration,
        votingDuration,
        coordinatorPubKey,
      ))
      .to.be.revertedWith('Ownable: caller is not the owner');
    });
});
