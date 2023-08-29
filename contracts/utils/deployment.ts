import { ethers, config } from 'hardhat'
import { Libraries } from 'hardhat/types/runtime'
import { Signer, Contract, utils } from 'ethers'
import { link } from 'ethereum-waffle'
import path from 'path'

import { MaciParameters } from './maci'
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
  prod: {
    batchUstVerifier: 'BatchUpdateStateTreeVerifierBatch64',
    qvtVerifier: 'QuadVoteTallyVerifierBatch64',
    treeDepths: {
      stateTreeDepth: 32,
      messageTreeDepth: 32,
      voteOptionTreeDepth: 3,
    },
    batchSizes: {
      tallyBatchSize: 64,
      messageBatchSize: 64,
    },
  },
}

type PoseidonName = 'PoseidonT3' | 'PoseidonT6'

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

interface MaciFactoryDependencies {
  poseidonT3?: Contract
  poseidonT6?: Contract
  batchUstVerifier?: Contract
  qvtVerifier?: Contract
}

export async function deployMaciFactory(
  account: Signer,
  circuit = 'x32',
  {
    poseidonT3,
    poseidonT6,
    batchUstVerifier,
    qvtVerifier,
  }: MaciFactoryDependencies = {}
): Promise<Contract> {
  if (!poseidonT3) {
    poseidonT3 = await deployPoseidon(account, 'PoseidonT3')
  }
  if (!poseidonT6) {
    poseidonT6 = await deployPoseidon(account, 'PoseidonT6')
  }
  if (!batchUstVerifier) {
    const BatchUstVerifier = await ethers.getContractFactory(
      CIRCUITS[circuit].batchUstVerifier,
      account
    )
    batchUstVerifier = await BatchUstVerifier.deploy()
  }
  if (!qvtVerifier) {
    const QvtVerifier = await ethers.getContractFactory(
      CIRCUITS[circuit].qvtVerifier,
      account
    )
    qvtVerifier = await QvtVerifier.deploy()
  }

  const maciLibraries: Libraries = {
    'maci-contracts/sol/Poseidon.sol:PoseidonT3': poseidonT3.address,
    'maci-contracts/sol/Poseidon.sol:PoseidonT6': poseidonT6.address,
  }

  const MACIFactory = await ethers.getContractFactory('MACIFactory', {
    signer: account,
    libraries: maciLibraries,
  })
  const maciParameters = new MaciParameters({
    batchUstVerifier: batchUstVerifier.address,
    qvtVerifier: qvtVerifier.address,
    ...CIRCUITS[circuit].treeDepths,
    ...CIRCUITS[circuit].batchSizes,
  })

  const maciFactory = await MACIFactory.deploy(...maciParameters.values())
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
