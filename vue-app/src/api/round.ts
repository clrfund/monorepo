import { ethers, BigNumber, FixedNumber } from 'ethers'
import { DateTime } from 'luxon'

import { FundingRound, ERC20 } from './abi'
import { provider, factory } from './core'

export interface RoundInfo {
  fundingRoundAddress: string;
  nativeToken: string;
  status: string;
  contributionDeadline: DateTime;
  votingDeadline: DateTime;
  totalFunds: FixedNumber;
  matchingPool: FixedNumber;
  contributions: FixedNumber;
  contribution: FixedNumber;
}

export async function getRoundInfo(account: string): Promise<RoundInfo | null> {
  const fundingRoundAddress = await factory.getCurrentRound()
  if (fundingRoundAddress === '0x0000000000000000000000000000000000000000') {
    return null
  }
  const fundingRound = new ethers.Contract(
    fundingRoundAddress,
    FundingRound,
    provider,
  )
  const nativeToken = new ethers.Contract(
    await fundingRound.nativeToken(),
    ERC20,
    provider,
  )
  const nativeTokenSymbol = await nativeToken.symbol()
  const nativeTokenDecs = await nativeToken.decimals()
  const contributionDeadline = DateTime.fromSeconds(
    parseInt(await fundingRound.contributionDeadline()),
  )
  const votingDeadline = DateTime.fromSeconds(
    parseInt(await fundingRound.votingDeadline()),
  )

  const isFinalized = await fundingRound.isFinalized()
  const isCancelled = await fundingRound.isCancelled()
  let status: string
  let matchingPool: BigNumber
  if (isCancelled) {
    status = 'Cancelled'
    matchingPool = BigNumber.from(0)
  } else if (isFinalized) {
    status = 'Finalized'
    matchingPool = await fundingRound.matchingPoolSize()
  } else {
    status = 'Running'
    matchingPool = await nativeToken.balanceOf(factory.address)
  }

  const contributionFilter = fundingRound.filters.NewContribution()
  const contributionEvents = await fundingRound.queryFilter(contributionFilter, 0)
  let contributions = BigNumber.from(0)
  let contribution = BigNumber.from(0)
  contributionEvents.forEach(event => {
    if (!event.args) {
      return
    }
    contributions = contributions.add(event.args._amount)
    if (event.args._sender.toLowerCase() === account) {
      contribution = event.args._amount
    }
  })
  const totalFunds = matchingPool.add(contributions)

  return {
    fundingRoundAddress,
    nativeToken: nativeTokenSymbol,
    status,
    contributionDeadline,
    votingDeadline,
    totalFunds: FixedNumber.fromValue(totalFunds, nativeTokenDecs),
    matchingPool: FixedNumber.fromValue(matchingPool, nativeTokenDecs),
    contributions: FixedNumber.fromValue(contributions, nativeTokenDecs),
    contribution: FixedNumber.fromValue(contribution, nativeTokenDecs),
  }
}
