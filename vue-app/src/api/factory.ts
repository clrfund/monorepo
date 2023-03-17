import { BigNumber } from 'ethers'
import { factory } from './core'
import sdk from '@/graphql/sdk'

export interface Factory {
  fundingRoundAddress: string
  nativeTokenAddress: string
  nativeTokenSymbol: string
  nativeTokenDecimals: number
  userRegistryAddress: string
}

export async function getFactoryInfo() {
  const { fundingRoundFactory } = await sdk.GetFactoryInfo({
    factoryAddress: factory.address.toLowerCase(),
  })

  const nativeTokenAddress = fundingRoundFactory?.nativeTokenInfo?.tokenAddress

  const nativeTokenSymbol = fundingRoundFactory?.nativeTokenInfo?.symbol
  const decimals = BigNumber.from(
    fundingRoundFactory?.nativeTokenInfo?.decimals || 0
  )
  const nativeTokenDecimals = decimals.toNumber()

  const userRegistryAddress = fundingRoundFactory?.contributorRegistryAddress

  return {
    fundingRoundAddress: factory.address,
    nativeTokenAddress,
    nativeTokenSymbol,
    nativeTokenDecimals,
    userRegistryAddress,
  }
}
