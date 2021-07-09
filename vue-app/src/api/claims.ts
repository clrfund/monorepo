import { Contract, FixedNumber } from 'ethers'

import { FundingRound } from './abi'
import { provider } from './core'

export async function getAllocatedAmount(
  fundingRoundAddress: string,
  tokenDecimals: number,
  result: string,
  spent: string,
): Promise<FixedNumber> {
  const fundingRound = new Contract(fundingRoundAddress, FundingRound, provider)
  const allocatedAmount = await fundingRound.getAllocatedAmount(result, spent)
  return FixedNumber.fromValue(
    allocatedAmount,
    tokenDecimals,
  )
}

export async function isFundsClaimed(
  fundingRoundAddress: string,
  recipientIndex: number,
): Promise<boolean> {
  const fundingRound = new Contract(fundingRoundAddress, FundingRound, provider)
  const eventFilter = fundingRound.filters.FundsClaimed(recipientIndex)
  const events = await fundingRound.queryFilter(eventFilter, 0)
  return events.length > 0
}
