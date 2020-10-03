import { BigNumber, Contract, FixedNumber } from 'ethers'
import { DateTime } from 'luxon'
import { PubKey } from 'maci-domainobjs'

import { FundingRound, MACI, ERC20 } from './abi'
import { provider, factory } from './core'

export interface RoundInfo {
  fundingRoundAddress: string;
  maciAddress: string;
  recipientTreeDepth: number;
  startBlock: number;
  coordinatorPubKey: PubKey;
  nativeTokenAddress: string;
  nativeTokenSymbol: string;
  nativeTokenDecimals: number;
  voiceCreditFactor: BigNumber;
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
  const fundingRound = new Contract(
    fundingRoundAddress,
    FundingRound,
    provider,
  )
  const maciAddress = await fundingRound.maci()
  const maci = new Contract(maciAddress, MACI, provider)
  const recipientTreeDepth = (await maci.treeDepths()).voteOptionTreeDepth
  const votingDeadline = DateTime.fromSeconds(
    parseInt(await maci.calcVotingDeadline()),
  )
  const startBlock = (await fundingRound.startBlock()).toNumber()
  const coordinatorPubKeyRaw = await fundingRound.coordinatorPubKey()
  const coordinatorPubKey = new PubKey([
    BigInt(coordinatorPubKeyRaw.x),
    BigInt(coordinatorPubKeyRaw.y),
  ])
  const nativeTokenAddress = await fundingRound.nativeToken()
  const nativeToken = new Contract(
    nativeTokenAddress,
    ERC20,
    provider,
  )
  const nativeTokenSymbol = await nativeToken.symbol()
  const nativeTokenDecimals = await nativeToken.decimals()
  const voiceCreditFactor = await fundingRound.voiceCreditFactor()

  const now = DateTime.local()
  const contributionDeadline = DateTime.fromSeconds(
    parseInt(await fundingRound.contributionDeadline()),
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

  const contributionFilter = fundingRound.filters.Contribution()
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
    maciAddress,
    recipientTreeDepth,
    startBlock,
    coordinatorPubKey,
    nativeTokenAddress,
    nativeTokenSymbol,
    nativeTokenDecimals,
    voiceCreditFactor,
    status,
    contributionDeadline,
    votingDeadline,
    totalFunds: FixedNumber.fromValue(totalFunds, nativeTokenDecimals),
    matchingPool: FixedNumber.fromValue(matchingPool, nativeTokenDecimals),
    contributions: FixedNumber.fromValue(contributions, nativeTokenDecimals),
  }
}
