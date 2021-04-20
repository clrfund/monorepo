import { getProfile } from '3box/lib/api'
import makeBlockie from 'ethereum-blockies-base64'
import { BigNumber, Contract } from 'ethers'
import { Web3Provider } from '@ethersproject/providers'

import { UserRegistry, ERC20 } from './abi'
import { factory, ipfsGatewayUrl, provider, mainnetProvider } from './core'

export const LOGIN_MESSAGE = `Sign this message to access clr.fund at ${factory.address.toLowerCase()}.`

export interface User {
  walletAddress: string;
  walletProvider: Web3Provider;
  encryptionKey: string;
  isVerified: boolean | null;
  balance: BigNumber | null;
  etherBalance: BigNumber | null;
}

export async function getProfileImageUrl(walletAddress: string): Promise<string | null> {
  let profileImageHash: string
  try {
    const profile = await getProfile(walletAddress)
    profileImageHash = profile.image[0].contentUrl['/']
  } catch (error) {
    return makeBlockie(walletAddress)
  }
  return `${ipfsGatewayUrl}/ipfs/${profileImageHash}`
}

export async function isVerifiedUser(
  userRegistryAddress: string,
  walletAddress: string,
): Promise<boolean> {
  const registry = new Contract(userRegistryAddress, UserRegistry, provider)
  return await registry.isVerifiedUser(walletAddress)
}

export async function getTokenBalance(
  tokenAddress: string,
  walletAddress: string,
): Promise<BigNumber> {
  const token = new Contract(tokenAddress, ERC20, provider)
  return await token.balanceOf(walletAddress)
}

export async function getEtherBalance(
  walletAddress: string,
): Promise<BigNumber> {
  return await provider.getBalance(walletAddress)
}

export async function getENS(
  walletAddress: string,
): Promise<string> {
  // Requires Mainnet provider to fetch ENS names (local hardhat won't work)
  // Demo: Replace walletAddress below with '0x8ba1f109551bD432803012645Ac136ddd64DBA72'
  // When logged in, will display: registrar.firefly.eth
  // return await mainnetProvider.lookupAddress(walletAddress)
  return await mainnetProvider.lookupAddress('0x8ba1f109551bD432803012645Ac136ddd64DBA72')
}

export async function resolveENS(
  ens: string,
): Promise<string> {
  // Requires Mainnet provider to fetch ENS names (local hardhat won't work)
  return await mainnetProvider.resolveName(ens)
}
