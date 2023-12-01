import { BigNumber } from 'ethers'
import { clrFundContract } from './core'
import sdk from '@/graphql/sdk'

export interface ClrFund {
  nativeTokenAddress: string
  nativeTokenSymbol: string
  nativeTokenDecimals: number
  userRegistryAddress: string
  recipientRegistryAddress: string
  matchingPool: BigNumber
}

export async function getClrFundInfo() {
  let nativeTokenAddress = ''
  let nativeTokenSymbol = ''
  let nativeTokenDecimals = 0
  let matchingPool = BigNumber.from(0)
  let userRegistryAddress = ''
  let recipientRegistryAddress = ''

  try {
    const data = await sdk.GetClrFundInfo({
      clrFundAddress: clrFundContract.address.toLowerCase(),
    })

    const nativeTokenInfo = data.clrFund?.nativeTokenInfo
    if (nativeTokenInfo) {
      nativeTokenAddress = nativeTokenInfo.tokenAddress || ''
      nativeTokenSymbol = nativeTokenInfo.symbol || ''
      nativeTokenDecimals = Number(nativeTokenInfo.decimals) || 0
    }

    userRegistryAddress = data.clrFund?.contributorRegistryAddress || ''
    recipientRegistryAddress = data.clrFund?.recipientRegistryAddress || ''
  } catch (err) {
    /* eslint-disable-next-line no-console */
    console.error('Failed GetClrFundInfo', err)
  }

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

export async function getMatchingFunds(nativeTokenAddress: string): Promise<BigNumber> {
  const matchingFunds = await clrFundContract.getMatchingFunds(nativeTokenAddress)
  return matchingFunds
}
