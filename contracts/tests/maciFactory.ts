import { artifacts, ethers, config } from 'hardhat'
import { Contract, TransactionResponse } from 'ethers'
import { expect } from 'chai'
import { deployMockContract, MockContract } from '@clrfund/waffle-mock-contract'

import { getEventArg, getGasUsage } from '../utils/contracts'
import { deployMaciFactory, deployPoseidonLibraries } from '../utils/deployment'
import { MaciParameters } from '../utils/maciParameters'
import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers'
import { Keypair } from '@clrfund/common'

describe('MACI factory', () => {
  let deployer: HardhatEthersSigner
  let coordinator: HardhatEthersSigner

  const duration = 100
  let maciFactory: Contract
  let signUpGatekeeper: MockContract
  let initialVoiceCreditProxy: MockContract
  let topupContract: MockContract
  let maciParameters: MaciParameters
  let poseidonContracts: { [name: string]: string }
  const coordinatorPubKey = new Keypair().pubKey.asContractParam()

  before(async () => {
    ;[, deployer, coordinator] = await ethers.getSigners()
  })

  beforeEach(async () => {
    if (!poseidonContracts) {
      poseidonContracts = await deployPoseidonLibraries({
        artifactsPath: config.paths.artifacts,
        ethers,
        signer: deployer,
      })
    }
    maciParameters = MaciParameters.mock()
    maciFactory = await deployMaciFactory({
      ethers,
      signer: deployer,
      libraries: poseidonContracts,
      maciParameters,
    })
    const transaction = await maciFactory.deploymentTransaction()
    expect(transaction).to.be.not.null
    expect(await getGasUsage(transaction as TransactionResponse)).lessThan(
      5600000
    )

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
    const stateTreeDepth = await maciFactory.stateTreeDepth()
    const treeDepths = await maciFactory.treeDepths()
    expect(stateTreeDepth).to.be.greaterThan(BigInt(0))
    expect(treeDepths.voteOptionTreeDepth).to.be.greaterThan(BigInt(0))
    expect(treeDepths.messageTreeDepth).to.be.greaterThan(BigInt(0))
  })

  it('sets MACI parameters', async () => {
    await expect(
      maciFactory.setMaciParameters(...maciParameters.asContractParam())
    ).to.emit(maciFactory, 'MaciParametersChanged')

    const { messageTreeDepth } = await maciFactory.treeDepths()
    expect(messageTreeDepth).to.equal(
      maciParameters.treeDepths.messageTreeDepth
    )
  })

  it('allows only owner to set MACI parameters', async () => {
    const coordinatorMaciFactory = maciFactory.connect(coordinator) as Contract
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
      signUpGatekeeper.target,
      initialVoiceCreditProxy.target,
      topupContract.target,
      duration,
      coordinator.address,
      coordinatorPubKey,
      deployer.address
    )
    await expect(maciDeployed).to.emit(maciFactory, 'MaciDeployed')

    const deployTx = await maciDeployed
    // TODO: reduce the gas usage
    expect(await getGasUsage(deployTx)).lessThan(15094000)
  })

  it('allows anyone to deploy MACI', async () => {
    const setParamTx = await maciFactory.setMaciParameters(
      ...maciParameters.asContractParam()
    )
    await setParamTx.wait()
    const coordinatorMaciFactory = maciFactory.connect(coordinator) as Contract

    const deployTx = await coordinatorMaciFactory.deployMaci(
      signUpGatekeeper.target,
      initialVoiceCreditProxy.target,
      topupContract.target,
      duration,
      coordinator.address,
      coordinatorPubKey,
      coordinator.address
    )
    await expect(deployTx).to.emit(maciFactory, 'MaciDeployed')
  })

  it('links with PoseidonT3 correctly', async () => {
    const setParamTx = await maciFactory.setMaciParameters(
      ...maciParameters.asContractParam()
    )
    await setParamTx.wait()
    const deployTx = await maciFactory.deployMaci(
      signUpGatekeeper.target,
      initialVoiceCreditProxy.target,
      topupContract.target,
      duration,
      coordinator.address,
      coordinatorPubKey,
      deployer.address
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
    const deployTx = await maciFactory.deployMaci(
      signUpGatekeeper.target,
      initialVoiceCreditProxy.target,
      topupContract.target,
      duration,
      coordinator.address,
      coordinatorPubKey,
      deployer.address
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
