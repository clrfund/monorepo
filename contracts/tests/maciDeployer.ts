import { ethers, waffle, artifacts } from 'hardhat'
import { use, expect } from 'chai'
import { solidity } from 'ethereum-waffle'
import { Contract } from 'ethers'
import { deployMockContract } from '@ethereum-waffle/mock-contract'
import { Keypair } from 'maci-domainobjs'
import { getGasUsage, getEventArg } from '../utils/contracts'
import {
  deployContract,
  getMACIFcatoryDeploymentParams,
} from '../utils/deployment'
import { MaciParameters } from '../utils/maci'
import { Libraries } from 'hardhat/types/runtime'

use(solidity)

describe('CLR Fund MACI Factory Deployer', () => {
  const provider = waffle.provider
  const [deployer, coordinator] = provider.getWallets()

  let factoryTemplate: Contract
  let factory: Contract
  let clrFundMACIFactoryDeployer: Contract
  let poseidonT3: Contract
  let poseidonT6: Contract
  let signUpGatekeeper: Contract
  let initialVoiceCreditProxy: Contract
  const coordinatorPubKey = new Keypair().pubKey.asContractParam()
  let maciParameters: MaciParameters

  beforeEach(async () => {
    const PoseidonT3 = await ethers.getContractFactory(':PoseidonT3', deployer)
    poseidonT3 = await PoseidonT3.deploy()

    const PoseidonT6 = await ethers.getContractFactory(':PoseidonT6', deployer)
    poseidonT6 = await PoseidonT6.deploy()

    const maciLibraries: Libraries = {
      'maci-contracts/sol/Poseidon.sol:PoseidonT3': poseidonT3.address,
      'maci-contracts/sol/Poseidon.sol:PoseidonT6': poseidonT6.address,
    }
    const MACIFactory = await ethers.getContractFactory('ClrFundMACIFactory', {
      signer: deployer,
      libraries: maciLibraries,
    })
    maciParameters = await getMACIFcatoryDeploymentParams(deployer)

    // deploying the  singleton by passing  the values for the constructor
    factoryTemplate = await MACIFactory.deploy(...maciParameters.values())

    expect(factoryTemplate.address).to.properAddress

    // since the singleton deployment now has init() and there are 9 params called in the constructor so the gas cost has increased
    expect(await getGasUsage(factoryTemplate.deployTransaction)).lessThan(
      5327100
    )

    clrFundMACIFactoryDeployer = await deployContract(
      deployer,
      'ClrFundMACIFactoryDeployer',
      [factoryTemplate.address]
    )

    expect(clrFundMACIFactoryDeployer.address).to.properAddress
    expect(
      await getGasUsage(clrFundMACIFactoryDeployer.deployTransaction)
    ).lessThan(5100000)

    const newInstanceTx = await clrFundMACIFactoryDeployer.deployMACIFactory(
      ...maciParameters.values()
    )
    const instanceAddress = await getEventArg(
      newInstanceTx,
      clrFundMACIFactoryDeployer,
      'NewInstance',
      'clrfundMACIFactory'
    )

    factory = await ethers.getContractAt(
      'ClrFundMACIFactory',
      instanceAddress,
      deployer
    )

    const SignUpGatekeeperArtifact = await artifacts.readArtifact(
      'SignUpGatekeeper'
    )
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
  })

  it('makes sure the init function was called when singleton was deployed', async () => {
    const { maxUsers, maxMessages, maxVoteOptions } = await factory.maxValues()
    expect(maxUsers).to.equal(4294967295)
    expect(maxMessages).to.equal(4294967295)
    expect(maxVoteOptions).to.equal(124)
    expect(await factory.signUpDuration()).to.equal(604800)
    expect(await factory.votingDuration()).to.equal(604800)
  })

  it('can only be initialized once', async () => {
    await expect(factory.init(...maciParameters.values())).to.be.revertedWith(
      'Initializable: contract is already initialized'
    )
  })

  it('can register with the subgraph', async () => {
    await expect(
      clrFundMACIFactoryDeployer.registerInstance(
        factory.address,
        '{name:dead,title:beef}'
      )
    )
      .to.emit(clrFundMACIFactoryDeployer, 'Register')
      .withArgs(factory.address, '{name:dead,title:beef}')
  })

  it('cannot register with the subgraph twice', async () => {
    await expect(
      clrFundMACIFactoryDeployer.registerInstance(
        factory.address,
        '{name:dead,title:beef}'
      )
    )
      .to.emit(clrFundMACIFactoryDeployer, 'Register')
      .withArgs(factory.address, '{name:dead,title:beef}')
    await expect(
      clrFundMACIFactoryDeployer.registerInstance(
        factory.address,
        '{name:dead,title:beef}'
      )
    ).to.be.revertedWith('ClrFundMACIFactory: metadata already registered')
  })

  it('sets default MACI parameters', async () => {
    const { maxUsers, maxMessages, maxVoteOptions } = await factory.maxValues()
    expect(maxUsers).to.equal(4294967295)
    expect(maxMessages).to.equal(4294967295)
    expect(maxVoteOptions).to.equal(124)
    expect(await factory.signUpDuration()).to.equal(604800)
    expect(await factory.votingDuration()).to.equal(604800)
  })

  it('sets MACI parameters', async () => {
    maciParameters.update({
      stateTreeDepth: 32,
      messageTreeDepth: 32,
      voteOptionTreeDepth: 3,
      signUpDuration: 86400,
      votingDuration: 86400,
    })
    await expect(factory.setMaciParameters(...maciParameters.values())).to.emit(
      factory,
      'MaciParametersChanged'
    )

    const { maxUsers, maxMessages, maxVoteOptions } = await factory.maxValues()
    expect(maxUsers).to.equal(2 ** maciParameters.stateTreeDepth - 1)
    expect(maxMessages).to.equal(2 ** maciParameters.messageTreeDepth - 1)
    expect(maxVoteOptions).to.equal(5 ** maciParameters.voteOptionTreeDepth - 1)
    expect(await factory.signUpDuration()).to.equal(
      maciParameters.signUpDuration
    )
    expect(await factory.votingDuration()).to.equal(
      maciParameters.votingDuration
    )
  })

  it('does not allow to decrease the vote option tree depth', async () => {
    maciParameters.voteOptionTreeDepth = 1
    await expect(
      factory.setMaciParameters(...maciParameters.values())
    ).to.be.revertedWith(
      'MACIFactory: Vote option tree depth can not be decreased'
    )
  })

  it('allows only owner to set MACI parameters', async () => {
    const coordinatorMaciFactory = factory.connect(coordinator)
    await expect(
      coordinatorMaciFactory.setMaciParameters(...maciParameters.values())
    ).to.be.revertedWith('Ownable: caller is not the owner')
  })

  it('deploys MACI', async () => {
    const maciDeployed = factory.deployMaci(
      signUpGatekeeper.address,
      initialVoiceCreditProxy.address,
      coordinator.address,
      coordinatorPubKey
    )
    await expect(maciDeployed).to.emit(factory, 'MaciDeployed')

    const deployTx = await maciDeployed
    expect(await getGasUsage(deployTx)).lessThan(9020000)
  })

  it('allows only owner to deploy MACI', async () => {
    const coordinatorMaciFactory = factory.connect(coordinator)
    await expect(
      coordinatorMaciFactory.deployMaci(
        signUpGatekeeper.address,
        initialVoiceCreditProxy.address,
        coordinator.address,
        coordinatorPubKey
      )
    ).to.be.revertedWith('Ownable: caller is not the owner')
  })
})
