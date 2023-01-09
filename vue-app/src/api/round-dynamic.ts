import { RoundInfo, RoundStatus } from './round'
import { BaseRound } from './round-base'
import { getTally, Tally } from './tally'
import { Token } from './token'
import {
  getProject,
  getProjects,
  LeaderboardProject,
  Project,
} from './projects'
import { getAllocatedAmount } from './claims'
import { FundingRound, MACI } from './abi'
import { provider, factory } from './core'
import { BigNumber, Contract, FixedNumber } from 'ethers'
import { isSameAddress } from '@/utils/accounts'
import { DateTime } from 'luxon'
import sdk from '@/graphql/sdk'
import { getTokenBalance } from './user'
import { getMaciInfo } from './maci'

/**
 * DynamicRound loads round information from smart contract or subgraph
 */
export class DynamicRound extends BaseRound {
  constructor(fundingRoundAddress: string, isFinalized: boolean) {
    super(fundingRoundAddress, isFinalized)
  }

  async getAllocatedAmountByProjectIndex(
    projectIndex: number
  ): Promise<BigNumber | null> {
    if (!this.isFinalized) {
      return null
    }

    try {
      const tally = await getTally(this.address)
      const tallyResult = tally.results.tally[projectIndex]
      const spent = tally.totalVoiceCreditsPerVoteOption.tally[projectIndex]

      return getAllocatedAmount(this.address, tallyResult, spent)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : ''
      // eslint-disable-next-line no-console
      console.error('Failed to get allocated amount', errorMessage)
      return null
    }
  }

  async getTokenInfo(): Promise<Token> {
    const data = await sdk.GetTokenInfo({
      fundingRoundAddress: this.address.toLowerCase(),
    })

    const address = data.fundingRound?.nativeTokenInfo?.tokenAddress || ''
    const symbol = data.fundingRound?.nativeTokenInfo?.symbol || ''
    const decimals = data.fundingRound?.nativeTokenInfo?.decimals || 0

    return { address, symbol, decimals }
  }

  /**
   * Get round information for round information and leaderboard views
   * @param cachedRound previously cached round, usually is the current round
   * @returns round information
   */
  async getRoundInfo(cachedRound?: RoundInfo): Promise<RoundInfo | null> {
    if (
      cachedRound &&
      isSameAddress(this.address, cachedRound.fundingRoundAddress)
    ) {
      // the requested round matches the cached round, quick return
      return cachedRound
    }

    const { fundingRound } = await sdk.GetRoundInfo({
      fundingRoundAddress: this.address.toLowerCase(),
    })
    if (!fundingRound) {
      return null
    }

    const maciAddress = fundingRound.maci || ''
    const maciInfo = await getMaciInfo(maciAddress)
    if (!maciInfo) {
      // this should not happen as MACI is deployed as part of the round
      return null
    }

    const recipientRegistryAddress = fundingRound.recipientRegistryAddress || ''
    const userRegistryAddress = fundingRound.contributorRegistryAddress
    const voiceCreditFactor = BigNumber.from(
      fundingRound.voiceCreditFactor || 0
    )
    const isFinalized = fundingRound.isFinalized || false
    const isCancelled = fundingRound.isCancelled || false
    const totalSpent = BigNumber.from(fundingRound.totalSpent || 0)
    const matchingPoolSize = BigNumber.from(fundingRound.matchingPoolSize || 0)

    const nativeTokenAddress = fundingRound.nativeTokenInfo?.tokenAddress || ''
    const nativeTokenSymbol = fundingRound.nativeTokenInfo?.symbol || ''
    const nativeTokenDecimals = BigNumber.from(
      fundingRound.nativeTokenInfo?.decimals || 0
    ).toNumber()

    // The signUpDeadline from the maciInfo is also formated in local time
    // So, lets create a local time here so we can compare the time properly
    const now = DateTime.local()
    const {
      messages,
      maxMessages,
      signUpDeadline,
      maxContributors,
      votingDeadline,
      recipientTreeDepth,
      maxRecipients,
      coordinatorPubKey,
      startTime,
    } = maciInfo

    const contributors = BigNumber.from(
      fundingRound?.contributorCount || 0
    ).toNumber()

    const tokenBalance =
      contributors > 0
        ? await getTokenBalance(nativeTokenAddress, this.address)
        : BigNumber.from(0)

    let status: string
    let contributions: BigNumber
    let matchingPool: BigNumber
    if (isCancelled) {
      status = RoundStatus.Cancelled
      contributions = BigNumber.from(0)
      matchingPool = BigNumber.from(0)
    } else if (isFinalized) {
      status = RoundStatus.Finalized
      contributions = totalSpent.mul(voiceCreditFactor)
      matchingPool = matchingPoolSize
    } else if (messages >= maxMessages) {
      status = RoundStatus.Tallying
      contributions = tokenBalance
      matchingPool = await factory.getMatchingFunds(nativeTokenAddress)
    } else {
      if (now < signUpDeadline && contributors < maxContributors) {
        status = RoundStatus.Contributing
      } else if (now < votingDeadline) {
        status = RoundStatus.Reallocating
      } else {
        status = RoundStatus.Tallying
      }
      contributions = tokenBalance
      //TODO: update to take factory address as a parameter, default to env. variable
      matchingPool = await factory.getMatchingFunds(nativeTokenAddress)
    }

    const totalFunds = matchingPool.add(contributions)

    return {
      fundingRoundAddress: this.address,
      recipientRegistryAddress,
      userRegistryAddress,
      maciAddress,
      recipientTreeDepth,
      maxContributors,
      maxRecipients,
      maxMessages,
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
      contributors,
      messages,
    }
  }

  async getProjects(): Promise<Project[]> {
    const fundingRound = new Contract(this.address, FundingRound, provider)
    const [registryAddress, maciAddress] = await Promise.all([
      fundingRound.recipientRegistry(),
      fundingRound.maci(),
    ])

    const maci = new Contract(maciAddress, MACI, provider)
    const [signUpTimestamp, signUpDurationSeconds, votingDurationSeconds] =
      await Promise.all([
        maci.signUpTimestamp(),
        maci.signUpDurationSeconds(),
        maci.votingDurationSeconds(),
      ])

    const startTime = signUpTimestamp.toNumber()
    const endTime = signUpTimestamp
      .add(signUpDurationSeconds)
      .add(votingDurationSeconds)
      .toNumber()

    const projects = await getProjects(registryAddress, startTime, endTime)
    return projects.filter((project) => !project.isHidden && !project.isLocked)
  }

  getLeaderboardProjects(): LeaderboardProject[] | null {
    // return null because we only want to show the leaderboard if we have
    // the static round tally data
    return null
  }

  async getProject(projectId: string): Promise<Project | null> {
    const fundingRound = new Contract(this.address, FundingRound, provider)
    const [registryAddress] = await fundingRound.recipientRegistry()

    return getProject(registryAddress, projectId)
  }

  async getTally(): Promise<Tally | null> {
    return this.isFinalized ? getTally(this.address).catch(() => null) : null
  }
}
