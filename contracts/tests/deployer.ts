import { ethers, waffle } from 'hardhat'
import { use, expect } from 'chai'
import { solidity } from 'ethereum-waffle'
import { Contract } from 'ethers'
import { genRandomSalt } from 'maci-crypto'
import { Keypair } from '@clrfund/common'

import { ZERO_ADDRESS, UNIT } from '../utils/constants'
import { getGasUsage, getEventArg } from '../utils/contracts'
import { deployContract, deployMaciFactory } from '../utils/deployment'
import { MaciParameters } from '../utils/maci'

use(solidity)

describe('Clr fund deployer', () => {
  const provider = waffle.provider
  const [, deployer, coordinator, contributor] = provider.getWallets()

  let maciFactory: Contract
  let userRegistry: Contract
  let recipientRegistry: Contract
  let factoryTemplate: Contract
  let factory: Contract
  let clrFundDeployer: Contract
  let token: Contract
  let maciParameters: MaciParameters
  const coordinatorPubKey = new Keypair().pubKey.asContractParam()

  beforeEach(async () => {
    maciFactory = await deployMaciFactory(deployer)
    maciParameters = await MaciParameters.read(maciFactory)

    factoryTemplate = await deployContract(deployer, 'ClrFund')

    expect(factoryTemplate.address).to.properAddress
    expect(await getGasUsage(factoryTemplate.deployTransaction)).lessThan(
      5400000
    )

    clrFundDeployer = await deployContract(deployer, 'ClrFundDeployer', [
      factoryTemplate.address,
    ])

    expect(clrFundDeployer.address).to.properAddress
    expect(await getGasUsage(clrFundDeployer.deployTransaction)).lessThan(
      5400000
    )

    const newInstanceTx = await clrFundDeployer.deployFund(maciFactory.address)
    const instanceAddress = await getEventArg(
      newInstanceTx,
      clrFundDeployer,
      'NewInstance',
      'clrfund'
    )

    factory = await ethers.getContractAt('ClrFund', instanceAddress, deployer)

    await maciFactory.transferOwnership(instanceAddress)

    const SimpleUserRegistry = await ethers.getContractFactory(
      'SimpleUserRegistry',
      deployer
    )
    userRegistry = await SimpleUserRegistry.deploy()
    const SimpleRecipientRegistry = await ethers.getContractFactory(
      'SimpleRecipientRegistry',
      deployer
    )
    recipientRegistry = await SimpleRecipientRegistry.deploy(factory.address)

    // Deploy token contract and transfer tokens to contributor

    const tokenInitialSupply = UNIT.mul(1000)
    const Token = await ethers.getContractFactory('AnyOldERC20Token', deployer)
    token = await Token.deploy(tokenInitialSupply)
    expect(token.address).to.properAddress
    await token.transfer(contributor.address, tokenInitialSupply)
  })

  it('can only be initialized once', async () => {
    await expect(factory.init(maciFactory.address)).to.be.revertedWith(
      'Initializable: contract is already initialized'
    )
  })

  it('can register with the subgraph', async () => {
    await expect(
      clrFundDeployer.registerInstance(
        factory.address,
        '{name:dead,title:beef}'
      )
    )
      .to.emit(clrFundDeployer, 'Register')
      .withArgs(factory.address, '{name:dead,title:beef}')
  })

  it('cannot register with the subgraph twice', async () => {
    await expect(
      clrFundDeployer.registerInstance(
        factory.address,
        '{name:dead,title:beef}'
      )
    )
      .to.emit(clrFundDeployer, 'Register')
      .withArgs(factory.address, '{name:dead,title:beef}')
    await expect(
      clrFundDeployer.registerInstance(
        factory.address,
        '{name:dead,title:beef}'
      )
    ).to.be.revertedWith('ClrFund: metadata already registered')
  })

  it('initializes factory', async () => {
    expect(await factory.coordinator()).to.equal(ZERO_ADDRESS)
    expect(await factory.nativeToken()).to.equal(ZERO_ADDRESS)
    expect(await factory.maciFactory()).to.equal(maciFactory.address)
    expect(await factory.userRegistry()).to.equal(ZERO_ADDRESS)
    expect(await factory.recipientRegistry()).to.equal(ZERO_ADDRESS)
  })

  it('transfers ownership to another address', async () => {
    await expect(factory.transferOwnership(coordinator.address))
      .to.emit(factory, 'OwnershipTransferred')
      .withArgs(deployer.address, coordinator.address)
  })

  describe('changing user registry', () => {
    it('allows owner to set user registry', async () => {
      await factory.setUserRegistry(userRegistry.address)
      expect(await factory.userRegistry()).to.equal(userRegistry.address)
    })

    it('allows only owner to set user registry', async () => {
      await expect(
        factory.connect(contributor).setUserRegistry(userRegistry.address)
      ).to.be.revertedWith('Ownable: caller is not the owner')
    })

    it('allows owner to change recipient registry', async () => {
      await factory.setRecipientRegistry(recipientRegistry.address)
      const SimpleUserRegistry = await ethers.getContractFactory(
        'SimpleUserRegistry',
        deployer
      )
      const anotherUserRegistry = await SimpleUserRegistry.deploy()
      await factory.setUserRegistry(anotherUserRegistry.address)
      expect(await factory.userRegistry()).to.equal(anotherUserRegistry.address)
    })
  })

  describe('changing recipient registry', () => {
    it('allows owner to set recipient registry', async () => {
      await factory.setRecipientRegistry(recipientRegistry.address)
      expect(await factory.recipientRegistry()).to.equal(
        recipientRegistry.address
      )
      expect(await recipientRegistry.controller()).to.equal(factory.address)
      expect(await recipientRegistry.maxRecipients()).to.equal(
        5 ** maciParameters.voteOptionTreeDepth - 1
      )
    })

    it('allows only owner to set recipient registry', async () => {
      await expect(
        factory
          .connect(contributor)
          .setRecipientRegistry(recipientRegistry.address)
      ).to.be.revertedWith('Ownable: caller is not the owner')
    })

    it('allows owner to change recipient registry', async () => {
      await factory.setRecipientRegistry(recipientRegistry.address)
      const SimpleRecipientRegistry = await ethers.getContractFactory(
        'SimpleRecipientRegistry',
        deployer
      )
      const anotherRecipientRegistry = await SimpleRecipientRegistry.deploy(
        factory.address
      )
      await factory.setRecipientRegistry(anotherRecipientRegistry.address)
      expect(await factory.recipientRegistry()).to.equal(
        anotherRecipientRegistry.address
      )
    })
  })

  describe('managing funding sources', () => {
    it('allows owner to add funding source', async () => {
      await expect(factory.addFundingSource(contributor.address))
        .to.emit(factory, 'FundingSourceAdded')
        .withArgs(contributor.address)
    })

    it('allows only owner to add funding source', async () => {
      await expect(
        factory.connect(contributor).addFundingSource(contributor.address)
      ).to.be.revertedWith('Ownable: caller is not the owner')
    })

    it('reverts if funding source is already added', async () => {
      await factory.addFundingSource(contributor.address)
      await expect(
        factory.addFundingSource(contributor.address)
      ).to.be.revertedWith('Factory: Funding source already added')
    })

    it('allows owner to remove funding source', async () => {
      await factory.addFundingSource(contributor.address)
      await expect(factory.removeFundingSource(contributor.address))
        .to.emit(factory, 'FundingSourceRemoved')
        .withArgs(contributor.address)
    })

    it('allows only owner to remove funding source', async () => {
      await factory.addFundingSource(contributor.address)
      await expect(
        factory.connect(contributor).removeFundingSource(contributor.address)
      ).to.be.revertedWith('Ownable: caller is not the owner')
    })

    it('reverts if funding source is already removed', async () => {
      await factory.addFundingSource(contributor.address)
      await factory.removeFundingSource(contributor.address)
      await expect(
        factory.removeFundingSource(contributor.address)
      ).to.be.revertedWith('Factory: Funding source not found')
    })
  })

  it('allows direct contributions to the matching pool', async () => {
    const contributionAmount = UNIT.mul(10)
    await factory.setToken(token.address)
    await expect(
      token.connect(contributor).transfer(factory.address, contributionAmount)
    )
      .to.emit(token, 'Transfer')
      .withArgs(contributor.address, factory.address, contributionAmount)
    expect(await token.balanceOf(factory.address)).to.equal(contributionAmount)
  })

  it('sets MACI parameters', async () => {
    maciParameters.update({ voteOptionTreeDepth: 3 })
    await expect(factory.setMaciParameters(...maciParameters.values())).to.emit(
      maciFactory,
      'MaciParametersChanged'
    )
    const treeDepths = await maciFactory.treeDepths()
    expect(treeDepths.voteOptionTreeDepth).to.equal(3)
  })

  it('allows only owner to set MACI parameters', async () => {
    const coordinatorFactory = factory.connect(coordinator)
    await expect(
      coordinatorFactory.setMaciParameters(...maciParameters.values())
    ).to.be.revertedWith('Ownable: caller is not the owner')
  })

  describe('deploying funding round', () => {
    it('deploys funding round', async () => {
      await factory.setUserRegistry(userRegistry.address)
      await factory.setRecipientRegistry(recipientRegistry.address)
      await factory.setToken(token.address)
      await factory.setCoordinator(coordinator.address, coordinatorPubKey)
      const deployed = factory.deployNewRound()
      await expect(deployed).to.emit(factory, 'RoundStarted')
      const deployTx = await deployed
      expect(await getGasUsage(deployTx)).lessThan(13000000)

      const fundingRoundAddress = await factory.getCurrentRound()
      expect(fundingRoundAddress).to.properAddress
      expect(fundingRoundAddress).to.not.equal(ZERO_ADDRESS)

      const fundingRound = await ethers.getContractAt(
        'FundingRound',
        fundingRoundAddress
      )
      expect(await fundingRound.owner()).to.equal(factory.address)
      expect(await fundingRound.nativeToken()).to.equal(token.address)

      const maciAddress = await getEventArg(
        deployTx,
        maciFactory,
        'MaciDeployed',
        '_maci'
      )
      expect(await fundingRound.maci()).to.equal(maciAddress)
      const maci = await ethers.getContractAt('MACI', maciAddress)
      const roundCoordinatorPubKey = await maci.coordinatorPubKey()
      expect(roundCoordinatorPubKey.x).to.equal(coordinatorPubKey.x)
      expect(roundCoordinatorPubKey.y).to.equal(coordinatorPubKey.y)
    })

    it('reverts if user registry is not set', async () => {
      await factory.setRecipientRegistry(recipientRegistry.address)
      await factory.setToken(token.address)
      await factory.setCoordinator(coordinator.address, coordinatorPubKey)
      await expect(factory.deployNewRound()).to.be.revertedWith(
        'Factory: User registry is not set'
      )
    })

    it('reverts if recipient registry is not set', async () => {
      await factory.setUserRegistry(userRegistry.address)
      await factory.setToken(token.address)
      await factory.setCoordinator(coordinator.address, coordinatorPubKey)
      await expect(factory.deployNewRound()).to.be.revertedWith(
        'Factory: Recipient registry is not set'
      )
    })

    it('reverts if native token is not set', async () => {
      await factory.setUserRegistry(userRegistry.address)
      await factory.setRecipientRegistry(recipientRegistry.address)
      await factory.setCoordinator(coordinator.address, coordinatorPubKey)
      await expect(factory.deployNewRound()).to.be.revertedWith(
        'Factory: Native token is not set'
      )
    })

    it('reverts if coordinator is not set', async () => {
      await factory.setUserRegistry(userRegistry.address)
      await factory.setRecipientRegistry(recipientRegistry.address)
      await factory.setToken(token.address)
      await expect(factory.deployNewRound()).to.be.revertedWith(
        'Factory: No coordinator'
      )
    })

    it('reverts if current round is not finalized', async () => {
      await factory.setUserRegistry(userRegistry.address)
      await factory.setRecipientRegistry(recipientRegistry.address)
      await factory.setToken(token.address)
      await factory.setCoordinator(coordinator.address, coordinatorPubKey)
      await factory.deployNewRound()
      await expect(factory.deployNewRound()).to.be.revertedWith(
        'Factory: Current round is not finalized'
      )
    })

    it('deploys new funding round after previous round has been finalized', async () => {
      await factory.setUserRegistry(userRegistry.address)
      await factory.setRecipientRegistry(recipientRegistry.address)
      await factory.setToken(token.address)
      await factory.setCoordinator(coordinator.address, coordinatorPubKey)
      await factory.deployNewRound()
      await factory.cancelCurrentRound()
      await expect(factory.deployNewRound()).to.emit(factory, 'RoundStarted')
    })

    it('only owner can deploy funding round', async () => {
      await factory.setUserRegistry(userRegistry.address)
      await factory.setRecipientRegistry(recipientRegistry.address)
      await factory.setToken(token.address)
      await factory.setCoordinator(coordinator.address, coordinatorPubKey)
      const factoryAsContributor = factory.connect(contributor)
      await expect(factoryAsContributor.deployNewRound()).to.be.revertedWith(
        'Ownable: caller is not the owner'
      )
    })
  })

  describe('transferring matching funds', () => {
    const contributionAmount = UNIT.mul(10)
    const totalSpent = UNIT.mul(100)
    const totalSpentSalt = genRandomSalt().toString()
    let roundDuration: number

    beforeEach(async () => {
      await factory.setUserRegistry(userRegistry.address)
      await factory.setRecipientRegistry(recipientRegistry.address)
      await factory.setToken(token.address)
      await factory.setCoordinator(coordinator.address, coordinatorPubKey)
      roundDuration =
        maciParameters.signUpDuration + maciParameters.votingDuration + 10
    })

    it('returns the amount of available matching funding', async () => {
      await factory.addFundingSource(deployer.address)
      await factory.addFundingSource(contributor.address)
      // Allowance is more than available balance
      await token.connect(deployer).approve(factory.address, contributionAmount)
      // Allowance is less than available balance
      await token
        .connect(contributor)
        .approve(factory.address, contributionAmount)
      // Direct contribution
      await token
        .connect(contributor)
        .transfer(factory.address, contributionAmount)
      await factory.deployNewRound()
      expect(await factory.getMatchingFunds(token.address)).to.equal(
        contributionAmount.mul(2)
      )
    })

    it('allows owner to finalize round', async () => {
      await token
        .connect(contributor)
        .transfer(factory.address, contributionAmount)
      await factory.deployNewRound()
      await provider.send('evm_increaseTime', [roundDuration])
      await expect(
        factory.transferMatchingFunds(totalSpent, totalSpentSalt)
      ).to.be.revertedWith('FundingRound: Votes has not been tallied')
    })

    it('allows owner to finalize round even without matching funds', async () => {
      await factory.deployNewRound()
      await provider.send('evm_increaseTime', [roundDuration])
      await expect(
        factory.transferMatchingFunds(totalSpent, totalSpentSalt)
      ).to.be.revertedWith('FundingRound: Votes has not been tallied')
    })

    it('pulls funds from funding source', async () => {
      await factory.addFundingSource(contributor.address)
      token.connect(contributor).approve(factory.address, contributionAmount)
      await factory.addFundingSource(deployer.address) // Doesn't have tokens
      await factory.deployNewRound()
      await provider.send('evm_increaseTime', [roundDuration])
      await expect(
        factory.transferMatchingFunds(totalSpent, totalSpentSalt)
      ).to.be.revertedWith('FundingRound: Votes has not been tallied')
    })

    it('pulls funds from funding source if allowance is greater than balance', async () => {
      await factory.addFundingSource(contributor.address)
      token
        .connect(contributor)
        .approve(factory.address, contributionAmount.mul(2))
      await factory.deployNewRound()
      await provider.send('evm_increaseTime', [roundDuration])
      await expect(
        factory.transferMatchingFunds(totalSpent, totalSpentSalt)
      ).to.be.revertedWith('FundingRound: Votes has not been tallied')
    })

    it('allows only owner to finalize round', async () => {
      await factory.deployNewRound()
      await provider.send('evm_increaseTime', [roundDuration])
      await expect(
        factory
          .connect(contributor)
          .transferMatchingFunds(totalSpent, totalSpentSalt)
      ).to.be.revertedWith('Ownable: caller is not the owner')
    })

    it('reverts if round has not been deployed', async () => {
      await expect(
        factory.transferMatchingFunds(totalSpent, totalSpentSalt)
      ).to.be.revertedWith('Factory: Funding round has not been deployed')
    })
  })

  describe('cancelling round', () => {
    beforeEach(async () => {
      await factory.setUserRegistry(userRegistry.address)
      await factory.setRecipientRegistry(recipientRegistry.address)
      await factory.setToken(token.address)
      await factory.setCoordinator(coordinator.address, coordinatorPubKey)
    })

    it('allows owner to cancel round', async () => {
      await factory.deployNewRound()
      const fundingRoundAddress = await factory.getCurrentRound()
      const fundingRound = await ethers.getContractAt(
        'FundingRound',
        fundingRoundAddress
      )
      await expect(factory.cancelCurrentRound())
        .to.emit(factory, 'RoundFinalized')
        .withArgs(fundingRoundAddress)
      expect(await fundingRound.isCancelled()).to.equal(true)
    })

    it('allows only owner to cancel round', async () => {
      await factory.deployNewRound()
      await expect(
        factory.connect(contributor).cancelCurrentRound()
      ).to.be.revertedWith('Ownable: caller is not the owner')
    })

    it('reverts if round has not been deployed', async () => {
      await expect(factory.cancelCurrentRound()).to.be.revertedWith(
        'Factory: Funding round has not been deployed'
      )
    })

    it('reverts if round is finalized', async () => {
      await factory.deployNewRound()
      await factory.cancelCurrentRound()
      await expect(factory.cancelCurrentRound()).to.be.revertedWith(
        'Factory: Current round is finalized'
      )
    })
  })

  it('allows owner to set native token', async () => {
    await expect(factory.setToken(token.address))
      .to.emit(factory, 'TokenChanged')
      .withArgs(token.address)
    expect(await factory.nativeToken()).to.equal(token.address)
  })

  it('only owner can set native token', async () => {
    const factoryAsContributor = factory.connect(contributor)
    await expect(
      factoryAsContributor.setToken(token.address)
    ).to.be.revertedWith('Ownable: caller is not the owner')
  })

  it('allows owner to change coordinator', async () => {
    await expect(factory.setCoordinator(coordinator.address, coordinatorPubKey))
      .to.emit(factory, 'CoordinatorChanged')
      .withArgs(coordinator.address)
    expect(await factory.coordinator()).to.eq(coordinator.address)
  })

  it('allows only the owner to set a new coordinator', async () => {
    const factoryAsContributor = factory.connect(contributor)
    await expect(
      factoryAsContributor.setCoordinator(
        coordinator.address,
        coordinatorPubKey
      )
    ).to.be.revertedWith('Ownable: caller is not the owner')
  })

  it('allows coordinator to call coordinatorQuit and sets coordinator to null', async () => {
    await factory.setCoordinator(coordinator.address, coordinatorPubKey)
    const factoryAsCoordinator = factory.connect(coordinator)
    await expect(factoryAsCoordinator.coordinatorQuit())
      .to.emit(factory, 'CoordinatorChanged')
      .withArgs(ZERO_ADDRESS)
    expect(await factory.coordinator()).to.equal(ZERO_ADDRESS)
  })

  it('only coordinator can call coordinatorQuit', async () => {
    await factory.setCoordinator(coordinator.address, coordinatorPubKey)
    await expect(factory.coordinatorQuit()).to.be.revertedWith(
      'Factory: Sender is not the coordinator'
    )
  })

  it('should cancel current round when coordinator quits', async () => {
    await factory.setUserRegistry(userRegistry.address)
    await factory.setRecipientRegistry(recipientRegistry.address)
    await factory.setToken(token.address)
    await factory.setCoordinator(coordinator.address, coordinatorPubKey)
    await factory.deployNewRound()
    const fundingRoundAddress = await factory.getCurrentRound()
    const fundingRound = await ethers.getContractAt(
      'FundingRound',
      fundingRoundAddress
    )

    const factoryAsCoordinator = factory.connect(coordinator)
    await expect(factoryAsCoordinator.coordinatorQuit())
      .to.emit(factory, 'RoundFinalized')
      .withArgs(fundingRoundAddress)
    expect(await fundingRound.isCancelled()).to.equal(true)
  })
})
