import { Signer, Contract, TransactionResponse } from 'ethers'
import { MockContract, deployMockContract } from '@clrfund/waffle-mock-contract'
import { artifacts, ethers, config } from 'hardhat'
import { deployMaciFactory, deployPoseidonLibraries } from './deployment'
import { MaciParameters } from './maciParameters'
import { getEventArg, PubKey } from '@clrfund/common'
import { IG1ContractParams } from 'maci-domainobjs'
import { ZERO_ADDRESS } from './constants'

/**
 * Deploy a mock contract with the given contract name
 * @param signer signer of the mock contract deployment
 * @param name name of the contract to mock
 * @returns a mock contract
 */
export async function deployMockContractByName(
  name: string,
  signer: Signer
): Promise<MockContract> {
  const ContractArtifacts = await artifacts.readArtifact(name)
  return deployMockContract(signer, ContractArtifacts.abi)
}

/**
 * Output from the deployTestFundingRound() function
 */
export type DeployTestFundingRoundOutput = {
  token: Contract
  fundingRound: Contract
  maciFactory: Contract
  mockUserRegistry: MockContract
  mockRecipientRegistry: MockContract
  mockVerifier: MockContract
  mockTally: MockContract
}

/**
 * Deploy an instance of funding round contract for testing
 * @param tokenSupply initial supply for the native token
 * @param coordinator the coordinator signer
 * @param coordinatorPubKey the coordinator MACI public key
 * @param startTime The round start time
 * @param duration The round duration
 * @param deployer singer for the contract deployment
 * @returns all the deployed objects in DeployTestFundingRoundOutput
 */
export async function deployTestFundingRound(
  tokenSupply: bigint,
  coordinator: Signer,
  coordinatorPubKey: PubKey,
  startTime: number,
  duration: number,
  deployer: Signer
): Promise<DeployTestFundingRoundOutput> {
  const coordinatorAddress = await coordinator.getAddress()
  const token = await ethers.deployContract(
    'AnyOldERC20Token',
    [tokenSupply],
    deployer
  )

  const mockUserRegistry = await deployMockContractByName(
    'IUserRegistry',
    deployer
  )
  const mockRecipientRegistry = await deployMockContractByName(
    'IRecipientRegistry',
    deployer
  )

  const fundingRound = await ethers.deployContract(
    'FundingRound',
    [
      token.target,
      mockUserRegistry.target,
      mockRecipientRegistry.target,
      coordinatorAddress,
    ],
    deployer
  )

  const libraries = await deployPoseidonLibraries({
    signer: deployer,
    ethers,
    artifactsPath: config.paths.artifacts,
  })

  const maciParameters = MaciParameters.mock()
  const maciFactory = await deployMaciFactory({
    libraries,
    ethers,
    signer: deployer,
    maciParameters,
  })
  const mockMaci = await deployMockContractByName('MACI', deployer)
  const mockVerifier = await deployMockContractByName('Verifier', deployer)
  const mockPoll = await deployMockContractByName('Poll', deployer)
  const mockMessageProcessor = await deployMockContractByName(
    'MessageProcessor',
    deployer
  )
  const mockTally = await deployMockContractByName('Tally', deployer)

  const processorAddress = await mockMessageProcessor.getAddress()
  const tallyAddress = await mockTally.getAddress()
  const pollAddress = await mockPoll.getAddress()

  // mocks all the values
  await mockTally.mock.tallyBatchNum.returns(1)
  await mockTally.mock.verifyTallyResult.returns(true)
  await mockTally.mock.verifySpentVoiceCredits.returns(true)

  await mockTally.mock.transferOwnership.returns()
  await mockMessageProcessor.mock.transferOwnership.returns()
  await mockPoll.mock.transferOwnership.returns()
  // use a smaller voteOptionTreeDepth for testing
  const voteOptionTreeDepth = 2
  await mockPoll.mock.treeDepths.returns(2, 2, 8, voteOptionTreeDepth)

  await mockMaci.mock.getPoll.returns(pollAddress)
  await mockMaci.mock.deployPoll.returns({
    poll: pollAddress,
    messageProcessor: processorAddress,
    tally: tallyAddress,
    subsidy: ZERO_ADDRESS,
  })
  await mockMaci.mock.signUp.returns()

  await mockPoll.mock.numSignUpsAndMessages.returns(2, 100)
  await mockPoll.mock.batchSizes.returns(0, 100, 0)
  await mockPoll.mock.getDeployTimeAndDuration.returns(startTime, duration)

  await fundingRound.setMaci(mockMaci.target)

  const roundAsCoordinator = fundingRound.connect(coordinator) as Contract

  const maciFactoryAddress = await maciFactory.getAddress()
  const tx = await roundAsCoordinator.deployPoll(
    duration,
    maciFactoryAddress,
    coordinatorPubKey.asContractParam()
  )
  const receipt = await tx.wait()
  if (receipt.status !== 1) {
    throw new Error('Failed deployPoll()')
  }

  return {
    token,
    fundingRound,
    maciFactory,
    mockRecipientRegistry,
    mockUserRegistry,
    mockVerifier,
    mockTally,
  }
}

