import { BigNumber, Contract, utils } from 'ethers'
import { DateTime } from 'luxon'
import { PubKey } from '@clrfund/common'

import { FundingRound, Poll } from './abi'
import { provider, clrFundContract } from './core'
import { getTotalContributed } from './contributions'
import { isVoidedRound } from './rounds'
import sdk from '@/graphql/sdk'

import { isSameAddress } from '@/utils/accounts'
import { Keypair } from '@clrfund/common'
import { getLeaderboardData } from '@/api/leaderboard'

export interface RoundInfo {
  fundingRoundAddress: string
  userRegistryAddress: string
  recipientRegistryAddress: string
  maciAddress: string
  pollId: bigint
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
  totalFunds: BigNumber
  matchingPool: BigNumber
  contributions: BigNumber
  contributors: number
  messages: number
  blogUrl?: string
  network?: string
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
//TODO: update to take ClrFund address as a parameter, default to env. variable
export async function getCurrentRound(): Promise<string | null> {
  const fundingRoundAddress = await clrFundContract.getCurrentRound()
  if (fundingRoundAddress === '0x0000000000000000000000000000000000000000') {
    return null
  }

  return isVoidedRound(fundingRoundAddress) ? null : fundingRoundAddress
}

export function toRoundInfo(data: any, network: string): RoundInfo {
  const nativeTokenDecimals = Number(data.nativeTokenDecimals)
  // leaderboard does not need coordinator key, generate a dummy number
  const keypair = Keypair.createFromSeed(utils.hexlify(utils.randomBytes(32)))
  const coordinatorPubKey = keypair.pubKey

  const voiceCreditFactor = BigNumber.from(data.voiceCreditFactor)
  const contributions = BigNumber.from(data.totalSpent).mul(voiceCreditFactor)
  const matchingPool = BigNumber.from(data.matchingPoolSize)
  let status = RoundStatus.Cancelled
  if (data.isCancelled) {
    status = RoundStatus.Cancelled
  } else if (data.isFinalized) {
    status = RoundStatus.Finalized
  }
  const totalFunds = contributions.add(matchingPool)

  return {
    fundingRoundAddress: data.address,
    recipientRegistryAddress: utils.getAddress(data.recipientRegistryAddress),
    userRegistryAddress: utils.getAddress(data.userRegistryAddress),
    maciAddress: utils.getAddress(data.maciAddress),
    recipientTreeDepth: 0,
    maxContributors: 0,
    maxRecipients: data.maxRecipients,
    maxMessages: data.maxMessages,
    coordinatorPubKey,
    nativeTokenAddress: utils.getAddress(data.nativeTokenAddress),
    nativeTokenSymbol: data.nativeTokenSymbol,
    nativeTokenDecimals,
    voiceCreditFactor,
    status,
    startTime: DateTime.fromSeconds(data.startTime),
    signUpDeadline: DateTime.fromSeconds(Number(data.startTime) + Number(data.signUpDuration)),
    votingDeadline: DateTime.fromSeconds(
      Number(data.startTime) + Number(data.signUpDuration) + Number(data.votingDuration),
    ),
    totalFunds,
    matchingPool,
    contributions,
    contributors: data.contributorCount,
    messages: Number(data.messages),
    blogUrl: data.blogUrl,
    network,
  }
}

export async function getLeaderboardRoundInfo(fundingRoundAddress: string, network: string): Promise<RoundInfo | null> {
  const data = await getLeaderboardData(fundingRoundAddress, network)
  if (!data) {
    return null
  }

  let round: RoundInfo | null = null
  try {
    round = toRoundInfo(data.round, network)
  } catch (err) {
    /* eslint-disable-next-line no-console */
    console.warn(`Failed map leaderboard round info`, err)
  }

  return round
}

//TODO: update to take ClrFund address as a parameter, default to env. variable
export async function getRoundInfo(
  fundingRoundAddress: string,
  cachedRound?: RoundInfo | null,
): Promise<RoundInfo | null> {
  const roundAddress = fundingRoundAddress || ''
  if (cachedRound && isSameAddress(roundAddress, cachedRound.fundingRoundAddress)) {
    // the requested round matches the cached round, quick return
    return cachedRound
  }

  const fundingRound = new Contract(fundingRoundAddress, FundingRound, provider)
  const data = await sdk.GetRoundInfo({
    fundingRoundAddress: roundAddress.toLowerCase(),
  })

  if (!data.fundingRound) {
    return null
  }

  const {
    pollId,
    pollAddress,
    maci: maciAddress,
    recipientRegistryAddress,
    contributorRegistryAddress: userRegistryAddress,
    isFinalized,
    isCancelled,
    stateTreeDepth,
    messageTreeDepth,
    voteOptionTreeDepth,
    startTime: startTimeInSeconds,
    signUpDeadline: signUpDeadlineInSeconds,
    votingDeadline: votingDeadlineInSeconds,
    coordinatorPubKeyX,
    coordinatorPubKeyY,
  } = data.fundingRound

  const voiceCreditFactor = BigNumber.from(data.fundingRound.voiceCreditFactor)

  const poll = new Contract(pollAddress, Poll, provider)
  const [, messages] = await poll.numSignUpsAndMessages()
  const coordinatorPubKey = new PubKey([BigInt(coordinatorPubKeyX), BigInt(coordinatorPubKeyY)])

  const nativeTokenAddress = data.fundingRound.nativeTokenInfo?.tokenAddress || ''
  const nativeTokenSymbol = data.fundingRound.nativeTokenInfo?.symbol || ''
  const nativeTokenDecimals = Number(data.fundingRound.nativeTokenInfo?.decimals || '')

  const maxContributors = stateTreeDepth ? 2 ** stateTreeDepth - 1 : 0
  const maxMessages = messageTreeDepth ? 2 ** messageTreeDepth - 1 : 0
  const now = DateTime.local()
  const startTime = DateTime.fromSeconds(Number(startTimeInSeconds || 0))
  const signUpDeadline = DateTime.fromSeconds(Number(signUpDeadlineInSeconds || 0))
  const votingDeadline = DateTime.fromSeconds(Number(votingDeadlineInSeconds || 0))
  const contributionsInfo = await getTotalContributed(fundingRoundAddress)
  const contributors = contributionsInfo.count
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
  } else if (messages >= maxMessages) {
    status = RoundStatus.Tallying
    contributions = contributionsInfo.amount
    matchingPool = await clrFundContract.getMatchingFunds(nativeTokenAddress)
  } else {
    if (now < signUpDeadline && contributors < maxContributors) {
      status = RoundStatus.Contributing
    } else if (now < votingDeadline) {
      status = RoundStatus.Reallocating
    } else {
      status = RoundStatus.Tallying
    }
    contributions = contributionsInfo.amount
    //TODO: update to take ClrFund address as a parameter, default to env. variable
    matchingPool = await clrFundContract.getMatchingFunds(nativeTokenAddress)
  }

  const totalFunds = matchingPool.add(contributions)

  return {
    fundingRoundAddress,
    recipientRegistryAddress: utils.getAddress(recipientRegistryAddress),
    userRegistryAddress: utils.getAddress(userRegistryAddress),
    maciAddress: utils.getAddress(maciAddress),
    pollId: BigInt(pollId || 0),
    recipientTreeDepth: voteOptionTreeDepth || 1,
    maxContributors,
    maxRecipients: voteOptionTreeDepth ? 5 ** voteOptionTreeDepth - 1 : 0,
    maxMessages,
    coordinatorPubKey,
    nativeTokenAddress: utils.getAddress(nativeTokenAddress),
    nativeTokenSymbol,
    nativeTokenDecimals,
    voiceCreditFactor,
    status,
    startTime,
    signUpDeadline,
    votingDeadline,
    totalFunds,
    matchingPool,
    contributions,
    contributors,
    messages: messages.toNumber(),
  }
}
