import type { HardhatRuntimeEnvironment } from 'hardhat/types'
import { BaseContract, Interface } from 'ethers'
import { ContractStorage } from './ContractStorage'
import { EContracts } from './types'
import { HardhatEthersHelpers } from '@nomicfoundation/hardhat-ethers/types'
import {
  BrightIdUserRegistry,
  ClrFundDeployer,
  MACIFactory,
  MessageProcessor,
  OptimisticRecipientRegistry,
  Poll,
  Tally,
} from '../../typechain-types'

/** A list of functions to get contract constructor arguments from the contract */
const ConstructorArgumentsGetters: Record<
  string,
  (address: string, ethers: HardhatEthersHelpers) => Promise<Array<unknown>>
> = {
  [EContracts.FundingRound]: getFundingRoundConstructorArguments,
  [EContracts.MACI]: getMaciConstructorArguments,
  [EContracts.Poll]: getPollConstructorArguments,
  [EContracts.Tally]: getTallyConstructorArguments,
  [EContracts.MessageProcessor]: getMessageProcessorConstructorArguments,
  [EContracts.BrightIdUserRegistry]:
    getBrightIdUserRegistryConstructorArguments,
  [EContracts.OptimisticRecipientRegistry]:
    getOptimisticRecipientRegistryConstructorArguments,
  [EContracts.ClrFundDeployer]: getClrFundDeployerConstructorArguments,
  [EContracts.MACIFactory]: getMACIFactoryConstructorArguments,
}

/**
 * Get the constructor arguments for FundingRound
 * @param address The funding round contract address
 * @param ethers The Hardhat Ethers helper
 * @returns The funding round constructor arguments
 */
async function getFundingRoundConstructorArguments(
  address: string,
  ethers: HardhatEthersHelpers
): Promise<Array<unknown>> {
  const round = await ethers.getContractAt(EContracts.FundingRound, address)

  const args = await Promise.all([
    round.nativeToken(),
    round.userRegistry(),
    round.recipientRegistry(),
    round.coordinator(),
  ])

  return args
}

/**
 * Get the constructor arguments for MACI
 * @param address The MACI contract address
 * @param ethers The Hardhat Ethers helper
 * @returns The constructor arguments
 */
async function getMaciConstructorArguments(
  address: string,
  ethers: HardhatEthersHelpers
): Promise<Array<unknown>> {
  const maci = await ethers.getContractAt(EContracts.MACI, address)

  const args = await Promise.all([
    maci.pollFactory(),
    maci.messageProcessorFactory(),
    maci.tallyFactory(),
    maci.subsidyFactory(),
    maci.signUpGatekeeper(),
    maci.initialVoiceCreditProxy(),
    maci.topupCredit(),
    maci.stateTreeDepth(),
  ])

  return args
}

/**
 * Get the constructor arguments for Poll
 * @param address The Poll contract address
 * @param ethers The Hardhat Ethers helper
 * @returns The constructor arguments
 */
async function getPollConstructorArguments(
  address: string,
  ethers: HardhatEthersHelpers
): Promise<Array<unknown>> {
  const pollContract = (await ethers.getContractAt(
    EContracts.Poll,
    address
  )) as BaseContract as Poll

  const [, duration] = await pollContract.getDeployTimeAndDuration()
  const [maxValues, treeDepths, coordinatorPubKey, extContracts] =
    await Promise.all([
      pollContract.maxValues(),
      pollContract.treeDepths(),
      pollContract.coordinatorPubKey(),
      pollContract.extContracts(),
    ])

  const args = [
    duration,
    {
      maxMessages: maxValues.maxMessages,
      maxVoteOptions: maxValues.maxVoteOptions,
    },
    {
      intStateTreeDepth: treeDepths.intStateTreeDepth,
      messageTreeSubDepth: treeDepths.messageTreeSubDepth,
      messageTreeDepth: treeDepths.messageTreeDepth,
      voteOptionTreeDepth: treeDepths.voteOptionTreeDepth,
    },
    {
      x: coordinatorPubKey.x,
      y: coordinatorPubKey.y,
    },
    {
      maci: extContracts.maci,
      messageAq: extContracts.messageAq,
      topupCredit: extContracts.topupCredit,
    },
  ]

  return args
}

/**
 * Get the constructor arguments for Tally
 * @param address The Tally contract address
 * @param ethers The Hardhat Ethers helper
 * @returns The constructor arguments
 */
async function getTallyConstructorArguments(
  address: string,
  ethers: HardhatEthersHelpers
): Promise<Array<unknown>> {
  const tallyContract = (await ethers.getContractAt(
    EContracts.Tally,
    address
  )) as BaseContract as Tally

  const args = await Promise.all([
    tallyContract.verifier(),
    tallyContract.vkRegistry(),
    tallyContract.poll(),
    tallyContract.messageProcessor(),
  ])

  return args
}

