import { ethers } from 'ethers'

import { FundingRoundFactory } from './abi'

export const provider = new ethers.providers.JsonRpcProvider(
  process.env.VUE_APP_ETHEREUM_API_URL,
)
export const ipfsGatewayUrl = process.env.VUE_APP_IPFS_GATEWAY_URL
export const factory = new ethers.Contract(
  process.env.VUE_APP_CLRFUND_FACTORY_ADDRESS as string,
  FundingRoundFactory,
  provider,
)
