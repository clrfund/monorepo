import { Signer, Contract } from 'ethers'
import { MockContract, deployMockContract } from '@clrfund/waffle-mock-contract'
import { artifacts, ethers, config } from 'hardhat'
import { MaciParameters } from './maciParameters'
import { PubKey } from '@clrfund/common'
import { deployContract, getEventArg, setVerifyingKeys } from './contracts'
import { HardhatEthersHelpers } from '@nomicfoundation/hardhat-ethers/types'
import { EContracts } from './types'
import { Libraries } from 'hardhat/types'
import { MACIFactory, VkRegistry } from '../typechain-types'
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
 * Deploy all the poseidon contracts
 *
 * @param signer The signer for the deployment transaction
 * @param ethers Hardhat ethers handle
 * @returns the deployed poseidon contracts
 */
export async function deployPoseidonLibraries({
  signer,
  ethers,
}: {
  signer?: Signer
  ethers: HardhatEthersHelpers
}): Promise<{ [name: string]: string }> {
  const PoseidonT3Contract = await deployContract<Contract>(
    EContracts.PoseidonT3,
    ethers,
    { signer }
  )

  const PoseidonT4Contract = await deployContract<Contract>(
    EContracts.PoseidonT4,
    ethers,
    { signer }
  )

  const PoseidonT5Contract = await deployContract<Contract>(
    EContracts.PoseidonT5,
    ethers,
    { signer }
  )

  const PoseidonT6Contract = await deployContract<Contract>(
    EContracts.PoseidonT6,
    ethers,
    {
      signer,
    }
  )

  const libraries = {
    PoseidonT3: await PoseidonT3Contract.getAddress(),
    PoseidonT4: await PoseidonT4Contract.getAddress(),
    PoseidonT5: await PoseidonT5Contract.getAddress(),
    PoseidonT6: await PoseidonT6Contract.getAddress(),
  }
  return libraries
}

/**
 * Deploy an instance of MACI factory
 * libraries - poseidon contracts
 * ethers - hardhat ethers handle
 * signer - if signer is not provided, use default signer in ethers
 * @returns MACI factory contract
 */
export async function deployMaciFactory({
  libraries,
  ethers,
  signer,
  maciParameters,
  quiet,
}: {
  libraries: Libraries
  ethers: HardhatEthersHelpers
  signer?: Signer
  maciParameters: MaciParameters
  quiet?: boolean
}): Promise<MACIFactory> {
  const vkRegistry = await deployContract<VkRegistry>(
    EContracts.VkRegistry,
    ethers,
    { signer, quiet }
  )
  await setVerifyingKeys(vkRegistry, maciParameters)

  const verifier = await deployContract<Contract>(EContracts.Verifier, ethers, {
    signer,
    quiet,
  })

  const pollFactory = await deployContract<Contract>(
    EContracts.PollFactory,
    ethers,
    { libraries, signer, quiet }
  )

  const tallyFactory = await deployContract<Contract>(
    EContracts.TallyFactory,
    ethers,
    { libraries, signer, quiet }
  )

  const messageProcessorFactory = await deployContract<Contract>(
    EContracts.MessageProcessorFactory,
    ethers,
    { libraries, signer, quiet }
  )

  // all the factories to deploy MACI contracts
  const factories = {
    pollFactory: pollFactory.target,
    tallyFactory: tallyFactory.target,
    // subsidy is not currently used
    subsidyFactory: ZERO_ADDRESS,
    messageProcessorFactory: messageProcessorFactory.target,
  }

  const maciFactory = await deployContract<MACIFactory>(
    EContracts.MACIFactory,
    ethers,
    {
      args: [vkRegistry.target, factories, verifier.target],
      libraries,
      signer,
      quiet,
    }
  )

  const setTx = await maciFactory.setMaciParameters(
    ...maciParameters.asContractParam()
  )
  await setTx.wait()

  return maciFactory
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
    EContracts.AnyOldERC20Token,
    [tokenSupply],
    deployer
  )

  const mockUserRegistry = await deployMockContractByName(
    EContracts.IUserRegistry,
    deployer
  )
  const mockRecipientRegistry = await deployMockContractByName(
    EContracts.IRecipientRegistry,
    deployer
  )

  const fundingRound = await ethers.deployContract(
    EContracts.FundingRound,
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
  })

  const maciParameters = MaciParameters.mock()
  const maciFactory = await deployMaciFactory({
    libraries,
    ethers,
    signer: deployer,
    maciParameters,
  })
  const factories = await maciFactory.factories()
  const topupToken = await ethers.deployContract(
    EContracts.TopupToken,
    deployer
  )
  const vkRegistry = await ethers.deployContract(
    EContracts.VkRegistry,
    deployer
  )
  const mockVerifier = await deployMockContractByName(
    EContracts.Verifier,
    deployer
  )
  const mockTally = await deployMockContractByName(EContracts.Tally, deployer)

  const maciInstance = await ethers.deployContract(
    EContracts.MACI,
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

  // swap out the tally contract with with a mock for testing
  const pollContracts = {
    tally: await mockTally.getAddress(),
    poll: pollAddr.poll,
    messageProcessor: pollAddr.messageProcessor,
    subsidy: pollAddr.subsidy,
  }

  await fundingRound.setMaci(maciInstance.target, pollContracts)

  return {
    token,
    fundingRound,
    mockRecipientRegistry,
    mockUserRegistry,
    mockVerifier,
    mockTally,
  }
}
