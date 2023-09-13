import { ethers, config } from 'hardhat'
import { Signer, Contract, utils } from 'ethers'
import { link } from 'ethereum-waffle'
import path from 'path'
import { setVerifyingKeys, genProofs, proveOnChain } from '@clrfund/maci-cli'

import { readFileSync } from 'fs'

const userRegistryNames: Record<string, string> = {
  simple: 'SimpleUserRegistry',
  brightid: 'BrightIdUserRegistry',
  snapshot: 'SnapshotUserRegistry',
  merkle: 'MerkleUserRegistry',
}

export interface BrightIdParams {
  context: string
  verifierAddress: string
  sponsor: string
}

export interface PoseidonContracts {
  PoseidonT3Contract: Contract
  PoseidonT4Contract: Contract
  PoseidonT5Contract: Contract
  PoseidonT6Contract: Contract
}

/**
 * Return the brightid user registry contructor parameter values
 * @param userRegistryType user registry type
 * @returns BrightIdParams or null
 */
export function getBrightIdParams(
  userRegistryType: string
): BrightIdParams | null {
  if (userRegistryType === 'brightid') {
    const verifierAddress = process.env.BRIGHTID_VERIFIER_ADDR
    const sponsor = process.env.BRIGHTID_SPONSOR
    if (!verifierAddress) {
      throw new Error('Missing environment variable BRIGHTID_VERIFIER_ADDR')
    }
    if (!sponsor) {
      throw new Error('Missing environment variable BRIGHTID_SPONSOR')
    }

    return {
      context: process.env.BRIGHTID_CONTEXT || 'clr.fund',
      verifierAddress,
      sponsor,
    }
  } else {
    return null
  }
}

export function linkBytecode(
  bytecode: string,
  libraries: { [name: string]: string }
): string {
  // Workarounds for https://github.com/nomiclabs/buidler/issues/611
  const linkable = { evm: { bytecode: { object: bytecode } } }
  for (const [libraryName, libraryAddress] of Object.entries(libraries)) {
    link(linkable, libraryName, libraryAddress.toLowerCase())
  }
  return linkable.evm.bytecode.object
}

// custom configuration for MACI parameters.
export const CIRCUITS: { [name: string]: any } = {
  test: {
    batchUstVerifier: 'BatchUpdateStateTreeVerifier',
    qvtVerifier: 'QuadVoteTallyVerifier',
    treeDepths: {
      stateTreeDepth: 4,
      messageTreeDepth: 4,
      voteOptionTreeDepth: 2,
    },
    batchSizes: {
      tallyBatchSize: 4,
      messageBatchSize: 4,
    },
  },
  small: {
    batchUstVerifier: 'BatchUpdateStateTreeVerifierSmall',
    qvtVerifier: 'QuadVoteTallyVerifierSmall',
    treeDepths: {
      stateTreeDepth: 8,
      messageTreeDepth: 11,
      voteOptionTreeDepth: 3,
    },
    batchSizes: {
      tallyBatchSize: 4,
      messageBatchSize: 4,
    },
  },
  medium: {
    batchUstVerifier: 'BatchUpdateStateTreeVerifierMedium',
    qvtVerifier: 'QuadVoteTallyVerifierMedium',
    treeDepths: {
      stateTreeDepth: 9,
      messageTreeDepth: 13,
      voteOptionTreeDepth: 3,
    },
    batchSizes: {
      tallyBatchSize: 4,
      messageBatchSize: 4,
    },
  },
  x32: {
    batchUstVerifier: 'BatchUpdateStateTreeVerifier32',
    qvtVerifier: 'QuadVoteTallyVerifier32',
    treeDepths: {
      stateTreeDepth: 32,
      messageTreeDepth: 32,
      voteOptionTreeDepth: 3,
    },
    batchSizes: {
      tallyBatchSize: 8,
      messageBatchSize: 8,
    },
  },
  micro: {
    //https://github.com/privacy-scaling-explorations/maci/wiki/Precompiled-v1.1.1#micro-size
    processMessagesZkey: 'ProcessMessages_10-2-1-2_test.0.zkey',
    tallyVotesZkey: 'TallyVotes_10-1-2_test.0.zkey',
    treeDepths: {
      stateTreeDepth: 10,
      messageTreeDepth: 2,
      messageBatchTreeDepth: 1,
      voteOptionTreeDepth: 2,
      intStateTreeDepth: 1,
    },
  },
  //https://github.com/privacy-scaling-explorations/maci/wiki/Precompiled-v1.1.1#prod-size
  prod: {
    processMessagesZkey: 'ProcessMessages_7-9-3-4_test.0.zkey',
    tallyVotesZkey: 'TallyVotes_7-3-4_test.0.zkey',
    treeDepths: {
      stateTreeDepth: 7,
      messageTreeDepth: 9,
      messageBatchTreeDepth: 3,
      voteOptionTreeDepth: 4,
      intStateTreeDepth: 3,
    },
  },
}

type PoseidonName = 'PoseidonT3' | 'PoseidonT4' | 'PoseidonT5' | 'PoseidonT6'

