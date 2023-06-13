import { FixedNumber } from 'ethers'
import { factory } from './core'
import sdk from '@/graphql/sdk'

export interface Factory {
  fundingRoundAddress: string
  nativeTokenAddress: string
  nativeTokenSymbol: string
  nativeTokenDecimals: number
  userRegistryAddress: string
  matchingPool: FixedNumber
}

export async function getFactoryInfo() {
  let nativeTokenAddress = ''
  let nativeTokenSymbol = ''
  let nativeTokenDecimals = 0
  let matchingPool = FixedNumber.from(0)
  let userRegistryAddress = ''
  let recipientRegistryAddress = ''

  try {
    const data = await sdk.GetFactoryInfo({
      factoryAddress: factory.address.toLowerCase(),
    })

    const nativeTokenInfo = data.fundingRoundFactory?.nativeTokenInfo
    if (nativeTokenInfo) {
      nativeTokenAddress = nativeTokenInfo.tokenAddress || ''
      nativeTokenSymbol = nativeTokenInfo.symbol || ''
      nativeTokenDecimals = Number(nativeTokenInfo.decimals) || 0
    }

    userRegistryAddress = data.fundingRoundFactory?.contributorRegistryAddress || ''
    recipientRegistryAddress = data.fundingRoundFactory?.recipientRegistryAddress || ''
  } catch (err) {
    /* eslint-disable-next-line no-console */
    console.error('Failed GetFactoryInfo', err)
  }

  try {
    matchingPool = await getMatchingFunds(nativeTokenAddress, nativeTokenDecimals)
  } catch (err) {
    /* eslint-disable-next-line no-console */
    console.error('Failed to get matching pool', err)
  }

  return {
    fundingRoundAddress: factory.address,
    nativeTokenAddress,
    nativeTokenSymbol,
    nativeTokenDecimals,
    userRegistryAddress,
    recipientRegistryAddress,
    matchingPool,
  }
}

export async function getMatchingFunds(nativeTokenAddress: string, nativeTokenDecimals: number): Promise<FixedNumber> {
  const matchingFunds = await factory.getMatchingFunds(nativeTokenAddress)
  return FixedNumber.fromValue(matchingFunds, nativeTokenDecimals)
}
