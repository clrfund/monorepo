import { ethers, waffle, config } from 'hardhat'
import { use, expect } from 'chai'
import { solidity } from 'ethereum-waffle'
import { Signer, Contract, ContractTransaction, constants } from 'ethers'
import { genRandomSalt } from '@clrfund/maci-crypto'
import { Keypair } from '@clrfund/common'

import { ZERO_ADDRESS, UNIT } from '../utils/constants'
import { getGasUsage, getEventArg } from '../utils/contracts'
import {
  deployContract,
  deployPoseidonLibraries,
  deployMaciFactory,
} from '../utils/deployment'
import { MaciParameters } from '../utils/maciParameters'
import { DEFAULT_CIRCUIT } from '../utils/circuits'

use(solidity)

const roundDuration = 10000
const circuit = DEFAULT_CIRCUIT

async function setRoundTally(
  clrfund: Contract,
  coordinator: Signer
): Promise<ContractTransaction> {
  const libraries = await deployPoseidonLibraries({
    artifactsPath: config.paths.artifacts,
    ethers,
  })
  const verifier = await deployContract({
    name: 'MockVerifier',
    ethers,
    signer: coordinator,
  })
  const tally = await deployContract({
    name: 'Tally',
    libraries,
    contractArgs: [verifier.address],
    signer: coordinator,
    ethers,
  })
  const roundAddress = await clrfund.getCurrentRound()
  const round = await ethers.getContractAt(
    'FundingRound',
    roundAddress,
    coordinator
  )
  return round.setTally(tally.address)
}

