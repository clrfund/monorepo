import { BigNumber } from 'ethers'
import { Token } from './token'
import { RoundInfo } from './round'
import { LeaderboardProject, Project } from './projects'
import { Tally } from './tally'

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

  constructor(address: string, isFinalized: boolean) {
    this.address = address
    this.isFinalized = isFinalized
  }

  abstract getTokenInfo(): Promise<Token>
  abstract getRoundInfo(cachedRound?: RoundInfo): Promise<RoundInfo>
  abstract getLeaderboardProjects(): Promise<LeaderboardProject[]>
  abstract getProject(projectId: string): Promise<Project | null>
  abstract getAllocatedAmount(projectId: string): Promise<BigNumber | null>
  abstract getTally(): Promise<Tally | null>
}
