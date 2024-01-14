import { Contract } from 'ethers'
import sdk from '@/graphql/sdk'

import { FundingRound } from './abi'
import { provider } from './core'

export async function getAllocatedAmount(
  fundingRoundAddress: string,
  tokenDecimals: number,
  result: string,
  spent: string,
): Promise<bigint> {
  const fundingRound = new Contract(fundingRoundAddress, FundingRound, provider)
  const allocatedAmount = await fundingRound.getAllocatedAmount(result, spent)
  return allocatedAmount
}

export async function isFundsClaimed(
  fundingRoundAddress: string,
  recipientAddress: string,
  recipientIndex: number,
): Promise<boolean> {
  const data = await sdk.GetRecipientDonations({
    fundingRoundAddress: fundingRoundAddress.toLowerCase(),
    recipientAddress,
    recipientIndex,
  })

  return !!data.donations.length
}
