import makeBlockie from 'ethereum-blockies-base64'
import { BigNumber, Contract } from 'ethers'
import { Web3Provider } from '@ethersproject/providers'

import { UserRegistry, ERC20 } from './abi'
import { chainId, ipfsGatewayUrl, provider, operator } from './core'
import { BrightId } from './bright-id'

// contractAddress should be the round address, if not available, use funding round factory address
export function getLoginMessage(contractAddress: string): string {
  return `Welcome to ${operator}!

To get logged in, sign this message to prove you have access to this wallet. This does not cost any ether.

You will be asked to sign each time you load the app.

Contract address: ${contractAddress.toLowerCase()}.

Chain ID: ${chainId}`
}

export interface User {
  walletAddress: string
  walletProvider: Web3Provider
  encryptionKey: string
  brightId?: BrightId
  isRegistered: boolean // If is in user registry
  balance?: BigNumber | null
  etherBalance?: BigNumber | null
  contribution?: BigNumber | null
  ensName?: string | null
  votedInPreviousRounds?: boolean
}

export async function getProfileImageUrl(
  walletAddress: string
): Promise<string | null> {
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

export async function isVerifiedUser(
  userRegistryAddress: string,
  walletAddress: string
): Promise<boolean> {
  const registry = new Contract(userRegistryAddress, UserRegistry, provider)
  return await registry.isVerifiedUser(walletAddress)
}

export async function getTokenBalance(
  tokenAddress: string,
  walletAddress: string
): Promise<BigNumber> {
  const token = new Contract(tokenAddress, ERC20, provider)
  return await token.balanceOf(walletAddress)
}

export async function getEtherBalance(
  walletAddress: string
): Promise<BigNumber> {
  return await provider.getBalance(walletAddress)
}
