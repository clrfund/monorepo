import { Contract, BigNumber } from 'ethers'
import sdk from '@/graphql/sdk'

import { FundingRound } from './abi'
import { provider } from './core'

export async function getAllocatedAmount(
  fundingRoundAddress: string,
  result: string,
  spent: string
): Promise<BigNumber> {
  const fundingRound = new Contract(fundingRoundAddress, FundingRound, provider)
  return fundingRound.getAllocatedAmount(result, spent)
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
