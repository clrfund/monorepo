import { RoundInfo, RoundStatus } from './round'
import { BaseRound, sortByAllocatedAmountDesc } from './round-base'
import { Tally } from './tally'
import { Project, LeaderboardProject } from './projects'
import { Token } from './token'
import { BigNumber, FixedNumber } from 'ethers'
import { DateTime } from 'luxon'
import { Keypair } from 'maci-domainobjs'
import { IPFS } from './ipfs'

interface StaticProject extends Project {
  allocatedAmount: string
  state: string
}

export type StaticRoundData = {
  round: any
  tally: Tally | null
  projects: StaticProject[]
}

function toRoundStatus(round: any): RoundStatus {
  // For static rounds, we only have information about finalized or cancelled
  // So, if it's not finalized or cancelled, default to tallying
  return round.isCancelled
    ? RoundStatus.Cancelled
    : round.isFinalized
    ? RoundStatus.Finalized
    : RoundStatus.Tallying
}

function toRoundInfo(round: any, tally: Tally | null): RoundInfo {
  const nativeTokenDecimals = round.nativeTokenDecimals
  const voiceCreditFactor = BigNumber.from(round.voiceCreditFactor)
  const matchingPool = BigNumber.from(round.matchingPoolSize)

  const contributions = tally
    ? BigNumber.from(tally.totalVoiceCredits.spent).mul(voiceCreditFactor)
    : BigNumber.from(0)
  const totalFunds = matchingPool.add(contributions)

  return {
    fundingRoundAddress: round.address,
    userRegistryAddress: round.userRegistryAddress,
    recipientRegistryAddress: round.recipientRegistryAddress,
    maciAddress: round.maciAddress,
    recipientTreeDepth: 0,
    maxContributors: 0,
    maxRecipients: 0,
    maxMessages: 0,
    coordinatorPubKey: new Keypair().pubKey,
    nativeTokenAddress: round.nativeTokenAddress,
    nativeTokenSymbol: round.nativeTokenSymbol,
    nativeTokenDecimals,
    voiceCreditFactor,
    status: toRoundStatus(round),
    startTime: DateTime.fromSeconds(round.startTime),
    contributors: round.contributorCount,
    signUpDeadline: DateTime.fromSeconds(0),
    votingDeadline: DateTime.fromSeconds(0),
    totalFunds: FixedNumber.fromValue(totalFunds, nativeTokenDecimals),
    matchingPool: FixedNumber.fromValue(matchingPool, nativeTokenDecimals),
    contributions: FixedNumber.fromValue(contributions, nativeTokenDecimals),
    messages: 0,
  }
}

function mapTwitterUrl(metadata: any = {}): string {
  let twitter = metadata.twitter || metadata.twitterUrl || ''

  if (!twitter) {
    return ''
  }

  const twitterBaseUrl = 'https://twitter.com/'

  if (twitter.startsWith(twitterBaseUrl)) {
    return twitter
  }

  twitter = twitter.replace(/^@/, '')
  return new URL(`${twitterBaseUrl}${twitter}`).href
}

function toProjectInterface(project: any): Project {
  const imageUrl = IPFS.formatUrl(project.metadata?.imageHash)
  const twitterUrl = mapTwitterUrl(project.metadata)

  return {
    id: project.id,
    address: project.recipientAddress,
    requester: project.requester,
    name: project.name,
    tagline: project.metadata?.tagline,
    description: project.metadata?.description || '',
    category: project.metadata?.category,
    problemSpace: project.metadata?.problemSpace,
    plans: project.metadata?.plans,
    teamName: project.metadata?.teamName,
    // teamDescription?:
    // githubUrl?: string
    // radicleUrl?: string
    // websiteUrl?: string
    twitterUrl,
    // discordUrl?: string
    bannerImageUrl: project.metadata?.bannerImageUrl || imageUrl,
    //thumbnailImageUrl?: string
    imageUrl,
    index: project.recipientIndex,
    isHidden: project.state !== 'Accepted',
    isLocked: false,
  }
}

/**
 * StaticRound loads round information from static json file
 * The path of the json file is defined in env. variable VUE_APP_STATIC_ROUNDS_BASE_URL
 */
export class StaticRound extends BaseRound {
  round: RoundInfo
  projects: Record<string, Project>
  allocations: Record<string, BigNumber>
  tally: Tally | null

  constructor(data: StaticRoundData, isFinalized: boolean) {
    super(data.round.address, isFinalized)

    this.tally = isFinalized ? data.tally : null
    this.round = toRoundInfo(data.round, data.tally)
    this.projects = data.projects
      .filter((project) => project.state === 'Accepted')
      .reduce((projects, project) => {
        projects[project.id] = toProjectInterface(project)
        return projects
      }, {})

    const BigNumberZero = BigNumber.from(0)

    this.allocations = data.projects.reduce((allocations, project) => {
      allocations[project.id] =
        this.round.status === RoundStatus.Finalized
          ? BigNumber.from(project.allocatedAmount || '0')
          : BigNumberZero
      return allocations
    }, {})
  }

  async getTokenInfo(): Promise<Token> {
    const {
      nativeTokenAddress: address,
      nativeTokenSymbol: symbol,
      nativeTokenDecimals: decimals,
    } = this.round

    return {
      address,
      symbol,
      decimals,
    }
  }

  async getRoundInfo(): Promise<RoundInfo> {
    return this.round
  }

  /**
   * retrieve project information for the leaderboard view
   */
  async getLeaderboardProjects(): Promise<LeaderboardProject[]> {
    const projects = Object.values(this.projects).map((project) => ({
      id: project.id,
      name: project.name,
      index: project.index,
      bannerImageUrl: project.bannerImageUrl,
      thumbnailImageUrl: project.thumbnailImageUrl,
      imageUrl: project.imageUrl,
      allocatedAmount: this.allocations[project.id] ?? BigNumber.from(0),
      donation: BigNumber.from(
        this.tally?.totalVoiceCreditsPerVoteOption.tally[project.index] ?? 0
      ),
      votes: BigNumber.from(this.tally?.results.tally[project.index] ?? 0),
    }))

    return projects.sort(sortByAllocatedAmountDesc)
  }

  /**
   * Return project information for the project profile view
   * @param projectId project id
   * @returns project information
   */
  async getProject(projectId: string): Promise<Project | null> {
    return this.projects[projectId] ?? null
  }

  async getProjects(): Promise<Project[]> {
    return Object.values(this.projects)
  }

  /**
   * Return the amount allocated to the project
   * @param projectId project id
   * @returns the amount allocated to a project according to the tally result
   *          NULL if the project is not found or the round is not finalized
   */
  async getAllocatedAmount(projectId: string): Promise<BigNumber | null> {
    return this.allocations[projectId] ?? null
  }

  /**
   * Return the tally result which is only available after a round is finalized
   * @returns tally result or null if a round is not finalized
   */
  async getTally(): Promise<Tally | null> {
    return this.tally
  }
}
