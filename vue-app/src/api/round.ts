import { ethers, BigNumber, FixedNumber } from 'ethers'
import { DateTime } from 'luxon'

import { FundingRound, ERC20 } from './abi'
import { provider, factory } from './core'

export interface RoundInfo {
  fundingRoundAddress: string;
  nativeTokenSymbol: string;
  nativeTokenDecimals: number;
  status: string;
  contributionDeadline: DateTime;
  votingDeadline: DateTime;
  totalFunds: FixedNumber;
  matchingPool: FixedNumber;
  contributions: FixedNumber;
}

export enum RoundStatus {
  Contributing = 'Contributing',
  Voting = 'Voting',
  Tallying = 'Tallying',
  Finalized = 'Finalized',
  Cancelled = 'Cancelled',
}

export async function getRoundInfo(): Promise<RoundInfo | null> {
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
  const nativeTokenDecimals = await nativeToken.decimals()

  const now = DateTime.local()
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
    status = RoundStatus.Cancelled
    matchingPool = BigNumber.from(0)
  } else if (isFinalized) {
    status = RoundStatus.Finalized
    matchingPool = await fundingRound.matchingPoolSize()
  } else {
    if (now < contributionDeadline) {
      status = RoundStatus.Contributing
    } else if (now < votingDeadline) {
      status = RoundStatus.Voting
    } else {
      status = RoundStatus.Tallying
    }
    matchingPool = await nativeToken.balanceOf(factory.address)
  }

  const contributionFilter = fundingRound.filters.NewContribution()
  const contributionEvents = await fundingRound.queryFilter(contributionFilter, 0)
  let contributions = BigNumber.from(0)
  contributionEvents.forEach(event => {
    if (!event.args) {
      return
    }
    contributions = contributions.add(event.args._amount)
  })
  const totalFunds = matchingPool.add(contributions)

  return {
    fundingRoundAddress,
    nativeTokenSymbol,
    nativeTokenDecimals,
    status,
    contributionDeadline,
    votingDeadline,
    totalFunds: FixedNumber.fromValue(totalFunds, nativeTokenDecimals),
    matchingPool: FixedNumber.fromValue(matchingPool, nativeTokenDecimals),
    contributions: FixedNumber.fromValue(contributions, nativeTokenDecimals),
  }
}
