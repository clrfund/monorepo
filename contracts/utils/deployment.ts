import { ethers, config } from 'hardhat'
import { Signer, Contract, utils } from 'ethers'
import { link } from 'ethereum-waffle'
import path from 'path'
import { setVerifyingKeys, genProofs, proveOnChain } from '@clrfund/maci-cli'

import { readFileSync } from 'fs'

const TREE_ARITY = 5

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

// custom configuration for MACI parameters
export const CIRCUITS: { [name: string]: any } = {
  // TODO: check if the maci v1 only supports micro based on the following comment:
  // https://github.com/privacy-scaling-explorations/maci/blob/master/contracts/contracts/MACI.sol#L25
  micro: {
    //https://github.com/privacy-scaling-explorations/maci/wiki/Precompiled-v1.1.1#micro-size
    processMessagesZkey: 'ProcessMessages_10-2-1-2_test.0.zkey',
    tallyVotesZkey: 'TallyVotes_10-1-2_test.0.zkey',
    treeDepths: {
      // TODO: confirm if the following 4 parameters are the 4 parameters in processMessages.circom
      stateTreeDepth: 10,
      messageTreeDepth: 2,
      // TODO: confirm if messageBatchTreeDepth is the same as _messageTreeSubDepth in TreeDepths.
      // see https://github.com/clrfund/maci-v1/blob/b5ea1ed4a10c14dc133f8d61e886120cda240003/cli/ts/deployPoll.ts#L153
      // TODO: is messageBatchTreeDepth == intStateTreeDepth??
      messageTreeSubDepth: 1,
      voteOptionTreeDepth: 2,
      // TODO: confirm if intStateTreeDepth is the 2nd param in tallyVotes.circom
      intStateTreeDepth: 1,
    },
    maxValues: {
      // maxMessages and maxVoteOptions are calculated using treeArity = 5 as seen in the following code:
      // https://github.com/privacy-scaling-explorations/maci/blob/master/contracts/contracts/Poll.sol#L115
      // treeArity ** messageTreeDepth
      maxMessages: TREE_ARITY ** 2,
      // treeArity ** voteOptionTreeDepth
      maxVoteOptions: TREE_ARITY ** 2,
    },
    batchSizes: {
      // TODO: confirm the following mapping
      // https://github.com/privacy-scaling-explorations/maci/blob/master/contracts/contracts/MACI.sol#L259
      // treeArity ** messageBatchTreeDepth
      messageBatchSize: TREE_ARITY ** 1,
    },
  },
  //https://github.com/privacy-scaling-explorations/maci/wiki/Precompiled-v1.1.1#prod-size
  prod: {
    processMessagesZkey: 'ProcessMessages_7-9-3-4_test.0.zkey',
    tallyVotesZkey: 'TallyVotes_7-3-4_test.0.zkey',
    treeDepths: {
      stateTreeDepth: 7,
      messageTreeDepth: 9,
      messageTreeSubDepth: 3,
      voteOptionTreeDepth: 4,
      intStateTreeDepth: 3,
    },
    maxValues: {
      maxMessages: TREE_ARITY ** 9,
      maxVoteOptions: TREE_ARITY ** 4,
    },
    batchSizes: {
      // TODO: confirm the following mapping
      // https://github.com/privacy-scaling-explorations/maci/blob/master/contracts/contracts/MACI.sol#L259
      // treeArity ** messageBatchTreeDepth
      messageBatchSize: TREE_ARITY ** 3,
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

/**
 * Deploy and set the PollProcessorAndTallyer in the funding round
 * @param coordinator The coordinator who can set the set the tallyer in the funding round
 * @param fundingRound The funding round contract
 * @returns
 */
export async function deployPollProcessorAndTallyer(
  coordinator: Signer,
  fundingRound: Contract
): Promise<Contract> {
  const verifier = await deployContract(coordinator, 'Verifier')
  const ppt = await deployContract(coordinator, 'PollProcessorAndTallyer', [
    verifier.address,
  ])
  const setPptTx = await fundingRound
    .connect(coordinator)
    .setTallyer(ppt.address)
  await setPptTx.wait()
  return ppt
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

export async function deployMaciFactory(
  account: Signer,
  poseidonContracts: { [name: string]: string }
): Promise<Contract> {
  const pollFactoryCreator = await deployContractWithLinkedLibraries(
    account,
    'PollFactoryCreator',
    { ...poseidonContracts }
  )
  const messageAqFactoryCreator = await deployContractWithLinkedLibraries(
    account,
    'MessageAqFactoryCreator',
    { ...poseidonContracts }
  )

  const vkRegistry = await deployContract(account, 'VkRegistry')
  const MACIFactory = await ethers.getContractFactory('MACIFactory', {
    signer: account,
    libraries: {
      ...poseidonContracts,
      PollFactoryCreator: pollFactoryCreator.address,
      MessageAqFactoryCreator: messageAqFactoryCreator.address,
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

export { proveOnChain, genProofs }