/**
 * Deploy the PoseidonT3 or PoseidonT6 contracts. These 2 contracts
 * have a custom artifact location that the hardhat library cannot
 * retrieve using the standard getContractFactory() function, so, we manually
 * read the artifact content and pass to the getContractFactory function
 *
 * NOTE: there are 2 copies of the Poseidon artifacts, the one in the build/contracts
 * folder has the actual contract bytecode, the other one in the build/contracts/maci-contracts
 * only has the library interface. If the wrong bytecode is used to deploy the contract,
 * the hash functions will always return 0.
 *
 * @param account the account that deploys the contract
 * @param contractName PoseidonT3 or PoseidonT6
 * @returns contract object
 */
export async function deployPoseidon(
  account: Signer,
  contractName: PoseidonName
): Promise<Contract> {
  const artifact = JSON.parse(
    readFileSync(
      path.join(config.paths.artifacts, `${contractName}.json`)
    ).toString()
  )

  const Poseidon = await ethers.getContractFactory(
    artifact.abi,
    artifact.bytecode,
    account
  )

  return Poseidon.deploy()
}

export async function deployContract(
  account: Signer,
  contractName: string,
  contractArgs: any[] = []
): Promise<Contract> {
  const contractFactory = await ethers.getContractFactory(contractName, account)
  const contract = await contractFactory.deploy(...contractArgs)
  return await contract.deployed()
}

export async function deployVkRegistry(
  account: Signer,
  processVkPath: string,
  tallyVkPath: string,
  owner: string,
  circuit = 'micro'
): Promise<Contract> {
  const vkRegistry = await deployContract(account, 'VkRegistry')

  const params = CIRCUITS[circuit]

  await setVerifyingKeys({
    vk_registry: vkRegistry.address,
    state_tree_depth: params.treeDepths.stateTreeDepth,
    int_state_tree_depth: params.treeDepths.intStateTreeDepth,
    msg_tree_depth: params.treeDepths.messageTreeDepth,
    vote_option_tree_depth: params.treeDepths.voteOptionTreeDepth,
    msg_batch_depth: params.treeDepths.messageBatchTreeDepth,
    process_messages_zkey: processVkPath,
    tally_votes_zkey: tallyVkPath,
  })

  const ownerTx = await vkRegistry.transferOwnership(owner)
  await ownerTx.wait()

  return vkRegistry
}

export async function deployMaciFactory(account: Signer): Promise<Contract> {
  const poseidonContracts = await deployPoseidonContracts(account)

  const libraries = {
    PoseidonT3: poseidonContracts.PoseidonT3Contract.address,
    PoseidonT4: poseidonContracts.PoseidonT4Contract.address,
    PoseidonT5: poseidonContracts.PoseidonT5Contract.address,
    PoseidonT6: poseidonContracts.PoseidonT6Contract.address,
  }

  const MACIFactory = await ethers.getContractFactory('MACIFactory', {
    signer: account,
    libraries,
  })

  const maciFactory = await MACIFactory.deploy()
  await maciFactory.deployTransaction.wait()

  return maciFactory
}

export async function deployUserRegistry(
  userRegistryType: string,
  deployer: Signer,
  brightid: BrightIdParams | null
): Promise<Contract> {
  let userRegistry: Contract
  if (userRegistryType === 'brightid') {
    if (!brightid) {
      throw new Error('Missing BrightId parameter')
    }

    const BrightIdUserRegistry = await ethers.getContractFactory(
      'BrightIdUserRegistry',
      deployer
    )

    userRegistry = await BrightIdUserRegistry.deploy(
      utils.formatBytes32String(brightid.context),
      brightid.verifierAddress,
      brightid.sponsor
    )
  } else {
    const userRegistryName = userRegistryNames[userRegistryType]
    if (!userRegistryName) {
      throw new Error('unsupported user registry type: ' + userRegistryType)
    }

    const UserRegistry = await ethers.getContractFactory(
      userRegistryName,
      deployer
    )
    userRegistry = await UserRegistry.deploy()
  }

  await userRegistry.deployTransaction.wait()
  return userRegistry
}

/**
 * Get the zkey file path
 * @param name zkey file name
 * @returns zkey file path
 */
export function getZkeyFilePath(name: string): string {
  const config = JSON.parse(process.env.NODE_CONFIG || '')
  if (!config?.snarkParamsPath) {
    throw new Error(
      'Please set the env. variable NODE_CONFIG={"snarkParamsPath": "path-to-zkey-file"}'
    )
  }

  return path.join(config.snarkParamsPath, name)
}

/**
 * Deploy all the poseidon contracts
 *
 * @param signer The signer for the deployment transaction
 * @returns the deployed poseidon contracts
 */
export async function deployPoseidonContracts(
  signer: Signer
): Promise<PoseidonContracts> {
  const PoseidonT3Contract = await deployPoseidon(signer, 'PoseidonT3')
  const PoseidonT4Contract = await deployPoseidon(signer, 'PoseidonT4')
  const PoseidonT5Contract = await deployPoseidon(signer, 'PoseidonT5')
  const PoseidonT6Contract = await deployPoseidon(signer, 'PoseidonT6')

  return {
    PoseidonT3Contract,
    PoseidonT4Contract,
    PoseidonT5Contract,
    PoseidonT6Contract,
  }
}

export { proveOnChain, genProofs }
