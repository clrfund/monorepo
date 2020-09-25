import { getProfile } from '3box/lib/api'
import makeBlockie from 'ethereum-blockies-base64'

import { ipfsGatewayUrl } from './core'

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
