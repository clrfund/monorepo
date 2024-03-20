import {
  Signer,
  Contract,
  ContractTransactionResponse,
  encodeBytes32String,
  BaseContract,
} from 'ethers'
import path from 'path'

import { readFileSync } from 'fs'
import { HardhatEthersHelpers } from '@nomicfoundation/hardhat-ethers/types'
import { DEFAULT_CIRCUIT } from './circuits'
import { isPathExist } from './misc'
import { MaciParameters } from './maciParameters'
import { PrivKey, Keypair } from '@clrfund/common'
import { ZERO_ADDRESS } from './constants'
import { VkRegistry } from '../typechain-types'
import { IVerifyingKeyStruct } from 'maci-contracts'

// Number.MAX_SAFE_INTEGER - 1
export const challengePeriodSeconds = '9007199254740990'

export type Libraries = { [name: string]: string }

// Mapping of the user registry type and the contract name
const userRegistryNames: Record<string, string> = {
  simple: 'SimpleUserRegistry',
  brightid: 'BrightIdUserRegistry',
  snapshot: 'SnapshotUserRegistry',
  merkle: 'MerkleUserRegistry',
  semaphore: 'SemaphoreUserRegistry',
}

// Mapping of recipient registry type to the contract name
const recipientRegistries: Record<string, string> = {
  simple: 'SimpleRecipientRegistry',
  optimistic: 'OptimisticRecipientRegistry',
}

// BrightId contract deployment parameters
export interface BrightIdParams {
  context: string
  verifierAddress: string
  sponsor: string
}

type PoseidonName = 'PoseidonT3' | 'PoseidonT4' | 'PoseidonT5' | 'PoseidonT6'

/**
 * Log the message based on the quiet flag
 * @param quiet whether to log the message
 * @param message the message to log
 */
function logInfo(quiet = true, message: string, ...args: any[]) {
  if (!quiet) {
    console.log(message, ...args)
  }
}

/**
 * Deploy the Poseidon contracts. These contracts
 * have a custom artifact location that the hardhat library cannot
 * retrieve using the standard getContractFactory() function, so, we manually
 * read the artifact content and pass to the getContractFactory function
 *
 * NOTE: there are 2 copies of the Poseidon artifacts, the one in the build/contracts
 * folder has the actual contract bytecode, the other one in the build/contracts/@clrfund/maci-contracts
 * only has the library interface. If the wrong bytecode is used to deploy the contract,
 * the hash functions will always return 0.
 *
 * @param name PoseidonT3, PoseidonT4, PoseidonT5, PoseidonT6
 * @param ethers
 * @param signer the account that deploys the contract
 * @returns contract object
 */
export async function deployPoseidon({
  name,
  artifactsPath,
  ethers,
  signer,
}: {
  name: PoseidonName
  artifactsPath: string
  ethers: HardhatEthersHelpers
  signer?: Signer
}): Promise<Contract> {
  const artifact = JSON.parse(
    readFileSync(path.join(artifactsPath, `${name}.json`)).toString()
  )

  const Poseidon = await ethers.getContractFactory(
    artifact.abi,
    artifact.bytecode,
    signer
  )

  const poseidonContract = await Poseidon.deploy()

  return await poseidonContract.waitForDeployment()
}

export type deployContractOptions = {
  name: string
  libraries?: Libraries
  contractArgs?: any[]
  // hardhat ethers handle
  ethers: HardhatEthersHelpers
  // if signer is not provided, use the default signer from ethers
  signer?: Signer
}

export async function deployContract({
  name,
  libraries,
  contractArgs = [],
  ethers,
  signer,
}: deployContractOptions): Promise<Contract> {
  const contract = await ethers.deployContract(name, contractArgs, {
    signer,
    libraries,
  })

  return await contract.waitForDeployment()
}

/**
 * Deploy a user registry
 * @param userRegistryType  user registry type, e.g. brightid, simple, etc
 * @param ethers Hardhat ethers handle
 * @param signer The user registry contract deployer
 * @param brightidContext The BrightId context
 * @param brightidVerifier The BrightId verifier address
 * @param brightidSponsor The BrightId sponsor contract address
 * @returns the newly deployed user registry contract
 */
