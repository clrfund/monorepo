import { Contract, FixedNumber } from 'ethers'
import sdk from '@/graphql/sdk'

import { FundingRound } from './abi'
import { provider } from './core'

export async function getAllocatedAmount(
  fundingRoundAddress: string,
  tokenDecimals: number,
  result: string,
  spent: string
): Promise<FixedNumber> {
  const fundingRound = new Contract(fundingRoundAddress, FundingRound, provider)
  const allocatedAmount = await fundingRound.getAllocatedAmount(result, spent)
  return FixedNumber.fromValue(allocatedAmount, tokenDecimals)
}

export async function isFundsClaimed(
  fundingRoundAddress: string,
  recipientAddress: string
): Promise<boolean> {
  const data = await sdk.GetRecipientDonations({
    fundingRoundAddress: fundingRoundAddress.toLowerCase(),
    recipientAddress,
  })

  return !!data.donations.length
}
