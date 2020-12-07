import { BigNumber, Contract, FixedNumber } from 'ethers'
import { DateTime } from 'luxon'
import { PubKey } from 'maci-domainobjs'

import { FundingRound, MACI, ERC20 } from './abi'
import { provider, factory } from './core'
import { getTotalContributed } from './contributions'

export interface RoundInfo {
  fundingRoundAddress: string;
  userRegistryAddress: string;
  maciAddress: string;
  recipientTreeDepth: number;
  startBlock: number;
  endBlock: number;
  coordinatorPubKey: PubKey;
  nativeTokenAddress: string;
  nativeTokenSymbol: string;
  nativeTokenDecimals: number;
  voiceCreditFactor: BigNumber;
  status: string;
  signUpDeadline: DateTime;
  votingDeadline: DateTime;
  totalFunds: FixedNumber;
  matchingPool: FixedNumber;
  contributions: FixedNumber;
}

export enum RoundStatus {
  Contributing = 'Contributing',
  Reallocating = 'Reallocating',
  Tallying = 'Tallying',
  Finalized = 'Finalized',
  Cancelled = 'Cancelled',
}

export async function getCurrentRound(): Promise<string | null> {
  const fundingRoundAddress = await factory.getCurrentRound()
  if (fundingRoundAddress === '0x0000000000000000000000000000000000000000') {
    return null
  }
  return fundingRoundAddress
}

export async function getRoundInfo(fundingRoundAddress: string): Promise<RoundInfo> {
  const fundingRound = new Contract(
    fundingRoundAddress,
    FundingRound,
    provider,
  )
  const [
    maciAddress,
    nativeTokenAddress,
    userRegistryAddress,
    startBlock,
    voiceCreditFactor,
    isFinalized,
    isCancelled,
  ] = await Promise.all([
    fundingRound.maci(),
    fundingRound.nativeToken(),
    fundingRound.userRegistry(),
    fundingRound.startBlock(),
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
  ] = await Promise.all([
    maci.treeDepths(),
    maci.signUpTimestamp(),
    maci.signUpDurationSeconds(),
    maci.votingDurationSeconds(),
    maci.coordinatorPubKey(),
  ])
  const signUpDeadline = DateTime.fromSeconds(
    signUpTimestamp.add(signUpDurationSeconds).toNumber(),
  )
  const votingDeadline = DateTime.fromSeconds(
    signUpTimestamp.add(signUpDurationSeconds).add(votingDurationSeconds).toNumber(),
  )
  const endBlock = startBlock.add(
    // Average block time is 15 seconds
    signUpDurationSeconds.add(votingDurationSeconds).div(15),
  )
  const coordinatorPubKey = new PubKey([
    BigInt(coordinatorPubKeyRaw.x),
    BigInt(coordinatorPubKeyRaw.y),
  ])

  const nativeToken = new Contract(
    nativeTokenAddress,
    ERC20,
    provider,
  )
  const nativeTokenSymbol = await nativeToken.symbol()
  const nativeTokenDecimals = await nativeToken.decimals()

  const now = DateTime.local()
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
    contributions = await getTotalContributed(fundingRoundAddress)
    matchingPool = await nativeToken.balanceOf(factory.address)
  }

  const totalFunds = matchingPool.add(contributions)

  return {
    fundingRoundAddress,
    userRegistryAddress,
    maciAddress,
    recipientTreeDepth: maciTreeDepths.voteOptionTreeDepth,
    startBlock: startBlock.toNumber(),
    endBlock: endBlock.toNumber(),
    coordinatorPubKey,
    nativeTokenAddress,
    nativeTokenSymbol,
    nativeTokenDecimals,
    voiceCreditFactor,
    status,
    signUpDeadline,
    votingDeadline,
    totalFunds: FixedNumber.fromValue(totalFunds, nativeTokenDecimals),
    matchingPool: FixedNumber.fromValue(matchingPool, nativeTokenDecimals),
    contributions: FixedNumber.fromValue(contributions, nativeTokenDecimals),
  }
}