export async function deployUserRegistry({
  userRegistryType,
  ethers,
  signer,
  brightidContext,
  brightidVerifier,
  brightidSponsor,
}: {
  userRegistryType: string
  ethers: HardhatEthersHelpers
  signer?: Signer
  brightidContext?: string
  brightidVerifier?: string
  brightidSponsor?: string
}): Promise<Contract> {
  let contractArgs: any[] = []
  const registryType = (userRegistryType || '').toLowerCase()

  if (registryType === 'brightid') {
    if (!brightidContext) {
      throw new Error('Missing BrightId context')
    }
    if (!brightidVerifier) {
      throw new Error('Missing BrightId verifier address')
    }
    if (!brightidSponsor) {
      throw new Error('Missing BrightId sponsor contract address')
    }

    contractArgs = [
      encodeBytes32String(brightidContext),
      brightidVerifier,
      brightidSponsor,
    ]
  }

  const userRegistryName = userRegistryNames[registryType]
  if (!userRegistryName) {
    throw new Error('unsupported user registry type: ' + registryType)
  }

  return deployContract({
    name: userRegistryName,
    contractArgs,
    ethers,
    signer,
  })
}

/**
 * Deploy a recipient registry
 * @param type  recipient registry type, e.g. simple, optimistic, etc
 * @param controller the controller address of the registry
 * @param deposit the optimistic recipient registry base deposit amount
 * @param challengePeriod the optimistic recipient registry challenge period
 * @param ethers Hardhat ethers handle
 * @param signer The deployer account
 * @returns the newly deployed registry contract
 */
export async function deployRecipientRegistry({
  type,
  controller,
  deposit,
  challengePeriod,
  ethers,
  signer,
}: {
  type: string
  controller: string
  deposit?: bigint
  challengePeriod?: bigint
  ethers: HardhatEthersHelpers
  signer?: Signer
}): Promise<Contract> {
  const registryType = (type || '').toLowerCase()
  const registryName = recipientRegistries[registryType]
  if (!registryName) {
    throw new Error('Unsupported recipient registry type: ' + registryType)
  }

  if (registryType === 'optimistic') {
    if (!deposit) {
      throw new Error('Missing base deposit amount')
    }
    if (!challengePeriod) {
      throw new Error('Missing challenge period')
    }
  }

  const args =
    registryType === 'simple'
      ? [controller]
      : [deposit, challengePeriod, controller]

  const recipientRegistry = await ethers.deployContract(
    registryName,
    args,
    signer
  )

  await recipientRegistry.waitForDeployment()
  return recipientRegistry
}

/**
 * Deploy all the poseidon contracts
 *
 * @param signer The signer for the deployment transaction
 * @param ethers Hardhat ethers handle
 * @param artifactsPath Contract artifacts path
 * @returns the deployed poseidon contracts
 */
export async function deployPoseidonLibraries({
  signer,
  ethers,
  artifactsPath,
}: {
  signer?: Signer
  ethers: HardhatEthersHelpers
  artifactsPath: string
}): Promise<{ [name: string]: string }> {
  const PoseidonT3Contract = await deployPoseidon({
    name: 'PoseidonT3',
    artifactsPath,
    ethers,
    signer,
  })

  const PoseidonT4Contract = await deployPoseidon({
    name: 'PoseidonT4',
    artifactsPath,
    ethers,
    signer,
  })

  const PoseidonT5Contract = await deployPoseidon({
    name: 'PoseidonT5',
    artifactsPath,
    signer,
    ethers,
  })

  const PoseidonT6Contract = await deployPoseidon({
    name: 'PoseidonT6',
    artifactsPath,
    ethers,
    signer,
  })

  const libraries = {
    PoseidonT3: await PoseidonT3Contract.getAddress(),
    PoseidonT4: await PoseidonT4Contract.getAddress(),
    PoseidonT5: await PoseidonT5Contract.getAddress(),
    PoseidonT6: await PoseidonT6Contract.getAddress(),
  }
  return libraries
}

/**
 * Deploy the poll factory
 * @param signer Contract creator
 * @param ethers Hardhat ethers handle
 * @param libraries Poseidon libraries
 * @param artifactPath Poseidon contract artifacts path
 *
 */
