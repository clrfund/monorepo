import makeBlockie from 'ethereum-blockies-base64'
import { BigNumber, Contract, Signer, type ContractTransaction } from 'ethers'
import type { Web3Provider } from '@ethersproject/providers'

import { FundingRound, UserRegistry, ERC20 } from './abi'
import { factory, ipfsGatewayUrl, provider, operator } from './core'
import type { BrightId } from './bright-id'
import { SnapshotUserRegistry, MerkleUserRegistry } from './abi'
import {
  getUserMerkleProof,
  getStorageProof,
  rlpEncodeProof,
  getIpfsContent,
  StandardMerkleTree,
} from '@clrfund/common'

//TODO: update anywhere this is called to take factory address as a parameter, default to env. variable
export const LOGIN_MESSAGE = `Welcome to ${operator}!

To get logged in, sign this message to prove you have access to this wallet. This does not cost any ether.

You will be asked to sign each time you load the app.

Contract address: ${factory.address.toLowerCase()}.`

export interface User {
  walletAddress: string
  walletProvider: Web3Provider
  encryptionKey?: string
  brightId?: BrightId
  isRegistered?: boolean // If is in user registry
  balance?: BigNumber | null
  etherBalance?: BigNumber | null
  contribution?: BigNumber | null
  ensName?: string | null
}

export async function getProfileImageUrl(walletAddress: string): Promise<string | null> {
  const threeBoxProfileUrl = `https://ipfs.3box.io/profile?address=${walletAddress}`
  let profileImageHash: string
  try {
    const response = await fetch(threeBoxProfileUrl)
    const profile = await response.json()
    profileImageHash = profile.image[0].contentUrl['/']
  } catch (error) {
    return makeBlockie(walletAddress)
  }
  return `${ipfsGatewayUrl}/ipfs/${profileImageHash}`
}

export async function isVerifiedUser(userRegistryAddress: string, walletAddress: string): Promise<boolean> {
  const registry = new Contract(userRegistryAddress, UserRegistry, provider)
  return await registry.isVerifiedUser(walletAddress)
}

export async function isRegisteredUser(fundingRoundAddress: string, walletAddress: string): Promise<boolean> {
  const round = new Contract(fundingRoundAddress, FundingRound, provider)
  const contributor = await round.contributors(walletAddress)
  return contributor.isRegistered
}

export async function getTokenBalance(tokenAddress: string, walletAddress: string): Promise<BigNumber> {
  const token = new Contract(tokenAddress, ERC20, provider)
  return await token.balanceOf(walletAddress)
}

export async function getEtherBalance(walletAddress: string): Promise<BigNumber> {
  return await provider.getBalance(walletAddress)
}

/**
 * Register a user in the Snapshot user registry
 * @param registryAddress The snapshot user registry contract address
 * @param proofRlpBytes The RLP encoded proof
 * @param signer The signer
 * @returns The contract transaction
 */
export async function registerUserSnapshot(
  registryAddress: string,
  proofRlpBytes: string,
  signer: Signer,
): Promise<ContractTransaction> {
  const registry = new Contract(registryAddress, SnapshotUserRegistry, signer)
  const walletAddress = await signer.getAddress()
  return registry.addUser(walletAddress, proofRlpBytes)
}

/**
 * Get the snapshot proof for the signer
 * @param registryAddress Th snapshot user registry address
 * @param signer Th user to get the proof for
 * @returns RLP encoded proof
 */
export async function getProofSnapshot(registryAddress: string, signer: Signer) {
  const registry = new Contract(registryAddress, SnapshotUserRegistry, signer)
  const [tokenAddress, blockHash, storageSlot] = await Promise.all([
    registry.token(),
    registry.blockHash(),
    registry.storageSlot(),
  ])

  const walletAddress = await signer.getAddress()
  const proof = await getStorageProof(tokenAddress, blockHash, walletAddress, storageSlot, provider)
  return rlpEncodeProof(proof.storageProof[0].proof)
}

/**
 * Register a user in the merkle user registry
 * @param registryAddress The merkle user registry
 * @param proof The merkle proof
 * @param signer The user to be registered
 * @returns The contract transaction
 */
export async function registerUserMerkle(
  registryAddress: string,
  proof: string[],
  signer: Signer,
): Promise<ContractTransaction> {
  const registry = new Contract(registryAddress, MerkleUserRegistry, signer)
  const walletAddress = await signer.getAddress()
  return registry.addUser(walletAddress, proof)
}

/**
 * Get the merkle proof for the signer
 * @param registryAddress The merkle user registry
 * @param signer The user to get the proof for
 * @returns proof
 */
export async function getProofMerkle(registryAddress: string, signer: Signer): Promise<string[] | null> {
  const registry = new Contract(registryAddress, MerkleUserRegistry, signer)
  const merkleHash = await registry.merkleHash()
  if (!merkleHash) {
    throw new Error('User registry is not initialized, missing merkle hash')
  }

  const treeRaw = await getIpfsContent(merkleHash, ipfsGatewayUrl)
  const tree = StandardMerkleTree.load(treeRaw)
  const walletAddress = await signer.getAddress()
  return getUserMerkleProof(walletAddress, tree)
}
