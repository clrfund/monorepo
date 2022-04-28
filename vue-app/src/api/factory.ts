import { Contract } from 'ethers'
import { ERC20 } from './abi'
import { factory, provider } from './core'

export interface Factory {
  fundingRoundAddress: string
  nativeTokenAddress: string
  nativeTokenSymbol: string
  nativeTokenDecimals: number
}

export async function getFactoryInfo() {
  const nativeTokenAddress = await factory.nativeToken()

  const nativeToken = new Contract(nativeTokenAddress, ERC20, provider)
  const nativeTokenSymbol = await nativeToken.symbol()
  const nativeTokenDecimals = await nativeToken.decimals()

  return {
    fundingRoundAddress: factory.address,
    nativeTokenAddress,
    nativeTokenSymbol,
    nativeTokenDecimals,
  }
}