/**
 * Get the constructor arguments for MessageProcessor
 * @param address The MessageProcessor contract address
 * @param ethers The Hardhat Ethers helper
 * @returns The constructor arguments
 */
async function getMessageProcessorConstructorArguments(
  address: string,
  ethers: HardhatEthersHelpers
): Promise<Array<unknown>> {
  const messageProcesor = (await ethers.getContractAt(
    EContracts.MessageProcessor,
    address
  )) as BaseContract as MessageProcessor

  const args = await Promise.all([
    messageProcesor.verifier(),
    messageProcesor.vkRegistry(),
    messageProcesor.poll(),
  ])

  return args
}

/**
 * Get the constructor arguments for BrightIdUserRegistry
 * @param address The BrightIdUserRegistry contract address
 * @param ethers The Hardhat Ethers helper
 * @returns The constructor arguments
 */
async function getBrightIdUserRegistryConstructorArguments(
  address: string,
  ethers: HardhatEthersHelpers
): Promise<Array<unknown>> {
  const registry = (await ethers.getContractAt(
    EContracts.BrightIdUserRegistry,
    address
  )) as BaseContract as BrightIdUserRegistry

  const args = await Promise.all([
    registry.context(),
    registry.verifier(),
    registry.brightIdSponsor(),
  ])

  return args
}

/**
 * Get the constructor arguments for OptimisticRecipientRegistry
 * @param address The OptimisticRecipientRegistry contract address
 * @param ethers The Hardhat Ethers helper
 * @returns The constructor arguments
 */
async function getOptimisticRecipientRegistryConstructorArguments(
  address: string,
  ethers: HardhatEthersHelpers
): Promise<Array<unknown>> {
  const registry = (await ethers.getContractAt(
    EContracts.OptimisticRecipientRegistry,
    address
  )) as BaseContract as OptimisticRecipientRegistry

  const args = await Promise.all([
    registry.baseDeposit(),
    registry.challengePeriodDuration(),
    registry.controller(),
  ])

  return args
}

/**
 * Get the constructor arguments for ClrFundDeployer
 * @param address The ClrFundDeployer contract address
 * @param ethers The Hardhat Ethers helper
 * @returns The constructor arguments
 */
async function getClrFundDeployerConstructorArguments(
  address: string,
  ethers: HardhatEthersHelpers
): Promise<Array<unknown>> {
  const registry = (await ethers.getContractAt(
    EContracts.ClrFundDeployer,
    address
  )) as BaseContract as ClrFundDeployer

  const args = await Promise.all([
    registry.clrfundTemplate(),
    registry.maciFactory(),
    registry.roundFactory(),
  ])

  return args
}

/**
 * Get the constructor arguments for MACIFactory
 * @param address The MACIFactory contract address
 * @param ethers The Hardhat Ethers helper
 * @returns The constructor arguments
 */
async function getMACIFactoryConstructorArguments(
  address: string,
  ethers: HardhatEthersHelpers
): Promise<Array<unknown>> {
  const registry = (await ethers.getContractAt(
    EContracts.MACIFactory,
    address
  )) as BaseContract as MACIFactory

  const args = await Promise.all([
    registry.vkRegistry(),
    registry.factories(),
    registry.verifier(),
  ])

  return args
}

/**
 * @notice A helper to retrieve contract constructor arguments
 */
export class ConstructorArguments {
  /**
   * Hardhat runtime environment
   */
  private hre: HardhatRuntimeEnvironment

  /**
   * Local contract deployment information
   */
  private storage: ContractStorage

  /**
   * Initialize class properties
   *
   * @param hre - Hardhat runtime environment
   */
  constructor(hre: HardhatRuntimeEnvironment) {
    this.hre = hre
    this.storage = ContractStorage.getInstance()
  }

  /**
   * Get the contract constructor arguments
   * @param name - contract name
   * @param address - contract address
   * @param ethers = Hardhat Ethers helper
   * @returns - stringified constructor arguments
   */
  async get(
    name: string,
    address: string,
    ethers: HardhatEthersHelpers
  ): Promise<Array<unknown>> {
    const contractArtifact = this.hre.artifacts.readArtifactSync(name)
    const contractInterface = new Interface(contractArtifact.abi)
    if (contractInterface.deploy.inputs.length === 0) {
      // no argument
      return []
    }

    // try to get arguments from deployed-contract.json file
    const constructorArguments = this.storage.getConstructorArguments(
      address,
      this.hre.network.name
    )
    if (constructorArguments) {
      return constructorArguments
    }

    // try to get custom constructor arguments from contract
    let args: Array<unknown> = []

    const getConstructorArguments = ConstructorArgumentsGetters[name]
    if (getConstructorArguments) {
      args = await getConstructorArguments(address, ethers)
    }

    return args
  }
}
