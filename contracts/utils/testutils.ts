import { Signer, Contract } from 'ethers'
import { MockContract, deployMockContract } from '@clrfund/waffle-mock-contract'
import { artifacts, ethers, config } from 'hardhat'
import { deployMaciFactory, deployPoseidonLibraries } from './deployment'
import { MaciParameters } from './maciParameters'
import { PubKey } from '@clrfund/common'
import { getEventArg } from './contracts'

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
 * Deploy an instance of the maciFactory contracct and returns the factory contracts
 * @param signer signer of the contract deployment
 * @param libraries poseidon libraries
 * @returns the contract factories in the maciFactory contract
 */
export async function deployFactories(
  signer: Signer,
  libraries: { [name: string]: string }
) {
  const maciFactory = await deployMaciFactory({ libraries, ethers, signer })
  const factories = await maciFactory.factories()
  return {
    pollFactory: factories.pollFactory,
    tallyFactory: factories.tallyFactory,
    subsidyFactory: factories.subsidyFactory,
    messageProcessorFactory: factories.messageProcessorFactory,
  }
}

/**
 * Output from the deployTestFundingRound() function
 */
export type DeployTestFundingRoundOutput = {
  token: Contract
  fundingRound: Contract
  mockUserRegistry: MockContract
  mockRecipientRegistry: MockContract
  mockVerifier: MockContract
  mockTally: MockContract
}

/**
 * Deploy an instance of funding round contract for testing
 * @param tokenSupply initial supply for the native token
 * @param coordinatorAddress the coordinator wallet address
 * @param deployer singer for the contract deployment
 * @returns all the deployed objects in DeployTestFundingRoundOutput
 */
export async function deployTestFundingRound(
  tokenSupply: bigint,
  coordinatorAddress: string,
  coordinatorPubKey: PubKey,
  roundDuration: number,
  deployer: Signer
): Promise<DeployTestFundingRoundOutput> {
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
  const factories = await deployFactories(deployer, libraries)
  const topupToken = await ethers.deployContract('TopupToken', deployer)
  const vkRegistry = await ethers.deployContract('VkRegistry', deployer)
  const mockVerifier = await deployMockContractByName('Verifier', deployer)
  const mockTally = await deployMockContractByName('Tally', deployer)

  const maciInstance = await ethers.deployContract(
    'MACI',
    [
      factories.pollFactory,
      factories.messageProcessorFactory,
      factories.tallyFactory,
      factories.subsidyFactory,
      fundingRound.target,
      fundingRound.target,
      topupToken.target,
      maciParameters.stateTreeDepth,
    ],
    {
      signer: deployer,
      libraries,
    }
  )
  const deployPollTx = await maciInstance.deployPoll(
    roundDuration,
    maciParameters.maxValues,
    maciParameters.treeDepths,
    coordinatorPubKey.asContractParam(),
    mockVerifier.target,
    vkRegistry.target,
    // pass false to not deploy the subsidy contract
    false
  )
  const pollAddr = await getEventArg(
    deployPollTx,
    maciInstance,
    'DeployPoll',
    'pollAddr'
  )

  // swap out the tally with mock tally for testing
  const pollContracts = {
    tally: mockTally.target,
    poll: pollAddr.poll,
    messageProcessor: pollAddr.messageProcessor,
    subsidy: pollAddr.subsidy,
  }
  await fundingRound.setMaci(maciInstance.target, pollContracts, factories)

  return {
    token,
    fundingRound,
    mockRecipientRegistry,
    mockUserRegistry,
    mockVerifier,
    mockTally,
  }
}
