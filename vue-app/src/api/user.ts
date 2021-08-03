import makeBlockie from 'ethereum-blockies-base64'
import { BigNumber, Contract } from 'ethers'
import { Web3Provider } from '@ethersproject/providers'

import { UserRegistry, ERC20 } from './abi'
import { factory, ipfsGatewayUrl, provider } from './core'
import { BrightIdError, getVerification } from './bright-id'

export const LOGIN_MESSAGE = `Sign this message to access clr.fund at ${factory.address.toLowerCase()}.`

export interface BrightId {
  isLinked: boolean
  isSponsored: boolean
  isVerified: boolean // If is verified in BrightID
}
export interface User {
  walletAddress: string
  walletProvider: Web3Provider
  encryptionKey: string
  brightId: BrightId
  isRegistered: boolean // If is in user registry
  balance?: BigNumber | null
  etherBalance?: BigNumber | null
  contribution?: BigNumber | null
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

export async function getBrightId(contextId: string): Promise<BrightId> {
  const brightId: BrightId = {
    isLinked: false,
    isSponsored: false,
    isVerified: false,
  }

  try {
    await getVerification(contextId)
    brightId.isLinked = true
    brightId.isSponsored = true
    brightId.isVerified = true
  } catch (error) {
    if (!(error instanceof BrightIdError)) {
      /* eslint-disable-next-line no-console */
      console.error(error)
    }

    // Not verified user
    if (error.code === 3) {
      brightId.isLinked = true
      brightId.isSponsored = true
    }

    // Not sponsored user
    if (error.code === 4) {
      brightId.isLinked = true
    }
  }

  return brightId
}