export async function deployPollFactory({
  signer,
  ethers,
  libraries,
  artifactsPath,
}: {
  signer: Signer
  ethers: HardhatEthersHelpers
  libraries?: Libraries
  artifactsPath?: string
}): Promise<Contract> {
  let poseidonLibraries = libraries
  if (!libraries) {
    if (!artifactsPath) {
      throw Error('Failed to dpeloy PollFactory, artifact path is missing')
    }
    poseidonLibraries = await deployPoseidonLibraries({
      artifactsPath: artifactsPath || '',
      ethers,
      signer,
    })
  }

  return deployContract({
    name: 'PollFactory',
    libraries: poseidonLibraries,
    signer,
    ethers,
  })
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
}): Promise<Contract> {
  const vkRegistry = await deployContract({
    name: 'VkRegistry',
    ethers,
    signer,
  })
  logInfo(quiet, 'Deployed VkRegistry at', vkRegistry.target)

  await setVerifyingKeys(
    vkRegistry as BaseContract as VkRegistry,
    maciParameters
  )

  const verifier = await deployContract({
    name: 'Verifier',
    ethers,
    signer,
  })
  logInfo(quiet, 'Deployed Verifier at', verifier.target)

  const pollFactory = await deployContract({
    name: 'PollFactory',
    libraries,
    ethers,
    signer,
  })
  logInfo(quiet, 'Deployed PollFactory at', pollFactory.target)

  const tallyFactory = await deployContract({
    name: 'TallyFactory',
    libraries,
    ethers,
    signer,
  })
  logInfo(quiet, 'Deployed TallyFactory at', tallyFactory.target)

  const messageProcessorFactory = await deployContract({
    name: 'MessageProcessorFactory',
    libraries,
    ethers,
    signer,
  })
  logInfo(
    quiet,
    'Deployed MessageProcessorFactory at',
    messageProcessorFactory.target
  )

  // all the factories to deploy MACI contracts
  const factories = {
    pollFactory: pollFactory.target,
    tallyFactory: tallyFactory.target,
    // subsidy is not currently used
    subsidyFactory: ZERO_ADDRESS,
    messageProcessorFactory: messageProcessorFactory.target,
  }

  const maciFactory = await deployContract({
    name: 'MACIFactory',
    libraries,
    contractArgs: [vkRegistry.target, factories, verifier.target],
    ethers,
    signer,
  })
  logInfo(quiet, 'Deployed MACIFactory at', maciFactory.target)

  const setTx = await maciFactory.setMaciParameters(
    ...maciParameters.asContractParam()
  )
  await setTx.wait()

  return maciFactory
}

/**
 * Set MACI parameters in the MACI factory
 * @param maciFactory
 * @param directory
 * @param circuit
 */
export async function setMaciParameters(
  maciFactory: Contract,
  directory: string,
  circuit = DEFAULT_CIRCUIT
): Promise<ContractTransactionResponse> {
  if (!isPathExist(directory)) {
    throw new Error(`Path ${directory} does not exists`)
  }
  const maciParameters = await MaciParameters.fromConfig(circuit, directory)
  const setMaciTx = await maciFactory.setMaciParameters(
    ...maciParameters.asContractParam()
  )
  await setMaciTx.wait()

  return setMaciTx
}

/**
 * Set Verifying key
 * @param vkRegistry VKRegistry contract
 * @param maciParameters MACI tree depths and verifying key information
 * @returns transaction response
 */
export async function setVerifyingKeys(
  vkRegistry: VkRegistry,
  params: MaciParameters
): Promise<ContractTransactionResponse> {
  const messageBatchSize = params.getMessageBatchSize()
  const tx = await vkRegistry.setVerifyingKeys(
    params.stateTreeDepth,
    params.treeDepths.intStateTreeDepth,
    params.treeDepths.messageTreeDepth,
    params.treeDepths.voteOptionTreeDepth,
    messageBatchSize,
    params.processVk.asContractParam() as IVerifyingKeyStruct,
    params.tallyVk.asContractParam() as IVerifyingKeyStruct
  )

  const receipt = await tx.wait()
  if (receipt?.status !== 1) {
    throw new Error('Failed to set verifying key; transaction receipt status 1')
  }
  return tx
}

/**
 * Set the coordinator address and maci public key in the funding round factory
 * @param fundingRoundFactory funding round factory contract
 * @param coordinatorAddress
 * @param MaciPrivateKey
 */
export async function setCoordinator({
  clrfundContract,
  coordinatorAddress,
  coordinatorMacisk,
}: {
  clrfundContract: Contract
  coordinatorAddress: string
  coordinatorMacisk?: string
}): Promise<ContractTransactionResponse> {
  // Generate or use the passed in coordinator key
  const privKey = coordinatorMacisk
    ? PrivKey.deserialize(coordinatorMacisk)
    : undefined

  const keypair = new Keypair(privKey)
  const coordinatorPubKey = keypair.pubKey
  const setCoordinatorTx = await clrfundContract.setCoordinator(
    coordinatorAddress,
    coordinatorPubKey.asContractParam()
  )
  return setCoordinatorTx
}
