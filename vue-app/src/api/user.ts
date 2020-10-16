import { getProfile } from '3box/lib/api'
import makeBlockie from 'ethereum-blockies-base64'
import { Contract } from 'ethers'
import { Web3Provider } from '@ethersproject/providers'

import { FundingRound, VerifiedUserRegistry } from './abi'
import { ipfsGatewayUrl, provider } from './core'

export interface User {
  walletAddress: string;
  walletProvider: Web3Provider;
  isVerified: boolean | null;
  encryptionKey: string;
}

export async function getProfileImageUrl(walletAddress: string): Promise<string | null> {
  let profileImageHash: string
  try {
    const profile = await getProfile(walletAddress)
    profileImageHash = profile.image[0].contentUrl['/']
  } catch (error) {
    return makeBlockie(walletAddress)
  }
  return `${ipfsGatewayUrl}${profileImageHash}`
}

export async function isVerifiedUser(
  fundingRoundAddress: string,
  walletAddress: string,
): Promise<boolean> {
  const fundingRound = new Contract(
    fundingRoundAddress,
    FundingRound,
    provider,
  )
  const registryAddress = await fundingRound.verifiedUserRegistry()
  const registry = new Contract(registryAddress, VerifiedUserRegistry, provider)
  return await registry.isVerifiedUser(walletAddress)
}
