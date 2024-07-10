import { clrfundContractAddress, clrFundContract, provider } from './core'
import sdk from '@/graphql/sdk'
import { ERC20 } from './abi'
import { Contract } from 'ethers'

export interface ClrFund {
  nativeTokenAddress: string
  nativeTokenSymbol: string
  nativeTokenDecimals: number
  userRegistryAddress: string
  recipientRegistryAddress: string
  matchingPool: bigint
}

export async function getClrFundInfo() {
  let nativeTokenAddress = ''
  let nativeTokenSymbol = ''
  let nativeTokenDecimals = 0
  let matchingPool = BigInt(0)
  let userRegistryAddress = ''
  let recipientRegistryAddress = ''

  nativeTokenAddress = await clrFundContract.nativeToken().catch(() => '')
  const nativeTokenContract = new Contract(nativeTokenAddress, ERC20, provider)
  nativeTokenSymbol = await nativeTokenContract.symbol().catch(() => '')
  nativeTokenDecimals = await nativeTokenContract.decimals().catch(() => 0)
  userRegistryAddress = await clrFundContract.userRegistry().catch(() => '')
  recipientRegistryAddress = await clrFundContract.recipientRegistry().catch(() => '')

  try {
    matchingPool = await getMatchingFunds(nativeTokenAddress)
  } catch (err) {
    /* eslint-disable-next-line no-console */
    console.error('Failed to get matching pool', err)
  }

  return {
    nativeTokenAddress,
    nativeTokenSymbol,
    nativeTokenDecimals,
    userRegistryAddress,
    recipientRegistryAddress,
    matchingPool,
  }
}

export async function getMatchingFunds(nativeTokenAddress: string): Promise<bigint> {
  const matchingFunds = await clrFundContract.getMatchingFunds(nativeTokenAddress)
  return matchingFunds
}
