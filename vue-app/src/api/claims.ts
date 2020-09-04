import { BigNumber, Contract } from 'ethers'

import { FundingRound } from './abi'
import { provider } from './core'

export async function getClaimedAmount(
  fundingRoundAddress: string,
  recipientAddress: string,
): Promise<BigNumber | null> {
  const fundingRound = new Contract(fundingRoundAddress, FundingRound, provider)
  // TODO: filter by recipient
  const eventFilter = fundingRound.filters.FundsClaimed()
  const events = await fundingRound.queryFilter(eventFilter, 0)
  for (const event of events) {
    if (!event.args) {
      continue
    }
    if (event.args._recipient.toLowerCase() === recipientAddress.toLowerCase()) {
      return event.args._amount
    }
  }
  return null
}
