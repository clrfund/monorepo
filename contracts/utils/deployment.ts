import { ethers, config } from 'hardhat'
import { Signer, Contract, utils } from 'ethers'
import { link } from 'ethereum-waffle'
import path from 'path'
import {
  mergeMessages,
  mergeSignups,
  genProofs,
  proveOnChain,
} from '@clrfund/maci-cli'

import { readFileSync } from 'fs'
import { MaciParameters } from './maci'
import { CIRCUTIS } from './circuits'

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

export async function deployContractWithLinkedLibraries(
  signer: Signer,
  contractName: string,
  libraries: { [name: string]: string },
  contractArgs: any[] = []
): Promise<Contract> {
  const contractFactory = await ethers.getContractFactory(contractName, {
    signer,
    libraries,
  })
  const contract = await contractFactory.deploy(...contractArgs)
  return await contract.deployed()
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
  owner: string,
  params: MaciParameters
): Promise<Contract> {
  const vkRegistry = await deployContract(account, 'VkRegistry')

  const setKeyTx = await vkRegistry.setVerifyingKeys(
    params.stateTreeDepth,
    params.intStateTreeDepth,
    params.messageTreeDepth,
    params.voteOptionTreeDepth,
    params.messageBatchSize,
    params.processVk.asContractParam(),
    params.tallyVk.asContractParam()
  )
  await setKeyTx.wait()

  const ownerTx = await vkRegistry.transferOwnership(owner)
  await ownerTx.wait()

  return vkRegistry
}

export async function deployMaciFactory(
  account: Signer,
  poseidonContracts: { [name: string]: string }
): Promise<Contract> {
  const pollFactoryCreator = await deployContractWithLinkedLibraries(
    account,
    'PollFactoryCreator',
    { ...poseidonContracts }
  )

  const vkRegistry = await deployContract(account, 'VkRegistry')
  const MACIFactory = await ethers.getContractFactory('MACIFactory', {
    signer: account,
    libraries: {
      ...poseidonContracts,
      PollFactoryCreator: pollFactoryCreator.address,
    },
  })

  const maciFactory = await MACIFactory.deploy(vkRegistry.address)
  await maciFactory.deployTransaction.wait()

  const transferTx = await vkRegistry.transferOwnership(maciFactory.address)
  await transferTx.wait()

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
 * Deploy all the poseidon contracts
 *
 * @param signer The signer for the deployment transaction
 * @returns the deployed poseidon contracts
 */
export async function deployPoseidonLibraries(
  signer: Signer
): Promise<{ [name: string]: string }> {
  const PoseidonT3Contract = await deployPoseidon(signer, 'PoseidonT3')
  const PoseidonT4Contract = await deployPoseidon(signer, 'PoseidonT4')
  const PoseidonT5Contract = await deployPoseidon(signer, 'PoseidonT5')
  const PoseidonT6Contract = await deployPoseidon(signer, 'PoseidonT6')

  const libraries = {
    PoseidonT3: PoseidonT3Contract.address,
    PoseidonT4: PoseidonT4Contract.address,
    PoseidonT5: PoseidonT5Contract.address,
    PoseidonT6: PoseidonT6Contract.address,
  }
  return libraries
}

export { mergeMessages, mergeSignups, proveOnChain, genProofs }
