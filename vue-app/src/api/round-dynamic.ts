import { RoundInfo, RoundStatus } from './round'
import { BaseRound } from './round-base'
import { getTally, Tally } from './tally'
import { Token } from './token'
import {
  getProject,
  getProjects,
  getRecipientRegistryAddress,
  LeaderboardProject,
  Project,
} from './projects'
import { getAllocatedAmount } from './claims'
import { FundingRound, ERC20, MACI } from './abi'
import { provider, factory } from './core'
import { BigNumber, Contract, FixedNumber } from 'ethers'
import { isSameAddress } from '@/utils/accounts'
import { getTotalContributed } from './contributions'
import { PubKey } from 'maci-domainobjs'
import { DateTime } from 'luxon'

/**
 * DynamicRound loads round information from smart contract or subgraph
 */
export class DynamicRound extends BaseRound {
  constructor(fundingRoundAddress: string, isFinalized: boolean) {
    super(fundingRoundAddress, isFinalized)
  }

  private async getProjectAllocatedAmount(
    registryAddress: string,
    projectId: string,
    tally: Tally
  ): Promise<BigNumber | null> {
    const project = await getProject(registryAddress, projectId)
    if (!project) {
      return null
    }

    const tallyResult = tally.results.tally[project.index]
    const spent = tally.totalVoiceCreditsPerVoteOption.tally[project.index]

    return getAllocatedAmount(this.address, tallyResult, spent)
  }

  async getAllocatedAmount(projectId: string): Promise<BigNumber | null> {
    if (!this.isFinalized) {
      return null
    }

    const registryAddress = await getRecipientRegistryAddress(this.address)
    const tally = await getTally(this.address)
    return this.getProjectAllocatedAmount(registryAddress, projectId, tally)
  }

  async getTokenInfo(): Promise<Token> {
    const roundContract = new Contract(this.address, FundingRound, provider)
    const address = await roundContract.nativeToken()
    const nativeToken = new Contract(address, ERC20, provider)
    const symbol = await nativeToken.symbol()
    const decimals = await nativeToken.decimals()

    return { address, symbol, decimals }
  }

  async getRoundInfo(cachedRound?: RoundInfo): Promise<RoundInfo> {
    if (
      cachedRound &&
      isSameAddress(this.address, cachedRound.fundingRoundAddress)
    ) {
      // the requested round matches the cached round, quick return
      return cachedRound
    }

    const fundingRound = new Contract(this.address, FundingRound, provider)
    const [
      maciAddress,
      nativeTokenAddress,
      recipientRegistryAddress,
      userRegistryAddress,
      voiceCreditFactor,
      isFinalized,
      isCancelled,
    ] = await Promise.all([
      fundingRound.maci(),
      fundingRound.nativeToken(),
      fundingRound.recipientRegistry(),
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

    const maxContributors = 2 ** maciTreeDepths.stateTreeDepth - 1
    const maxMessages = 2 ** maciTreeDepths.messageTreeDepth - 1
    const now = DateTime.local()
    const contributionsInfo = await getTotalContributed(this.address)
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
      fundingRoundAddress: this.address,
      recipientRegistryAddress,
      userRegistryAddress,
      maciAddress,
      recipientTreeDepth: maciTreeDepths.voteOptionTreeDepth,
      maxContributors,
      maxRecipients: 5 ** maciTreeDepths.voteOptionTreeDepth - 1,
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
      messages: messages.toNumber(),
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

  async getLeaderboardProjects(): Promise<LeaderboardProject[]> {
    const projects = await this.getProjects()
    let allocations: BigNumber[] = projects.map(() => BigNumber.from(0))
    const tally = this.isFinalized ? await getTally(this.address) : null

    if (this.isFinalized && tally) {
      const registryAddress = await getRecipientRegistryAddress(this.address)
      allocations = await Promise.all(
        projects.map(async (project) => {
          const amount = await this.getProjectAllocatedAmount(
            registryAddress,
            project.id,
            tally
          )
          return amount ?? BigNumber.from(0)
        })
      )
    }

    return projects.map((project, idx) => {
      return {
        id: project.id,
        name: project.name,
        index: project.index,
        bannerImageUrl: project.bannerImageUrl,
        thumbnailImageUrl: project.thumbnailImageUrl,
        imageUrl: project.imageUrl,
        allocatedAmount: allocations[idx] ?? BigNumber.from(0),
        donation: BigNumber.from(
          tally?.totalVoiceCreditsPerVoteOption.tally[project.index] ?? 0
        ),
        votes: BigNumber.from(tally?.results.tally[project.index] ?? 0),
      }
    })
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
