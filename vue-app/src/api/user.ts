import makeBlockie from 'ethereum-blockies-base64'
import { BigNumber, Contract, Signer, type ContractTransaction } from 'ethers'
import type { Web3Provider } from '@ethersproject/providers'

import { UserRegistry, ERC20 } from './abi'
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
 * @param signer The signer
 * @returns The contract transaction
 */
export async function registerSnapshotUser(registryAddress: string, signer: Signer): Promise<ContractTransaction> {
  const registry = new Contract(registryAddress, SnapshotUserRegistry, signer)
  const [tokenAddress, blockHash, storageSlot] = await Promise.all([
    registry.token(),
    registry.blockHash(),
    registry.storageSlot(),
  ])

  const walletAddress = await signer.getAddress()
  const proof = await getStorageProof(tokenAddress, blockHash, walletAddress, storageSlot, provider)
  const proofRlpBytes = rlpEncodeProof(proof.storageProof[0].proof)

  return registry.addUser(walletAddress, proofRlpBytes)
}

/**
 * Register a user in the merkle user registry
 * @param registryAddress The merkle user registry
 * @param signer The user to be registered
 * @returns The contract transaction
 */
export async function registerMerkleUser(registryAddress: string, signer: Signer): Promise<ContractTransaction> {
  const registry = new Contract(registryAddress, MerkleUserRegistry, signer)
  const merkleHash = await registry.merkleHash()

  const treeRaw = await getIpfsContent(merkleHash, ipfsGatewayUrl)
  const tree = StandardMerkleTree.load(treeRaw)
  const walletAddress = await signer.getAddress()
  const proof = await getUserMerkleProof(walletAddress, tree)
  if (!proof) {
    throw new Error('User is not authorized')
  }

  return registry.addUser(walletAddress, proof)
}
