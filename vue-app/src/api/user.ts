import { getProfile } from '3box/lib/api'
import makeBlockie from 'ethereum-blockies-base64'
import { Web3Provider } from '@ethersproject/providers'

import { ipfsGatewayUrl } from './core'

export interface User {
  walletAddress: string;
  walletProvider: Web3Provider;
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
