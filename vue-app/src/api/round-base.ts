import { BigNumber } from 'ethers'
import { Token } from './token'
import { RoundInfo } from './round'
import { LeaderboardProject, Project } from './projects'
import { Tally } from './tally'

type BaseRoundConstructorArgs = {
  address: string
  isFinalized: boolean
  blogUrl: string | null
}

export function sortByAllocatedAmountDesc(
  entry1: LeaderboardProject,
  entry2: LeaderboardProject
): number {
  const amount1 = entry1.allocatedAmount
  const amount2 = entry2.allocatedAmount

  const diff = amount2.sub(amount1)
  return diff.isZero() ? 0 : diff.gt(0) ? 1 : -1
}

export abstract class BaseRound {
  address: string
  isFinalized: boolean
  blogUrl: string | null

  constructor({ address, isFinalized, blogUrl }: BaseRoundConstructorArgs) {
    this.address = address
    this.isFinalized = isFinalized
    this.blogUrl = blogUrl
  }

  abstract getTokenInfo(): Promise<Token>
  abstract getRoundInfo(cachedRound?: RoundInfo): Promise<RoundInfo | null>
  abstract getLeaderboardProjects(): LeaderboardProject[] | null
  abstract getProject(projectId: string): Promise<Project | null>
  abstract getProjects(): Promise<Project[]>
  abstract getAllocatedAmountByProjectIndex(
    projectIndex: number
  ): Promise<BigNumber | null>
  abstract getTally(): Promise<Tally | null>
}
