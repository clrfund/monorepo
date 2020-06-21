import { ethers, waffle } from '@nomiclabs/buidler';
import { use, expect } from 'chai';
import { solidity } from 'ethereum-waffle';
import { Contract } from 'ethers';
import { defaultAbiCoder } from 'ethers/utils/abi-coder';

import { ZERO_ADDRESS } from './utils';

use(solidity);

describe('Initial voice credit proxy', () => {
  const provider = waffle.provider;
  const [dontUseMe, deployer] = provider.getWallets();

  let initialVoiceCreditProxy: Contract;

  beforeEach(async () => {
    const InitialVoiceCreditProxy = await ethers.getContractFactory(
        'FundingRoundVoiceCreditProxy',
        deployer,
    );
    initialVoiceCreditProxy = await InitialVoiceCreditProxy.deploy();
  });

  it('decodes the amount of voice credits', async () => {
    const contributor = ZERO_ADDRESS;
    const amount = 1000;
    const encoded = defaultAbiCoder.encode(['uint256'], [amount]);
    expect(await initialVoiceCreditProxy.getVoiceCredits(contributor, encoded))
      .to.equal(amount);
  });
});
