import { waffle } from '@nomiclabs/buidler';
import { Contract } from 'ethers';
import { use, expect } from 'chai';
import { solidity } from 'ethereum-waffle';
import { deployMockContract } from '@ethereum-waffle/mock-contract';
import { Keypair } from 'maci-domainobjs';

import SignUpGatekeeper from '../build/contracts/SignUpGatekeeper.json';
import InitialVoiceCreditProxy from '../build/contracts/InitialVoiceCreditProxy.json';
import { getGasUsage } from '../utils/contracts'
import { deployMaciFactory } from '../utils/deployment'
import { MaciParameters } from '../utils/maci'

use(solidity);

describe('MACI factory', () => {
  const provider = waffle.provider;
  const [, deployer, coordinator] = provider.getWallets()

  let maciFactory: Contract;
  let signUpGatekeeper: Contract;
  let initialVoiceCreditProxy: Contract;
  let maciParameters = new MaciParameters();
  const coordinatorPubKey = (new Keypair()).pubKey.asContractParam();

  beforeEach(async () => {
    maciFactory = await deployMaciFactory(deployer);
    expect(await getGasUsage(maciFactory.deployTransaction)).lessThan(5600000);

    signUpGatekeeper = await deployMockContract(deployer, SignUpGatekeeper.abi);
    initialVoiceCreditProxy = await deployMockContract(deployer, InitialVoiceCreditProxy.abi);
  });

  it('sets default MACI parameters', async () => {
    expect(await maciFactory.maxUsers()).to.equal(15);
    expect(await maciFactory.maxMessages()).to.equal(15);
    expect(await maciFactory.maxVoteOptions()).to.equal(24);
    expect(await maciFactory.signUpDuration()).to.equal(604800);
    expect(await maciFactory.votingDuration()).to.equal(604800);
  });

  it('sets MACI parameters', async () => {
    maciParameters = new MaciParameters({
      stateTreeDepth: 8,
      messageTreeDepth: 12,
      voteOptionTreeDepth: 4,
      signUpDuration: 86400,
      votingDuration: 86400,
    });
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

  it('does not allow to decrease the vote option tree depth', async () => {
    maciParameters = new MaciParameters({ voteOptionTreeDepth: 1 });
    await expect(maciFactory.setMaciParameters(...maciParameters.values()))
      .to.be.revertedWith('MACIFactory: Vote option tree depth can not be decreased');
  });

  it('allows only owner to set MACI parameters', async () => {
    const coordinatorMaciFactory = maciFactory.connect(coordinator);
    await expect(coordinatorMaciFactory.setMaciParameters(...maciParameters.values()))
      .to.be.revertedWith('Ownable: caller is not the owner');
  });

  it('deploys MACI', async () => {
    const maciDeployed = maciFactory.deployMaci(
      signUpGatekeeper.address,
      initialVoiceCreditProxy.address,
      coordinatorPubKey,
    );
    await expect(maciDeployed).to.emit(maciFactory, 'MaciDeployed');

    const deployTx = await maciDeployed;
    expect(await getGasUsage(deployTx)).lessThan(7200000);
  });

  it('allows only owner to deploy MACI', async () => {
    const coordinatorMaciFactory = maciFactory.connect(coordinator);
    await expect(coordinatorMaciFactory.deployMaci(
      signUpGatekeeper.address,
      initialVoiceCreditProxy.address,
      coordinatorPubKey,
    ))
      .to.be.revertedWith('Ownable: caller is not the owner');
  })
});
