import { Contract, FixedNumber } from 'ethers'

import { FundingRound } from './abi'
import { provider } from './core'
import { Project } from './projects'

// A size of message batch
export const CART_MAX_SIZE = 10

export interface CartItem extends Project {
  amount: number;
}

export async function getContributionAmount(
  contributorAddress: string,
  fundingRoundAddress: string,
  tokenDecimals: number,
): Promise<FixedNumber> {
  const fundingRound = new Contract(
    fundingRoundAddress,
    FundingRound,
    provider,
  )
  const filter = fundingRound.filters.NewContribution(contributorAddress)
  const events = await fundingRound.queryFilter(filter, 0)
  const event = events[0]
  if (!event || !event.args) {
    return FixedNumber.from(0)
  }
  return FixedNumber.fromValue(event.args._amount, tokenDecimals)
}
