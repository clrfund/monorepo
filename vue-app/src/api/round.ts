import { BigNumber, Contract, utils, FixedNumber } from 'ethers'
import { DateTime } from 'luxon'
import { PubKey } from 'maci-domainobjs'

import { FundingRound, MACI } from './abi'
import { provider, factory } from './core'
import { getTotalContributed } from './contributions'
import { getRounds } from './rounds'
import sdk from '@/graphql/sdk'
import { assert, ASSERT_MISSING_ROUND } from '@/utils/assert'

import { isSameAddress } from '@/utils/accounts'

export interface RoundInfo {
  fundingRoundAddress: string
  userRegistryAddress: string
  recipientRegistryAddress: string
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
  const rounds = await getRounds()
  const roundIndex = rounds.findIndex(round => isSameAddress(round.address, fundingRoundAddress))

  if (roundIndex >= Number(import.meta.env.VITE_FIRST_ROUND || 0)) {
    return fundingRoundAddress
  }
  return null
}

//TODO: update to take factory address as a parameter, default to env. variable
export async function getRoundInfo(fundingRoundAddress: string, cachedRound?: RoundInfo | null): Promise<RoundInfo> {
  if (cachedRound && isSameAddress(fundingRoundAddress, cachedRound.fundingRoundAddress)) {
    // the requested round matches the cached round, quick return
    return cachedRound
  }

  const fundingRound = new Contract(fundingRoundAddress, FundingRound, provider)
  const data = await sdk.GetRoundInfo({
    fundingRoundAddress: fundingRoundAddress.toLowerCase(),
  })

  assert(data.fundingRound, ASSERT_MISSING_ROUND)

  const {
    maci: maciAddress,
    recipientRegistryAddress,
    contributorRegistryAddress: userRegistryAddress,
    isFinalized,
    isCancelled,
  } = data.fundingRound

  const voiceCreditFactor = BigNumber.from(data.fundingRound.voiceCreditFactor)

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
  const signUpDeadline = DateTime.fromSeconds(signUpTimestamp.add(signUpDurationSeconds).toNumber())
  const votingDeadline = DateTime.fromSeconds(
    signUpTimestamp.add(signUpDurationSeconds).add(votingDurationSeconds).toNumber(),
  )
  const coordinatorPubKey = new PubKey([BigInt(coordinatorPubKeyRaw.x), BigInt(coordinatorPubKeyRaw.y)])

  const nativeTokenAddress = data.fundingRound.nativeTokenInfo?.tokenAddress || ''
  const nativeTokenSymbol = data.fundingRound.nativeTokenInfo?.symbol || ''
  const nativeTokenDecimals = Number(data.fundingRound.nativeTokenInfo?.decimals || '')

  const maxContributors = 2 ** maciTreeDepths.stateTreeDepth - 1
  const maxMessages = 2 ** maciTreeDepths.messageTreeDepth - 1
  const now = DateTime.local()
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
    matchingPool = await factory.getMatchingFunds(nativeTokenAddress)
  } else {
    if (now < signUpDeadline && contributors < maxContributors) {
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
    recipientRegistryAddress: utils.getAddress(recipientRegistryAddress),
    userRegistryAddress: utils.getAddress(userRegistryAddress),
    maciAddress: utils.getAddress(maciAddress),
    recipientTreeDepth: maciTreeDepths.voteOptionTreeDepth,
    maxContributors,
    maxRecipients: 5 ** maciTreeDepths.voteOptionTreeDepth - 1,
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
    totalFunds: FixedNumber.fromValue(totalFunds, nativeTokenDecimals),
    matchingPool: FixedNumber.fromValue(matchingPool, nativeTokenDecimals),
    contributions: FixedNumber.fromValue(contributions, nativeTokenDecimals),
    contributors,
    messages: messages.toNumber(),
  }
}
