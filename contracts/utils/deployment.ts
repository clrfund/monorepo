import { Signer, Contract, utils, BigNumber } from 'ethers'
import { link } from 'ethereum-waffle'
import path from 'path'

import { readFileSync } from 'fs'
import { HardhatEthersHelpers } from '@nomiclabs/hardhat-ethers/types'

// Number.MAX_SAFE_INTEGER - 1
export const challengePeriodSeconds = '9007199254740990'

export type Libraries = { [name: string]: string }

// Mapping of the user registry type and the contract name
const userRegistryNames: Record<string, string> = {
  simple: 'SimpleUserRegistry',
  brightid: 'BrightIdUserRegistry',
  snapshot: 'SnapshotUserRegistry',
  merkle: 'MerkleUserRegistry',
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

export function linkBytecode(bytecode: string, libraries: Libraries): string {
  // Workarounds for https://github.com/nomiclabs/buidler/issues/611
  const linkable = { evm: { bytecode: { object: bytecode } } }
  for (const [libraryName, libraryAddress] of Object.entries(libraries)) {
    link(linkable, libraryName, libraryAddress.toLowerCase())
  }
  return linkable.evm.bytecode.object
}

type PoseidonName = 'PoseidonT3' | 'PoseidonT4' | 'PoseidonT5' | 'PoseidonT6'

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

  return Poseidon.deploy()
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
  const contractFactory = await ethers.getContractFactory(name, {
    signer,
    libraries,
  })

  const contract = await contractFactory.deploy(...contractArgs)
  return await contract.deployed()
}

/**
 * Deploy a user registry
 * @param userRegistryType  user registry type, e.g. brightid, simple, etc
 * @param ethers Hardhat ethers handle
 * @param brightid Brightid parameters for the BrightID user registry
 * @returns the newly deployed user registry contract
 */
export async function deployUserRegistry(
  userRegistryType: string,
  ethers: HardhatEthersHelpers,
  brightid?: BrightIdParams
): Promise<Contract> {
  let userRegistry: Contract
  const [signer] = await ethers.getSigners()

  const lowercaseType = (userRegistryType || '').toLowerCase()
  if (lowercaseType === 'brightid') {
    if (!brightid) {
      throw new Error('Missing BrightId parameter')
    }

    const BrightIdUserRegistry = await ethers.getContractFactory(
      'BrightIdUserRegistry',
      signer
    )

    userRegistry = await BrightIdUserRegistry.deploy(
      utils.formatBytes32String(brightid.context),
      brightid.verifierAddress,
      brightid.sponsor
    )
  } else {
    const userRegistryName = userRegistryNames[lowercaseType]
    if (!userRegistryName) {
      throw new Error('unsupported user registry type: ' + lowercaseType)
    }

    const UserRegistry = await ethers.getContractFactory(
      userRegistryName,
      signer
    )
    userRegistry = await UserRegistry.deploy()
  }

  await userRegistry.deployTransaction.wait()
  return userRegistry
}

/**
 * Deploy a recipient registry
 * @param type  recipient registry type, e.g. simple, optimistic, etc
 * @param controller the controller address of the registry
 * @param ethers Hardhat ethers handle
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
  deposit?: BigNumber
  challengePeriod?: string
  ethers: HardhatEthersHelpers
  signer?: Signer
}): Promise<Contract> {
  const lowercaseType = (type || '').toLowerCase()
  const registryName = recipientRegistries[lowercaseType]
  if (!registryName) {
    throw new Error('Unsupported recipient registry type: ' + type)
  }

  if (lowercaseType === 'optimistic') {
    if (!deposit) {
      throw new Error('Missing base deposit amount')
    }
    if (!challengePeriod) {
      throw new Error('Missing challenge period')
    }
  }

  const args =
    lowercaseType === 'simple'
      ? [controller]
      : [deposit, challengePeriod, controller]

  const factory = await ethers.getContractFactory(registryName, signer)
  const recipientRegistry = await factory.deploy(...args)

  return await recipientRegistry.deployed()
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
    PoseidonT3: PoseidonT3Contract.address,
    PoseidonT4: PoseidonT4Contract.address,
    PoseidonT5: PoseidonT5Contract.address,
    PoseidonT6: PoseidonT6Contract.address,
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
 * Deploy the contracts needed to run the proveOnChain script.
 * If the poseidon contracts are not provided, it will create them
 * using the byte codes in the artifactsPath
 *
 * libraries - poseidon libraries
 * artifactsPath - path that contacts the poseidon abi and bytecode
 *
 * @returns the MessageProcessor and Tally contracts
 */
export async function deployMessageProcesorAndTally({
  artifactsPath,
  libraries,
  ethers,
  signer,
}: {
  libraries?: Libraries
  artifactsPath?: string
  signer?: Signer
  ethers: HardhatEthersHelpers
}): Promise<{
  mpContract: Contract
  tallyContract: Contract
}> {
  if (!libraries) {
    if (!artifactsPath) {
      throw Error('Need the artifacts path to create the poseidon contracts')
    }
    libraries = await deployPoseidonLibraries({
      artifactsPath,
      ethers,
      signer,
    })
  }

  const verifierContract = await deployContract({
    name: 'Verifier',
    signer,
    ethers,
  })
  const tallyContract = await deployContract({
    name: 'Tally',
    contractArgs: [verifierContract.address],
    libraries,
    ethers,
    signer,
  })

  // deploy the message processing contract
  const mpContract = await deployContract({
    name: 'MessageProcessor',
    contractArgs: [verifierContract.address],
    signer,
    libraries,
    ethers,
  })

  return {
    mpContract,
    tallyContract,
  }
}

/**
 * Deploy an instance of MACI factory
 *
 * libraries - poseidon contracts
 * ethers - hardhat ethers handle
 * signer - if signer is not provided, use default signer in ethers
 *
 * @returns MACI factory contract
 */
export async function deployMaciFactory({
  libraries,
  ethers,
  signer,
}: {
  libraries: Libraries
  ethers: HardhatEthersHelpers
  signer?: Signer
}): Promise<Contract> {
  const pollFactory = await deployContract({
    name: 'PollFactory',
    libraries,
    ethers,
    signer,
  })

  const vkRegistry = await deployContract({
    name: 'VkRegistry',
    ethers,
    signer,
  })

  const maciFactory = await deployContract({
    name: 'MACIFactory',
    libraries,
    contractArgs: [vkRegistry.address, pollFactory.address],
    ethers,
    signer,
  })

  const transferTx = await vkRegistry.transferOwnership(maciFactory.address)
  await transferTx.wait()

  return maciFactory
}
