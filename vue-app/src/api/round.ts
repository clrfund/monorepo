import { Contract, getAddress, hexlify, randomBytes, getNumber } from 'ethers'
import { DateTime } from 'luxon'
import { PubKey, type Tally, getMaxContributors } from '@clrfund/common'

import { FundingRound, Poll } from './abi'
import { provider, clrFundContract, isActiveApp } from './core'
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
  voiceCreditFactor: bigint
  status: string
  startTime: DateTime
  signUpDeadline: DateTime
  votingDeadline: DateTime
  totalFunds: bigint
  matchingPool: bigint
  contributions: bigint
  contributors: number
  messages: number
  blogUrl?: string
  network?: string
  tally?: Tally
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
  const keypair = Keypair.createFromSeed(hexlify(randomBytes(32)))
  const coordinatorPubKey = keypair.pubKey

  const voiceCreditFactor = BigInt(data.voiceCreditFactor)
  const contributions = BigInt(data.totalSpent) * voiceCreditFactor
  const matchingPool = BigInt(data.matchingPoolSize)
  let status = RoundStatus.Cancelled
  if (data.isCancelled) {
    status = RoundStatus.Cancelled
  } else if (data.isFinalized) {
    status = RoundStatus.Finalized
  }
  const totalFunds = contributions + matchingPool

  return {
    fundingRoundAddress: data.address,
    recipientRegistryAddress: getAddress(data.recipientRegistryAddress),
    userRegistryAddress: getAddress(data.userRegistryAddress),
    maciAddress: getAddress(data.maciAddress),
    pollId: BigInt(data.pollId || 0),
    recipientTreeDepth: 0,
    maxContributors: 0,
    maxRecipients: data.maxRecipients,
    maxMessages: data.maxMessages,
    coordinatorPubKey,
    nativeTokenAddress: getAddress(data.nativeTokenAddress),
    nativeTokenSymbol: data.nativeTokenSymbol,
    nativeTokenDecimals,
    voiceCreditFactor,
    status,
    startTime: DateTime.fromSeconds(Number(data.startTime)),
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

    round.tally = {
      provider: data.tally.provider,
      maci: data.tally.maci,
      pollId: data.pollId,
      newTallyCommitment: data.tally.newTallyCommitment,
      results: data.tally.results,
      totalSpentVoiceCredits: data.tally.totalSpentVoiceCredits ?? data.tally.totalVoiceCredits,
      perVOSpentVoiceCredits: data.tally.perVOSpentVoiceCredits ?? data.tally.totalVoiceCreditsPerVoteOption,
    }
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

  if (!isActiveApp) {
    // static app should use the exported round information from rounds.json
    return null
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
    voteOptionTreeDepth,
    maxMessages: maxMessagesBigInt,
    maxVoteOptions: maxVoteOptionsBigInt,
    startTime: startTimeInSeconds,
    signUpDeadline: signUpDeadlineInSeconds,
    votingDeadline: votingDeadlineInSeconds,
    coordinatorPubKeyX,
    coordinatorPubKeyY,
  } = data.fundingRound

  const voiceCreditFactor = BigInt(data.fundingRound.voiceCreditFactor)

  const poll = new Contract(pollAddress, Poll, provider)
  const [, messages] = await poll.numSignUpsAndMessages()
  const coordinatorPubKey = new PubKey([BigInt(coordinatorPubKeyX), BigInt(coordinatorPubKeyY)])

  const nativeTokenAddress = data.fundingRound.nativeTokenInfo?.tokenAddress || ''
  const nativeTokenSymbol = data.fundingRound.nativeTokenInfo?.symbol || ''
  const nativeTokenDecimals = Number(data.fundingRound.nativeTokenInfo?.decimals || '')

  const maxContributors = getMaxContributors(stateTreeDepth || 0)
  const maxMessages = getNumber(maxMessagesBigInt) || 0
  const now = DateTime.local()
  const startTime = DateTime.fromSeconds(Number(startTimeInSeconds || 0))
  const signUpDeadline = DateTime.fromSeconds(Number(signUpDeadlineInSeconds || 0))
  const votingDeadline = DateTime.fromSeconds(Number(votingDeadlineInSeconds || 0))
  const contributionsInfo = await getTotalContributed(fundingRoundAddress)
  const contributors = contributionsInfo.count
  let status: string
  let contributions: bigint
  let matchingPool: bigint
  if (isCancelled) {
    status = RoundStatus.Cancelled
    contributions = 0n
    matchingPool = 0n
  } else if (isFinalized) {
    status = RoundStatus.Finalized
    contributions = (await fundingRound.totalSpent()) * voiceCreditFactor
    matchingPool = await fundingRound.matchingPoolSize()
  } else if (messages >= maxMessages) {
    status = RoundStatus.Tallying
    contributions = contributionsInfo.amount
    matchingPool = await clrFundContract.getMatchingFunds(nativeTokenAddress)
  } else {
    if (now < votingDeadline && contributors < maxContributors) {
      status = RoundStatus.Contributing
    } else if (now < votingDeadline) {
      // Too many contributors, do not allow new contributors, allow reallocation only
      status = RoundStatus.Reallocating
    } else {
      status = RoundStatus.Tallying
    }
    contributions = contributionsInfo.amount
    //TODO: update to take ClrFund address as a parameter, default to env. variable
    matchingPool = await clrFundContract.getMatchingFunds(nativeTokenAddress)
  }

  const totalFunds = matchingPool + contributions

  // recipient 0 is reserved, so maxRecipients is 1 fewer than the maxVoteOptions
  const maxVoteOptions = getNumber(maxVoteOptionsBigInt)
  const maxRecipients = maxVoteOptions > 0 ? maxVoteOptions - 1 : 0

  return {
    fundingRoundAddress,
    recipientRegistryAddress: getAddress(recipientRegistryAddress),
    userRegistryAddress: getAddress(userRegistryAddress),
    maciAddress: getAddress(maciAddress),
    pollId: BigInt(pollId || 0),
    recipientTreeDepth: voteOptionTreeDepth || 1,
    maxContributors,
    maxRecipients,
    maxMessages,
    coordinatorPubKey,
    nativeTokenAddress: getAddress(nativeTokenAddress),
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
    messages: getNumber(messages),
  }
}