describe('Clr fund deployer', () => {
  const provider = waffle.provider
  const [, deployer, coordinator, contributor] = provider.getWallets()

  let maciFactory: Contract
  let userRegistry: Contract
  let recipientRegistry: Contract
  let factoryTemplate: Contract
  let clrfund: Contract
  let clrFundDeployer: Contract
  let token: Contract
  const coordinatorPubKey = new Keypair().pubKey.asContractParam()
  let poseidonContracts: { [name: string]: string }

  beforeEach(async () => {
    if (!poseidonContracts) {
      poseidonContracts = await deployPoseidonLibraries({
        artifactsPath: config.paths.artifacts,
        ethers,
      })
    }

    maciFactory = await deployMaciFactory({
      libraries: poseidonContracts,
      signer: deployer,
      ethers,
    })
    const params = MaciParameters.mock(circuit)
    await maciFactory.setMaciParameters(...params.asContractParam())

    factoryTemplate = await deployContract({
      name: 'ClrFund',
      ethers,
      signer: deployer,
    })

    expect(factoryTemplate.address).to.properAddress
    expect(await getGasUsage(factoryTemplate.deployTransaction)).lessThan(
      5400000
    )

    const roundFactory = await deployContract({
      name: 'FundingRoundFactory',
      libraries: poseidonContracts,
      ethers,
    })
    expect(await getGasUsage(roundFactory.deployTransaction)).lessThan(4000000)

    clrFundDeployer = await deployContract({
      name: 'ClrFundDeployer',
      contractArgs: [
        factoryTemplate.address,
        maciFactory.address,
        roundFactory.address,
      ],
      ethers,
      signer: deployer,
    })

    expect(clrFundDeployer.address).to.properAddress
    expect(await getGasUsage(clrFundDeployer.deployTransaction)).lessThan(
      5400000
    )

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
    recipientRegistry = await SimpleRecipientRegistry.deploy(clrfund.address)

    // Deploy token contract and transfer tokens to contributor

    const tokenInitialSupply = UNIT.mul(1000)
    const Token = await ethers.getContractFactory('AnyOldERC20Token', deployer)
    token = await Token.deploy(tokenInitialSupply)
    expect(token.address).to.properAddress
    await token.transfer(contributor.address, tokenInitialSupply)
  })

  it('can only be initialized once', async () => {
    const dummyRoundFactory = constants.AddressZero
    await expect(
      clrfund.init(maciFactory.address, dummyRoundFactory)
    ).to.be.revertedWith('Initializable: contract is already initialized')
  })

  it('can register with the subgraph', async () => {
    await expect(
      clrFundDeployer.registerInstance(
        clrfund.address,
        '{name:dead,title:beef}'
      )
    )
      .to.emit(clrFundDeployer, 'Register')
      .withArgs(clrfund.address, '{name:dead,title:beef}')
  })

  it('cannot register with the subgraph twice', async () => {
    await expect(
      clrFundDeployer.registerInstance(
        clrfund.address,
        '{name:dead,title:beef}'
      )
    )
      .to.emit(clrFundDeployer, 'Register')
      .withArgs(clrfund.address, '{name:dead,title:beef}')
    await expect(
      clrFundDeployer.registerInstance(
        clrfund.address,
        '{name:dead,title:beef}'
      )
    ).to.be.revertedWith('ClrFundAlreadyRegistered')
  })

  it('initializes clrfund', async () => {
    expect(await clrfund.coordinator()).to.equal(ZERO_ADDRESS)
    expect(await clrfund.nativeToken()).to.equal(ZERO_ADDRESS)
    expect(await clrfund.maciFactory()).to.equal(maciFactory.address)
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
      await clrfund.setUserRegistry(userRegistry.address)
      expect(await clrfund.userRegistry()).to.equal(userRegistry.address)
    })

    it('allows only owner to set user registry', async () => {
      await expect(
        clrfund.connect(contributor).setUserRegistry(userRegistry.address)
      ).to.be.revertedWith('Ownable: caller is not the owner')
    })

    it('allows owner to change recipient registry', async () => {
      await clrfund.setRecipientRegistry(recipientRegistry.address)
      const SimpleUserRegistry = await ethers.getContractFactory(
        'SimpleUserRegistry',
        deployer
      )
      const anotherUserRegistry = await SimpleUserRegistry.deploy()
      await clrfund.setUserRegistry(anotherUserRegistry.address)
      expect(await clrfund.userRegistry()).to.equal(anotherUserRegistry.address)
    })
  })

  describe('changing recipient registry', () => {
    it('allows owner to set recipient registry', async () => {
      await clrfund.setCoordinator(coordinator.address, coordinatorPubKey)
      await clrfund.setRecipientRegistry(recipientRegistry.address)
      expect(await clrfund.recipientRegistry()).to.equal(
        recipientRegistry.address
      )
      expect(await recipientRegistry.controller()).to.equal(clrfund.address)
      const params = MaciParameters.mock(circuit)
      expect(await recipientRegistry.maxRecipients()).to.equal(
        5 ** params.voteOptionTreeDepth
      )
    })

    it('allows only owner to set recipient registry', async () => {
      await expect(
        clrfund
          .connect(contributor)
          .setRecipientRegistry(recipientRegistry.address)
      ).to.be.revertedWith('Ownable: caller is not the owner')
    })

    it('allows owner to change recipient registry', async () => {
      await clrfund.setRecipientRegistry(recipientRegistry.address)
      const SimpleRecipientRegistry = await ethers.getContractFactory(
        'SimpleRecipientRegistry',
        deployer
      )
      const anotherRecipientRegistry = await SimpleRecipientRegistry.deploy(
        clrfund.address
      )
      await clrfund.setRecipientRegistry(anotherRecipientRegistry.address)
      expect(await clrfund.recipientRegistry()).to.equal(
        anotherRecipientRegistry.address
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
        clrfund.connect(contributor).addFundingSource(contributor.address)
      ).to.be.revertedWith('Ownable: caller is not the owner')
    })

    it('reverts if funding source is already added', async () => {
      await clrfund.addFundingSource(contributor.address)
      await expect(
        clrfund.addFundingSource(contributor.address)
      ).to.be.revertedWith('FundingSourceAlreadyAdded')
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
        clrfund.connect(contributor).removeFundingSource(contributor.address)
      ).to.be.revertedWith('Ownable: caller is not the owner')
    })

    it('reverts if funding source is already removed', async () => {
      await clrfund.addFundingSource(contributor.address)
      await clrfund.removeFundingSource(contributor.address)
      await expect(
        clrfund.removeFundingSource(contributor.address)
      ).to.be.revertedWith('FundingSourceNotFound')
    })
  })

  it('allows direct contributions to the matching pool', async () => {
    const contributionAmount = UNIT.mul(10)
    await clrfund.setToken(token.address)
    await expect(
      token.connect(contributor).transfer(clrfund.address, contributionAmount)
    )
      .to.emit(token, 'Transfer')
      .withArgs(contributor.address, clrfund.address, contributionAmount)
    expect(await token.balanceOf(clrfund.address)).to.equal(contributionAmount)
  })

  describe('deploying funding round', () => {
    it('deploys funding round', async () => {
      await clrfund.setUserRegistry(userRegistry.address)
      await clrfund.setRecipientRegistry(recipientRegistry.address)
      await clrfund.setToken(token.address)
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
      expect(await fundingRound.owner()).to.equal(clrfund.address)
      expect(await fundingRound.nativeToken()).to.equal(token.address)

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
        '_pollAddr'
      )
      const poll = await ethers.getContractAt('Poll', pollAddress)
      const roundCoordinatorPubKey = await poll.coordinatorPubKey()
      expect(roundCoordinatorPubKey.x).to.equal(coordinatorPubKey.x)
      expect(roundCoordinatorPubKey.y).to.equal(coordinatorPubKey.y)
    })

    it('reverts if user registry is not set', async () => {
      await clrfund.setRecipientRegistry(recipientRegistry.address)
      await clrfund.setToken(token.address)
      await clrfund.setCoordinator(coordinator.address, coordinatorPubKey)

      await expect(clrfund.deployNewRound(roundDuration)).to.be.revertedWith(
        'NoUserRegistry'
      )
    })

    it('reverts if recipient registry is not set', async () => {
      await clrfund.setUserRegistry(userRegistry.address)
      await clrfund.setToken(token.address)
      await clrfund.setCoordinator(coordinator.address, coordinatorPubKey)

      await expect(clrfund.deployNewRound(roundDuration)).to.be.revertedWith(
        'NoRecipientRegistry'
      )
    })

    it('reverts if native token is not set', async () => {
      await clrfund.setUserRegistry(userRegistry.address)
      await clrfund.setRecipientRegistry(recipientRegistry.address)
      await clrfund.setCoordinator(coordinator.address, coordinatorPubKey)

      await expect(clrfund.deployNewRound(roundDuration)).to.be.revertedWith(
        'NoToken'
      )
    })

    it('reverts if coordinator is not set', async () => {
      await clrfund.setUserRegistry(userRegistry.address)
      await clrfund.setRecipientRegistry(recipientRegistry.address)
      await clrfund.setToken(token.address)
      await expect(clrfund.deployNewRound(roundDuration)).to.be.revertedWith(
        'NoCoordinator'
      )
    })

    it('reverts if current round is not finalized', async () => {
      await clrfund.setUserRegistry(userRegistry.address)
      await clrfund.setRecipientRegistry(recipientRegistry.address)
      await clrfund.setToken(token.address)
      await clrfund.setCoordinator(coordinator.address, coordinatorPubKey)

      await clrfund.deployNewRound(roundDuration)
      await expect(clrfund.deployNewRound(roundDuration)).to.be.revertedWith(
        'NotFinalized'
      )
    })

    it('deploys new funding round after previous round has been finalized', async () => {
      await clrfund.setUserRegistry(userRegistry.address)
      await clrfund.setRecipientRegistry(recipientRegistry.address)
      await clrfund.setToken(token.address)
      await clrfund.setCoordinator(coordinator.address, coordinatorPubKey)

      await clrfund.deployNewRound(roundDuration)
      await clrfund.cancelCurrentRound()
      await expect(clrfund.deployNewRound(roundDuration)).to.emit(
        clrfund,
        'RoundStarted'
      )
    })

    it('only owner can deploy funding round', async () => {
      await clrfund.setUserRegistry(userRegistry.address)
      await clrfund.setRecipientRegistry(recipientRegistry.address)
      await clrfund.setToken(token.address)
      await clrfund.setCoordinator(coordinator.address, coordinatorPubKey)

      const clrfundAsContributor = clrfund.connect(contributor)
      await expect(
        clrfundAsContributor.deployNewRound(roundDuration)
      ).to.be.revertedWith('Ownable: caller is not the owner')
    })
  })

  describe('transferring matching funds', () => {
    const contributionAmount = UNIT.mul(10)
    const totalSpent = UNIT.mul(100)
    const totalSpentSalt = genRandomSalt().toString()
    const resultsCommitment = genRandomSalt().toString()
    const perVOVoiceCreditCommitment = genRandomSalt().toString()

    beforeEach(async () => {
      await clrfund.setUserRegistry(userRegistry.address)
      await clrfund.setRecipientRegistry(recipientRegistry.address)
      await clrfund.setToken(token.address)
      await clrfund.setCoordinator(coordinator.address, coordinatorPubKey)
    })

    it('returns the amount of available matching funding', async () => {
      await clrfund.addFundingSource(deployer.address)
      await clrfund.addFundingSource(contributor.address)
      // Allowance is more than available balance
      await token.connect(deployer).approve(clrfund.address, contributionAmount)
      // Allowance is less than available balance
      await token
        .connect(contributor)
        .approve(clrfund.address, contributionAmount)
      // Direct contribution
      await token
        .connect(contributor)
        .transfer(clrfund.address, contributionAmount)

      await clrfund.deployNewRound(roundDuration)
      expect(await clrfund.getMatchingFunds(token.address)).to.equal(
        contributionAmount.mul(2)
      )
    })

    it('allows owner to finalize round', async () => {
      await token
        .connect(contributor)
        .transfer(clrfund.address, contributionAmount)
      await clrfund.deployNewRound(roundDuration)
      await provider.send('evm_increaseTime', [roundDuration])
      await setRoundTally(clrfund, coordinator)
      await expect(
        clrfund.transferMatchingFunds(
          totalSpent,
          totalSpentSalt,
          resultsCommitment,
          perVOVoiceCreditCommitment
        )
      ).to.be.revertedWith('VotesNotTallied')
    })

    it('allows owner to finalize round even without matching funds', async () => {
      await clrfund.deployNewRound(roundDuration)
      await provider.send('evm_increaseTime', [roundDuration])
      await setRoundTally(clrfund, coordinator)
      await expect(
        clrfund.transferMatchingFunds(
          totalSpent,
          totalSpentSalt,
          resultsCommitment,
          perVOVoiceCreditCommitment
        )
      ).to.be.revertedWith('VotesNotTallied')
    })

    it('pulls funds from funding source', async () => {
      await clrfund.addFundingSource(contributor.address)
      token.connect(contributor).approve(clrfund.address, contributionAmount)
      await clrfund.addFundingSource(deployer.address) // Doesn't have tokens
      await clrfund.deployNewRound(roundDuration)
      await provider.send('evm_increaseTime', [roundDuration])
      await setRoundTally(clrfund, coordinator)
      await expect(
        clrfund.transferMatchingFunds(
          totalSpent,
          totalSpentSalt,
          resultsCommitment,
          perVOVoiceCreditCommitment
        )
      ).to.be.revertedWith('VotesNotTallied')
    })

    it('pulls funds from funding source if allowance is greater than balance', async () => {
      await clrfund.addFundingSource(contributor.address)
      token
        .connect(contributor)
        .approve(clrfund.address, contributionAmount.mul(2))
      await clrfund.deployNewRound(roundDuration)
      await provider.send('evm_increaseTime', [roundDuration])
      await setRoundTally(clrfund, coordinator)
      await expect(
        clrfund.transferMatchingFunds(
          totalSpent,
          totalSpentSalt,
          resultsCommitment,
          perVOVoiceCreditCommitment
        )
      ).to.be.revertedWith('VotesNotTallied')
    })

    it('allows only owner to finalize round', async () => {
      await clrfund.deployNewRound(roundDuration)
      await provider.send('evm_increaseTime', [roundDuration])
      await setRoundTally(clrfund, coordinator)
      await expect(
        clrfund
          .connect(contributor)
          .transferMatchingFunds(
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
      ).to.be.revertedWith('NoCurrentRound')
    })
  })

  describe('cancelling round', () => {
    beforeEach(async () => {
      await clrfund.setUserRegistry(userRegistry.address)
      await clrfund.setRecipientRegistry(recipientRegistry.address)
      await clrfund.setToken(token.address)
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
        clrfund.connect(contributor).cancelCurrentRound()
      ).to.be.revertedWith('Ownable: caller is not the owner')
    })

    it('reverts if round has not been deployed', async () => {
      await expect(clrfund.cancelCurrentRound()).to.be.revertedWith(
        'NoCurrentRound'
      )
    })

    it('reverts if round is finalized', async () => {
      await clrfund.deployNewRound(roundDuration)
      await clrfund.cancelCurrentRound()
      await expect(clrfund.cancelCurrentRound()).to.be.revertedWith(
        'AlreadyFinalized'
      )
    })
  })

  it('allows owner to set native token', async () => {
    await expect(clrfund.setToken(token.address))
      .to.emit(clrfund, 'TokenChanged')
      .withArgs(token.address)
    expect(await clrfund.nativeToken()).to.equal(token.address)
  })

  it('only owner can set native token', async () => {
    const clrfundAsContributor = clrfund.connect(contributor)
    await expect(
      clrfundAsContributor.setToken(token.address)
    ).to.be.revertedWith('Ownable: caller is not the owner')
  })

  it('allows owner to change coordinator', async () => {
    await expect(clrfund.setCoordinator(coordinator.address, coordinatorPubKey))
      .to.emit(clrfund, 'CoordinatorChanged')
      .withArgs(coordinator.address)
    expect(await clrfund.coordinator()).to.eq(coordinator.address)
  })

  it('allows only the owner to set a new coordinator', async () => {
    const clrfundAsContributor = clrfund.connect(contributor)
    await expect(
      clrfundAsContributor.setCoordinator(
        coordinator.address,
        coordinatorPubKey
      )
    ).to.be.revertedWith('Ownable: caller is not the owner')
  })

  it('allows coordinator to call coordinatorQuit and sets coordinator to null', async () => {
    await clrfund.setCoordinator(coordinator.address, coordinatorPubKey)
    const clrfundAsCoordinator = clrfund.connect(coordinator)
    await expect(clrfundAsCoordinator.coordinatorQuit())
      .to.emit(clrfund, 'CoordinatorChanged')
      .withArgs(ZERO_ADDRESS)
    expect(await clrfund.coordinator()).to.equal(ZERO_ADDRESS)
  })

  it('only coordinator can call coordinatorQuit', async () => {
    await clrfund.setCoordinator(coordinator.address, coordinatorPubKey)
    await expect(clrfund.coordinatorQuit()).to.be.revertedWith('NotAuthorized')
  })

  it('should cancel current round when coordinator quits', async () => {
    await clrfund.setUserRegistry(userRegistry.address)
    await clrfund.setRecipientRegistry(recipientRegistry.address)
    await clrfund.setToken(token.address)
    await clrfund.setCoordinator(coordinator.address, coordinatorPubKey)
    await clrfund.deployNewRound(roundDuration)
    const fundingRoundAddress = await clrfund.getCurrentRound()
    const fundingRound = await ethers.getContractAt(
      'FundingRound',
      fundingRoundAddress
    )

    const clrfundAsCoordinator = clrfund.connect(coordinator)
    await expect(clrfundAsCoordinator.coordinatorQuit())
      .to.emit(clrfund, 'RoundFinalized')
      .withArgs(fundingRoundAddress)
    expect(await fundingRound.isCancelled()).to.equal(true)
  })
})
