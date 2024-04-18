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

export async function isFundsClaimed(fundingRoundAddress: string, recipientIndex: number): Promise<boolean> {
  let claimed = false

  try {
    const fundingRound = new Contract(fundingRoundAddress, FundingRound, provider)
    const recipients = await fundingRound.recipients(recipientIndex)
    claimed = !!recipients.fundsClaimed
  } catch {
    // recipient status is not available in older contract interface
    claimed = true
  }
  return claimed
}
