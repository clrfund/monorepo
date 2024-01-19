import { ethers, config, artifacts } from 'hardhat'
import { time } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { Contract } from 'ethers'
import { genRandomSalt } from 'maci-crypto'
import { Keypair } from '@clrfund/common'

import { ZERO_ADDRESS, UNIT } from '../utils/constants'
import { getGasUsage, getEventArg } from '../utils/contracts'
import {
  deployContract,
  deployPoseidonLibraries,
  deployMaciFactory,
} from '../utils/deployment'
import { MaciParameters } from '../utils/maciParameters'
import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers'

const roundDuration = 10000

describe('Clr fund deployer', async () => {
  let deployer: HardhatEthersSigner
  let coordinator: HardhatEthersSigner
  let contributor: HardhatEthersSigner
  let maciFactory: Contract
  let userRegistry: Contract
  let recipientRegistry: Contract
  let factoryTemplate: Contract
  let clrfund: Contract
  let clrFundDeployer: Contract
  let token: Contract
  const coordinatorPubKey = new Keypair().pubKey.asContractParam()
  let poseidonContracts: { [name: string]: string }
  let roundInterface: Contract

  before(async () => {
    ;[, deployer, coordinator, contributor] = await ethers.getSigners()

    // this is just a dummy funding round contract to be passed as the
    // contract argument to the revertedByCustomError() as a way to
    // pass the Abi.
    const FundingRoundArtifacts = await artifacts.readArtifact('FundingRound')
    roundInterface = new Contract(ZERO_ADDRESS, FundingRoundArtifacts.abi)
  })

  beforeEach(async () => {
    if (!poseidonContracts) {
      poseidonContracts = await deployPoseidonLibraries({
        artifactsPath: config.paths.artifacts,
        ethers,
      })
    }

    const params = MaciParameters.mock()
    maciFactory = await deployMaciFactory({
      libraries: poseidonContracts,
      signer: deployer,
      ethers,
      maciParameters: params,
    })

    factoryTemplate = await deployContract({
      name: 'ClrFund',
      ethers,
      signer: deployer,
    })

    expect(await factoryTemplate.getAddress()).to.be.properAddress
    const tx = factoryTemplate.deploymentTransaction()
    if (tx) {
      expect(await getGasUsage(tx)).lessThan(5400000)
    } else {
      expect(tx).to.not.be.null
    }

    const roundFactory = await deployContract({
      name: 'FundingRoundFactory',
      ethers,
    })
    const roundFactoryTx = roundFactory.deploymentTransaction()
    if (roundFactoryTx) {
      expect(await getGasUsage(roundFactoryTx)).lessThan(4600000)
    } else {
      expect(roundFactoryTx).to.not.be.null
    }

    clrFundDeployer = await deployContract({
      name: 'ClrFundDeployer',
      contractArgs: [
        factoryTemplate.target,
        maciFactory.target,
        roundFactory.target,
      ],
      ethers,
      signer: deployer,
    })

    expect(clrFundDeployer.target).to.be.properAddress
    const deployerTx = clrFundDeployer.deploymentTransaction()
    if (deployerTx) {
      expect(await getGasUsage(deployerTx)).lessThan(5400000)
    } else {
      expect(deployerTx).to.not.be.null
    }

    const newInstanceTx = await clrFundDeployer.deployClrFund()
    const instanceAddress = await getEventArg(
      newInstanceTx,
      clrFundDeployer,
      'NewInstance',
      'clrfund'
    )

    clrfund = await ethers.getContractAt('ClrFund', instanceAddress, deployer)

    const SimpleUserRegistry = await ethers.getContractFactory(
      'SimpleUserRegistry',
      deployer
    )
    userRegistry = await SimpleUserRegistry.deploy()
    const SimpleRecipientRegistry = await ethers.getContractFactory(
      'SimpleRecipientRegistry',
      deployer
    )
    recipientRegistry = await SimpleRecipientRegistry.deploy(clrfund.target)

    // Deploy token contract and transfer tokens to contributor

    const tokenInitialSupply = UNIT * 1000n
    const Token = await ethers.getContractFactory('AnyOldERC20Token', deployer)
    token = await Token.deploy(tokenInitialSupply)
    expect(token.target).to.properAddress
    await token.transfer(contributor.address, tokenInitialSupply)
  })

  it('can only be initialized once', async () => {
    const dummyRoundFactory = ZERO_ADDRESS
    await expect(
      clrfund.init(maciFactory.target, dummyRoundFactory)
    ).to.be.revertedWith('Initializable: contract is already initialized')
  })

  it('initializes clrfund', async () => {
    expect(await clrfund.coordinator()).to.equal(ZERO_ADDRESS)
    expect(await clrfund.nativeToken()).to.equal(ZERO_ADDRESS)
    expect(await clrfund.maciFactory()).to.equal(maciFactory.target)
    expect(await clrfund.userRegistry()).to.equal(ZERO_ADDRESS)
    expect(await clrfund.recipientRegistry()).to.equal(ZERO_ADDRESS)
  })

  it('transfers ownership to another address', async () => {
    await expect(clrfund.transferOwnership(coordinator.address))
      .to.emit(clrfund, 'OwnershipTransferred')
      .withArgs(deployer.address, coordinator.address)
  })

  describe('changing user registry', () => {
    it('allows owner to set user registry', async () => {
      await clrfund.setUserRegistry(userRegistry.target)
      expect(await clrfund.userRegistry()).to.equal(userRegistry.target)
    })

    it('allows only owner to set user registry', async () => {
      await expect(
        (clrfund.connect(contributor) as Contract).setUserRegistry(
          userRegistry.target
        )
      ).to.be.revertedWith('Ownable: caller is not the owner')
    })

    it('allows owner to change recipient registry', async () => {
      await clrfund.setRecipientRegistry(recipientRegistry.target)
      const SimpleUserRegistry = await ethers.getContractFactory(
        'SimpleUserRegistry',
        deployer
      )
      const anotherUserRegistry = await SimpleUserRegistry.deploy()
      await clrfund.setUserRegistry(anotherUserRegistry.target)
      expect(await clrfund.userRegistry()).to.equal(anotherUserRegistry.target)
    })
  })

  describe('changing recipient registry', () => {
    it('allows owner to set recipient registry', async () => {
      await clrfund.setCoordinator(coordinator.address, coordinatorPubKey)
      await clrfund.setRecipientRegistry(recipientRegistry.target)
      expect(await clrfund.recipientRegistry()).to.equal(
        recipientRegistry.target
      )
      expect(await recipientRegistry.controller()).to.equal(clrfund.target)
      const params = MaciParameters.mock()
      expect(await recipientRegistry.maxRecipients()).to.equal(
        BigInt(5) ** BigInt(params.treeDepths.voteOptionTreeDepth)
      )
    })

    it('allows only owner to set recipient registry', async () => {
      await expect(
        (clrfund.connect(contributor) as Contract).setRecipientRegistry(
          recipientRegistry.target
        )
      ).to.be.revertedWith('Ownable: caller is not the owner')
    })

    it('allows owner to change recipient registry', async () => {
      await clrfund.setRecipientRegistry(recipientRegistry.target)
      const SimpleRecipientRegistry = await ethers.getContractFactory(
        'SimpleRecipientRegistry',
        deployer
      )
      const anotherRecipientRegistry = await SimpleRecipientRegistry.deploy(
        clrfund.target
      )
      await clrfund.setRecipientRegistry(anotherRecipientRegistry.target)
      expect(await clrfund.recipientRegistry()).to.equal(
        anotherRecipientRegistry.target
      )
    })
  })

  describe('managing funding sources', () => {
    it('allows owner to add funding source', async () => {
      await expect(clrfund.addFundingSource(contributor.address))
        .to.emit(clrfund, 'FundingSourceAdded')
        .withArgs(contributor.address)
    })

    it('allows only owner to add funding source', async () => {
      await expect(
        (clrfund.connect(contributor) as Contract).addFundingSource(
          contributor.address
        )
      ).to.be.revertedWith('Ownable: caller is not the owner')
    })

    it('reverts if funding source is already added', async () => {
      await clrfund.addFundingSource(contributor.address)
      await expect(
        clrfund.addFundingSource(contributor.address)
      ).to.be.revertedWithCustomError(clrfund, 'FundingSourceAlreadyAdded')
    })

    it('allows owner to remove funding source', async () => {
      await clrfund.addFundingSource(contributor.address)
      await expect(clrfund.removeFundingSource(contributor.address))
        .to.emit(clrfund, 'FundingSourceRemoved')
        .withArgs(contributor.address)
    })

    it('allows only owner to remove funding source', async () => {
      await clrfund.addFundingSource(contributor.address)
      await expect(
        (clrfund.connect(contributor) as Contract).removeFundingSource(
          contributor.address
        )
      ).to.be.revertedWith('Ownable: caller is not the owner')
    })

    it('reverts if funding source is already removed', async () => {
      await clrfund.addFundingSource(contributor.address)
      await clrfund.removeFundingSource(contributor.address)
      await expect(
        clrfund.removeFundingSource(contributor.address)
      ).to.be.revertedWithCustomError(clrfund, 'FundingSourceNotFound')
    })
  })

  it('allows direct contributions to the matching pool', async () => {
    const contributionAmount = UNIT * 10n
    await clrfund.setToken(token.target)
    await expect(
      (token.connect(contributor) as Contract).transfer(
        clrfund.target,
        contributionAmount
      )
    )
      .to.emit(token, 'Transfer')
      .withArgs(contributor.address, clrfund.target, contributionAmount)
    expect(await token.balanceOf(clrfund.target)).to.equal(contributionAmount)
  })

  describe('deploying funding round', () => {
    it('deploys funding round', async () => {
      await clrfund.setUserRegistry(userRegistry.target)
      await clrfund.setRecipientRegistry(recipientRegistry.target)
      await clrfund.setToken(token.target)
      await clrfund.setCoordinator(coordinator.address, coordinatorPubKey)
      const deployed = clrfund.deployNewRound(roundDuration)
      await expect(deployed).to.emit(clrfund, 'RoundStarted')
      const deployTx = await deployed
      // TODO: fix gas usage for deployNewRound()
      expect(await getGasUsage(deployTx)).lessThan(20000000)

      const fundingRoundAddress = await clrfund.getCurrentRound()
      expect(fundingRoundAddress).to.properAddress
      expect(fundingRoundAddress).to.not.equal(ZERO_ADDRESS)

      const fundingRound = await ethers.getContractAt(
        'FundingRound',
        fundingRoundAddress
      )
      expect(await fundingRound.owner()).to.equal(clrfund.target)
      expect(await fundingRound.nativeToken()).to.equal(token.target)

      const maciAddress = await getEventArg(
        deployTx,
        maciFactory,
        'MaciDeployed',
        '_maci'
      )

      expect(await fundingRound.maci()).to.equal(maciAddress)
      const maci = await ethers.getContractAt('MACI', maciAddress)
      const pollAddress = await getEventArg(
        deployTx,
        maci,
        'DeployPoll',
        'pollAddr'
      )

      const poll = await ethers.getContractAt('Poll', pollAddress.poll)
      const roundCoordinatorPubKey = await poll.coordinatorPubKey()
      expect(roundCoordinatorPubKey.x).to.equal(coordinatorPubKey.x)
      expect(roundCoordinatorPubKey.y).to.equal(coordinatorPubKey.y)
    })

    it('reverts if user registry is not set', async () => {
      await clrfund.setRecipientRegistry(recipientRegistry.target)
      await clrfund.setToken(token.target)
      await clrfund.setCoordinator(coordinator.address, coordinatorPubKey)

      await expect(
        clrfund.deployNewRound(roundDuration)
      ).to.be.revertedWithCustomError(roundInterface, 'InvalidUserRegistry')
    })

    // TODO investigate why this fails
    it('reverts if recipient registry is not set', async () => {
      await clrfund.setUserRegistry(userRegistry.target)
      await clrfund.setToken(token.target)
      await clrfund.setCoordinator(coordinator.address, coordinatorPubKey)

      await expect(
        clrfund.deployNewRound(roundDuration)
      ).to.be.revertedWithCustomError(clrfund, 'RecipientRegistryNotSet')
    })

    it('reverts if native token is not set', async () => {
      await clrfund.setUserRegistry(userRegistry.target)
      await clrfund.setRecipientRegistry(recipientRegistry.target)
      await clrfund.setCoordinator(coordinator.address, coordinatorPubKey)

      await expect(
        clrfund.deployNewRound(roundDuration)
      ).to.be.revertedWithCustomError(roundInterface, 'InvalidNativeToken')
    })

    it('reverts if coordinator is not set', async () => {
      await clrfund.setUserRegistry(userRegistry.target)
      await clrfund.setRecipientRegistry(recipientRegistry.target)
      await clrfund.setToken(token.target)
      await expect(
        clrfund.deployNewRound(roundDuration)
      ).to.be.revertedWithCustomError(roundInterface, 'InvalidCoordinator')
    })

    it('reverts if current round is not finalized', async () => {
      await clrfund.setUserRegistry(userRegistry.target)
      await clrfund.setRecipientRegistry(recipientRegistry.target)
      await clrfund.setToken(token.target)
      await clrfund.setCoordinator(coordinator.address, coordinatorPubKey)

      await clrfund.deployNewRound(roundDuration)
      await expect(
        clrfund.deployNewRound(roundDuration)
      ).to.be.revertedWithCustomError(clrfund, 'NotFinalized')
    })

    it('deploys new funding round after previous round has been finalized', async () => {
      await clrfund.setUserRegistry(userRegistry.target)
      await clrfund.setRecipientRegistry(recipientRegistry.target)
      await clrfund.setToken(token.target)
      await clrfund.setCoordinator(coordinator.address, coordinatorPubKey)

      await clrfund.deployNewRound(roundDuration)
      await clrfund.cancelCurrentRound()
      await expect(clrfund.deployNewRound(roundDuration)).to.emit(
        clrfund,
        'RoundStarted'
      )
    })

    it('only owner can deploy funding round', async () => {
      await clrfund.setUserRegistry(userRegistry.target)
      await clrfund.setRecipientRegistry(recipientRegistry.target)
      await clrfund.setToken(token.target)
      await clrfund.setCoordinator(coordinator.address, coordinatorPubKey)

      const clrfundAsContributor = clrfund.connect(contributor) as Contract
      await expect(
        clrfundAsContributor.deployNewRound(roundDuration)
      ).to.be.revertedWith('Ownable: caller is not the owner')
    })
  })

  describe('transferring matching funds', () => {
    const contributionAmount = UNIT * 10n
    const totalSpent = UNIT * 100n
    const totalSpentSalt = genRandomSalt().toString()
    const resultsCommitment = genRandomSalt().toString()
    const perVOVoiceCreditCommitment = genRandomSalt().toString()

    beforeEach(async () => {
      await clrfund.setUserRegistry(userRegistry.target)
      await clrfund.setRecipientRegistry(recipientRegistry.target)
      await clrfund.setToken(token.target)
      await clrfund.setCoordinator(coordinator.address, coordinatorPubKey)
    })

    it('returns the amount of available matching funding', async () => {
      await clrfund.addFundingSource(deployer.address)
      await clrfund.addFundingSource(contributor.address)
      // Allowance is more than available balance
      await (token.connect(deployer) as Contract).approve(
        clrfund.target,
        contributionAmount
      )
      // Allowance is less than available balance
      const tokenAsContributor = token.connect(contributor) as Contract
      await tokenAsContributor.approve(clrfund.target, contributionAmount)
      // Direct contribution
      await tokenAsContributor.transfer(clrfund.target, contributionAmount)

      await clrfund.deployNewRound(roundDuration)
      expect(await clrfund.getMatchingFunds(token.target)).to.equal(
        contributionAmount * 2n
      )
    })

    it('allows owner to finalize round', async () => {
      await (token.connect(contributor) as Contract).transfer(
        clrfund.target,
        contributionAmount
      )
      await clrfund.deployNewRound(roundDuration)
      await time.increase(roundDuration)
      await expect(
        clrfund.transferMatchingFunds(
          totalSpent,
          totalSpentSalt,
          resultsCommitment,
          perVOVoiceCreditCommitment
        )
      ).to.be.revertedWithCustomError(roundInterface, 'VotesNotTallied')
    })

    it('allows owner to finalize round even without matching funds', async () => {
      await clrfund.deployNewRound(roundDuration)
      await time.increase(roundDuration)
      await expect(
        clrfund.transferMatchingFunds(
          totalSpent,
          totalSpentSalt,
          resultsCommitment,
          perVOVoiceCreditCommitment
        )
      ).to.be.revertedWithCustomError(roundInterface, 'VotesNotTallied')
    })

    it('pulls funds from funding source', async () => {
      await clrfund.addFundingSource(contributor.address)
      await (token.connect(contributor) as Contract).approve(
        clrfund.target,
        contributionAmount
      )
      await clrfund.addFundingSource(deployer.address) // Doesn't have tokens
      await clrfund.deployNewRound(roundDuration)
      await time.increase(roundDuration)
      await expect(
        clrfund.transferMatchingFunds(
          totalSpent,
          totalSpentSalt,
          resultsCommitment,
          perVOVoiceCreditCommitment
        )
      ).to.be.revertedWithCustomError(roundInterface, 'VotesNotTallied')
    })

    it('pulls funds from funding source if allowance is greater than balance', async () => {
      await clrfund.addFundingSource(contributor.address)
      await (token.connect(contributor) as Contract).approve(
        clrfund.target,
        contributionAmount * 2n
      )
      await clrfund.deployNewRound(roundDuration)
      await time.increase(roundDuration)
      await expect(
        clrfund.transferMatchingFunds(
          totalSpent,
          totalSpentSalt,
          resultsCommitment,
          perVOVoiceCreditCommitment
        )
      ).to.be.revertedWithCustomError(roundInterface, 'VotesNotTallied')
    })

    it('allows only owner to finalize round', async () => {
      await clrfund.deployNewRound(roundDuration)
      await time.increase(roundDuration)
      await expect(
        (clrfund.connect(contributor) as Contract).transferMatchingFunds(
          totalSpent,
          totalSpentSalt,
          resultsCommitment,
          perVOVoiceCreditCommitment
        )
      ).to.be.revertedWith('Ownable: caller is not the owner')
    })

    it('reverts if round has not been deployed', async () => {
      await expect(
        clrfund.transferMatchingFunds(
          totalSpent,
          totalSpentSalt,
          resultsCommitment,
          perVOVoiceCreditCommitment
        )
      ).to.be.revertedWithCustomError(clrfund, 'NoCurrentRound')
    })
  })

  describe('cancelling round', () => {
    beforeEach(async () => {
      await clrfund.setUserRegistry(userRegistry.target)
      await clrfund.setRecipientRegistry(recipientRegistry.target)
      await clrfund.setToken(token.target)
      await clrfund.setCoordinator(coordinator.address, coordinatorPubKey)
    })

    it('allows owner to cancel round', async () => {
      await clrfund.deployNewRound(roundDuration)
      const fundingRoundAddress = await clrfund.getCurrentRound()
      const fundingRound = await ethers.getContractAt(
        'FundingRound',
        fundingRoundAddress
      )
      await expect(clrfund.cancelCurrentRound())
        .to.emit(clrfund, 'RoundFinalized')
        .withArgs(fundingRoundAddress)
      expect(await fundingRound.isCancelled()).to.equal(true)
    })

    it('allows only owner to cancel round', async () => {
      await clrfund.deployNewRound(roundDuration)
      await expect(
        (clrfund.connect(contributor) as Contract).cancelCurrentRound()
      ).to.be.revertedWith('Ownable: caller is not the owner')
    })

    it('reverts if round has not been deployed', async () => {
      await expect(clrfund.cancelCurrentRound()).to.be.revertedWithCustomError(
        clrfund,
        'NoCurrentRound'
      )
    })

    it('reverts if round is finalized', async () => {
      await clrfund.deployNewRound(roundDuration)
      await clrfund.cancelCurrentRound()
      await expect(clrfund.cancelCurrentRound()).to.be.revertedWithCustomError(
        clrfund,
        'AlreadyFinalized'
      )
    })
  })

  it('allows owner to set native token', async () => {
    await expect(clrfund.setToken(token.target))
      .to.emit(clrfund, 'TokenChanged')
      .withArgs(token.target)
    expect(await clrfund.nativeToken()).to.equal(token.target)
  })

  it('only owner can set native token', async () => {
    const clrfundAsContributor = clrfund.connect(contributor) as Contract
    await expect(
      clrfundAsContributor.setToken(token.target)
    ).to.be.revertedWith('Ownable: caller is not the owner')
  })

  it('allows owner to change coordinator', async () => {
    await expect(clrfund.setCoordinator(coordinator.address, coordinatorPubKey))
      .to.emit(clrfund, 'CoordinatorChanged')
      .withArgs(coordinator.address)
    expect(await clrfund.coordinator()).to.eq(coordinator.address)
  })

  it('allows only the owner to set a new coordinator', async () => {
    const clrfundAsContributor = clrfund.connect(contributor) as Contract
    await expect(
      clrfundAsContributor.setCoordinator(
        coordinator.address,
        coordinatorPubKey
      )
    ).to.be.revertedWith('Ownable: caller is not the owner')
  })

  it('allows coordinator to call coordinatorQuit and sets coordinator to null', async () => {
    await clrfund.setCoordinator(coordinator.address, coordinatorPubKey)
    const clrfundAsCoordinator = clrfund.connect(coordinator) as Contract
    await expect(clrfundAsCoordinator.coordinatorQuit())
      .to.emit(clrfund, 'CoordinatorChanged')
      .withArgs(ZERO_ADDRESS)
    expect(await clrfund.coordinator()).to.equal(ZERO_ADDRESS)
  })

  it('only coordinator can call coordinatorQuit', async () => {
    await clrfund.setCoordinator(coordinator.address, coordinatorPubKey)
    await expect(clrfund.coordinatorQuit()).to.be.revertedWithCustomError(
      clrfund,
      'NotAuthorized'
    )
  })

  it('should cancel current round when coordinator quits', async () => {
    await clrfund.setUserRegistry(userRegistry.target)
    await clrfund.setRecipientRegistry(recipientRegistry.target)
    await clrfund.setToken(token.target)
    await clrfund.setCoordinator(coordinator.address, coordinatorPubKey)
    await clrfund.deployNewRound(roundDuration)
    const fundingRoundAddress = await clrfund.getCurrentRound()
    const fundingRound = await ethers.getContractAt(
      'FundingRound',
      fundingRoundAddress
    )

    const clrfundAsCoordinator = clrfund.connect(coordinator) as Contract
    await expect(clrfundAsCoordinator.coordinatorQuit())
      .to.emit(clrfund, 'RoundFinalized')
      .withArgs(fundingRoundAddress)
    expect(await fundingRound.isCancelled()).to.equal(true)
  })
})