/**
 * Deploy a new round
 * @param clrfund ClrFund contract address
 * @param duration Round duration
 * @param maciFactory MACI factory address
 * @param coordinatorPubKey Coordinator MACI public key
 * @returns Transaction response object for the round deployment
 */
export async function deployNewRound(
  clrfund: Contract,
  duration: number,
  maciFactory: string,
  coordinatorPubKey: IG1ContractParams,
  coordinator: Signer
): Promise<TransactionResponse> {
  const txPromise = clrfund.deployNewRound(duration)
  const tx = await txPromise
  await tx.wait()

  const fundingRoundAddress = await clrfund.getCurrentRound()
  const fundingRound = await ethers.getContractAt(
    'FundingRound',
    fundingRoundAddress,
    coordinator
  )
  const deployPollTx = await fundingRound.deployPoll(
    duration,
    maciFactory,
    coordinatorPubKey
  )
  await deployPollTx.wait()

  return tx
}

/**
 * Deploy a new round with real MACI
 */
export async function deployRoundWithRealMaci(
  duration: number,
  coordinatorPubKey: IG1ContractParams,
  coordinator: Signer,
  nativeToken: Contract,
  userRegistry: MockContract,
  recipientRegistry: MockContract,
  maciFactory: Contract
): Promise<Contract> {
  const nativeTokenAddress = await nativeToken.getAddress()
  const userRegistryAddress = await userRegistry.getAddress()
  const recipientRegistryAddress = await recipientRegistry.getAddress()
  const coordinatorAddress = await coordinator.getAddress()
  const args = [
    nativeTokenAddress,
    userRegistryAddress,
    recipientRegistryAddress,
    coordinatorAddress,
  ]

  const fundingRound = await ethers.deployContract('FundingRound', args)
  const topupCredit = await fundingRound.topupToken()

  const deployMaciTx = await maciFactory.deployMaci(
    fundingRound.target,
    fundingRound.target,
    topupCredit,
    duration,
    coordinatorAddress,
    coordinatorPubKey,
    fundingRound.target
  )

  const deployMaciReceipt = await deployMaciTx.wait()
  if (deployMaciReceipt.status !== 1) {
    throw new Error('Failed deployMaci()')
  }

  const maci = await getEventArg(
    deployMaciTx,
    maciFactory,
    'MaciDeployed',
    '_maci'
  )
  const setMaciTx = await fundingRound.setMaci(maci)
  const setMaciReceipt = await setMaciTx.wait()
  if (setMaciReceipt.status !== 1) {
    throw new Error('Failed to setMaci')
  }

  const fundingRoundAsCoordinator = fundingRound.connect(
    coordinator
  ) as Contract
  const deployPollTx = await fundingRoundAsCoordinator.deployPoll(
    duration,
    maciFactory.target,
    coordinatorPubKey
  )
  const deployPollReceipt = await deployPollTx.wait()
  if (deployPollReceipt.status !== 1) {
    throw new Error('Failed to deployPoll')
  }

  return fundingRound
}
