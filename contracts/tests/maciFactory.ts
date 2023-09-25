import { waffle, artifacts, ethers } from 'hardhat'
import { Contract } from 'ethers'
import { use, expect } from 'chai'
import { solidity } from 'ethereum-waffle'
import { deployMockContract } from '@ethereum-waffle/mock-contract'
import { Keypair } from '@clrfund/common'

import { getEventArg, getGasUsage } from '../utils/contracts'
import { deployMaciFactory, deployPoseidonLibraries } from '../utils/deployment'
import { MaciParameters } from '../utils/maci'

use(solidity)

describe('MACI factory', () => {
  const provider = waffle.provider
  const [, deployer, coordinator] = provider.getWallets()

  const duration = 100
  let maciFactory: Contract
  let signUpGatekeeper: Contract
  let initialVoiceCreditProxy: Contract
  let topupContract: Contract
  let maciParameters: MaciParameters
  let poseidonContracts: { [name: string]: string }
  const coordinatorPubKey = new Keypair().pubKey.asContractParam()

  beforeEach(async () => {
    if (!poseidonContracts) {
      poseidonContracts = await deployPoseidonLibraries(deployer)
    }
    maciFactory = await deployMaciFactory(deployer, poseidonContracts)
    expect(await getGasUsage(maciFactory.deployTransaction)).lessThan(5600000)

    maciParameters = MaciParameters.mock('micro')

    const SignUpGatekeeperArtifact =
      await artifacts.readArtifact('SignUpGatekeeper')
    signUpGatekeeper = await deployMockContract(
      deployer,
      SignUpGatekeeperArtifact.abi
    )
    const InitialVoiceCreditProxyArtifact = await artifacts.readArtifact(
      'InitialVoiceCreditProxy'
    )
    initialVoiceCreditProxy = await deployMockContract(
      deployer,
      InitialVoiceCreditProxyArtifact.abi
    )
    const Token = await artifacts.readArtifact('AnyOldERC20Token')
    topupContract = await deployMockContract(deployer, Token.abi)
  })

  it('sets default MACI parameters', async () => {
    const { maxMessages, maxVoteOptions } = await maciFactory.maxValues()
    expect(maxMessages).to.equal(0)
    expect(maxVoteOptions).to.equal(0)
  })

  it('sets MACI parameters', async () => {
    await expect(
      maciFactory.setMaciParameters(...maciParameters.asContractParam())
    ).to.emit(maciFactory, 'MaciParametersChanged')

    const { messageTreeDepth } = await maciFactory.treeDepths()
    const { maxMessages, maxVoteOptions } = await maciFactory.maxValues()
    expect(maxMessages).to.equal(maciParameters.maxMessages)
    expect(maxVoteOptions).to.equal(maciParameters.maxVoteOptions)
    expect(messageTreeDepth).to.equal(maciParameters.messageTreeDepth)
  })

  it('does not allow to decrease the vote option tree depth', async () => {
    await expect(
      maciFactory.setMaciParameters(...maciParameters.asContractParam())
    ).to.emit(maciFactory, 'MaciParametersChanged')

    maciParameters.voteOptionTreeDepth = 1
    await expect(
      maciFactory.setMaciParameters(...maciParameters.asContractParam())
    ).to.be.revertedWith('CannotDecreaseVoteOptionDepth')
  })

  it('allows only owner to set MACI parameters', async () => {
    const coordinatorMaciFactory = maciFactory.connect(coordinator)
    await expect(
      coordinatorMaciFactory.setMaciParameters(
        ...maciParameters.asContractParam()
      )
    ).to.be.revertedWith('Ownable: caller is not the owner')
  })

  it('deploys MACI', async () => {
    const setParamTx = await maciFactory.setMaciParameters(
      ...maciParameters.asContractParam()
    )
    await setParamTx.wait()
    const maciDeployed = maciFactory.deployMaci(
      signUpGatekeeper.address,
      initialVoiceCreditProxy.address,
      topupContract.address,
      duration,
      coordinator.address,
      coordinatorPubKey
    )
    await expect(maciDeployed).to.emit(maciFactory, 'MaciDeployed')

    const deployTx = await maciDeployed
    // TODO: reduce the gas usage
    expect(await getGasUsage(deployTx)).lessThan(15094000)
  })

  it('allows only owner to deploy MACI', async () => {
    const setParamTx = await maciFactory.setMaciParameters(
      ...maciParameters.asContractParam()
    )
    await setParamTx.wait()
    const coordinatorMaciFactory = maciFactory.connect(coordinator)
    await expect(
      coordinatorMaciFactory.deployMaci(
        signUpGatekeeper.address,
        initialVoiceCreditProxy.address,
        topupContract.address,
        duration,
        coordinator.address,
        coordinatorPubKey
      )
    ).to.be.revertedWith('Ownable: caller is not the owner')
  })

  it('links with PoseidonT3 correctly', async () => {
    const setParamTx = await maciFactory.setMaciParameters(
      ...maciParameters.asContractParam()
    )
    await setParamTx.wait()
    const deployTx = await maciFactory.deployMaci(
      signUpGatekeeper.address,
      initialVoiceCreditProxy.address,
      topupContract.address,
      duration,
      coordinator.address,
      coordinatorPubKey
    )

    const maciAddress = await getEventArg(
      deployTx,
      maciFactory,
      'MaciDeployed',
      '_maci'
    )
    const maciContract = await ethers.getContractAt('MACI', maciAddress)
    const hash = await maciContract.hashLeftRight(0, 0)
    expect(hash.toString()).to.eq(
      '14744269619966411208579211824598458697587494354926760081771325075741142829156'
    )
  })

  it('links with PoseidonT6 correctly', async () => {
    const setParamTx = await maciFactory.setMaciParameters(
      ...maciParameters.asContractParam()
    )
    await setParamTx.wait()
    const deployTx = await maciFactory.deployMaci(
      signUpGatekeeper.address,
      initialVoiceCreditProxy.address,
      topupContract.address,
      duration,
      coordinator.address,
      coordinatorPubKey
    )

    const maciAddress = await getEventArg(
      deployTx,
      maciFactory,
      'MaciDeployed',
      '_maci'
    )
    const maciContract = await ethers.getContractAt('MACI', maciAddress)
    const hash = await maciContract.hash5([0, 0, 0, 0, 0])
    expect(hash.toString()).to.eq(
      '14655542659562014735865511769057053982292279840403315552050801315682099828156'
    )
  })
})
