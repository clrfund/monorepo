import { BigNumber, Contract, FixedNumber } from 'ethers'
import { DateTime } from 'luxon'
import { PubKey } from 'maci-domainobjs'

import { FundingRound, MACI, ERC20 } from './abi'
import { provider, factory } from './core'
import { getTotalContributed } from './contributions'

export interface RoundInfo {
  fundingRoundAddress: string
  userRegistryAddress: string
  maciAddress: string
  recipientTreeDepth: number
  maxContributors: number
  maxRecipients: number
  maxMessages: number
  coordinatorPubKey: PubKey
  nativeTokenAddress: string
  nativeTokenSymbol: string
  nativeTokenDecimals: number
  voiceCreditFactor: BigNumber
  status: string
  startTime: DateTime
  signUpDeadline: DateTime
  votingDeadline: DateTime
  totalFunds: FixedNumber
  matchingPool: FixedNumber
  contributions: FixedNumber
  contributors: number
  messages: number
}

export interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

export enum RoundStatus {
  Contributing = 'Contributing',
  Reallocating = 'Reallocating',
  Tallying = 'Tallying',
  Finalized = 'Finalized',
  Cancelled = 'Cancelled',
}
//TODO: update to take factory address as a parameter, default to env. variable
export async function getCurrentRound(): Promise<string | null> {
  const fundingRoundAddress = await factory.getCurrentRound()
  if (fundingRoundAddress === '0x0000000000000000000000000000000000000000') {
    return null
  }
  return fundingRoundAddress
}

//TODO: update to take factory address as a parameter, default to env. variable
export async function getRoundInfo(
  fundingRoundAddress: string
): Promise<RoundInfo> {
  const fundingRound = new Contract(fundingRoundAddress, FundingRound, provider)
  const [
    maciAddress,
    nativeTokenAddress,
    userRegistryAddress,
    voiceCreditFactor,
    isFinalized,
    isCancelled,
  ] = await Promise.all([
    fundingRound.maci(),
    fundingRound.nativeToken(),
    fundingRound.userRegistry(),
    fundingRound.voiceCreditFactor(),
    fundingRound.isFinalized(),
    fundingRound.isCancelled(),
  ])

  const maci = new Contract(maciAddress, MACI, provider)
  const [
    maciTreeDepths,
    signUpTimestamp,
    signUpDurationSeconds,
    votingDurationSeconds,
    coordinatorPubKeyRaw,
    messages,
  ] = await Promise.all([
    maci.treeDepths(),
    maci.signUpTimestamp(),
    maci.signUpDurationSeconds(),
    maci.votingDurationSeconds(),
    maci.coordinatorPubKey(),
    maci.numMessages(),
  ])
  const startTime = DateTime.fromSeconds(signUpTimestamp.toNumber())
  const signUpDeadline = DateTime.fromSeconds(
    signUpTimestamp.add(signUpDurationSeconds).toNumber()
  )
  const votingDeadline = DateTime.fromSeconds(
    signUpTimestamp
      .add(signUpDurationSeconds)
      .add(votingDurationSeconds)
      .toNumber()
  )
  const coordinatorPubKey = new PubKey([
    BigInt(coordinatorPubKeyRaw.x),
    BigInt(coordinatorPubKeyRaw.y),
  ])

  const nativeToken = new Contract(nativeTokenAddress, ERC20, provider)
  const nativeTokenSymbol = await nativeToken.symbol()
  const nativeTokenDecimals = await nativeToken.decimals()

  const now = DateTime.local()
  const contributionsInfo = await getTotalContributed(fundingRoundAddress)
  let status: string
  let contributions: BigNumber
  let matchingPool: BigNumber
  if (isCancelled) {
    status = RoundStatus.Cancelled
    contributions = BigNumber.from(0)
    matchingPool = BigNumber.from(0)
  } else if (isFinalized) {
    status = RoundStatus.Finalized
    contributions = (await fundingRound.totalSpent()).mul(voiceCreditFactor)
    matchingPool = await fundingRound.matchingPoolSize()
  } else {
    if (now < signUpDeadline) {
      status = RoundStatus.Contributing
    } else if (now < votingDeadline) {
      status = RoundStatus.Reallocating
    } else {
      status = RoundStatus.Tallying
    }
    contributions = contributionsInfo.amount
    //TODO: update to take factory address as a parameter, default to env. variable
    matchingPool = await factory.getMatchingFunds(nativeTokenAddress)
  }

  const totalFunds = matchingPool.add(contributions)

  return {
    fundingRoundAddress,
    userRegistryAddress,
    maciAddress,
    recipientTreeDepth: maciTreeDepths.voteOptionTreeDepth,
    maxContributors: 2 ** maciTreeDepths.stateTreeDepth - 1,
    maxRecipients: 5 ** maciTreeDepths.voteOptionTreeDepth - 1,
    maxMessages: 2 ** maciTreeDepths.messageTreeDepth - 1,
    coordinatorPubKey,
    nativeTokenAddress,
    nativeTokenSymbol,
    nativeTokenDecimals,
    voiceCreditFactor,
    status,
    startTime,
    signUpDeadline,
    votingDeadline,
    totalFunds: FixedNumber.fromValue(totalFunds, nativeTokenDecimals),
    matchingPool: FixedNumber.fromValue(matchingPool, nativeTokenDecimals),
    contributions: FixedNumber.fromValue(contributions, nativeTokenDecimals),
    contributors: contributionsInfo.count,
    messages: messages.toNumber(),
  }
}
