import sdk from '@/graphql/sdk'
import extraRounds from '@/rounds/rounds.json'
import { chain, voidedRounds } from './core'

export interface Round {
  index: number
  address: string
  network?: string
  hasLeaderboard: boolean
  startTime: number
  votingDeadline: number
}

export function isVoidedRound(address: string): boolean {
  return voidedRounds.has(address.toLowerCase())
}

function toRoundId({ network, address }: { network: string; address: string }): string {
  return `${network}-${address}`.toLowerCase()
}

//TODO: update to take ClrFund address as a parameter
export async function getRounds(): Promise<Round[]> {
  let data
  try {
    data = await sdk.GetRounds()
  } catch {
    return []
  }

  const rounds: Round[] = extraRounds.map(({ address, network, startTime, votingDeadline }, index): Round => {
    return { index, address, network, hasLeaderboard: true, startTime, votingDeadline }
  })

  const leaderboardRounds = new Set(rounds.map(r => toRoundId({ network: r.network || '', address: r.address })))

  for (const fundingRound of data.fundingRounds) {
    const address = fundingRound.id

    if (isVoidedRound(address)) {
      // filter out cancelled or test rounds
      continue
    }

    const isLeaderboardRound = leaderboardRounds.has(toRoundId({ network: chain.label, address }))
    if (!isLeaderboardRound) {
      rounds.push({
        index: rounds.length,
        address,
        hasLeaderboard: false,
        startTime: Number(fundingRound.startTime),
        votingDeadline: Number(fundingRound.votingDeadline),
      })
    }
  }

  return rounds
    .sort((a, b) => a.startTime - b.startTime)
    .map((r, index) => {
      return {
        index,
        address: r.address,
        hasLeaderboard: r.hasLeaderboard,
        startTime: r.startTime,
        votingDeadline: r.votingDeadline,
        network: r.network,
      }
    })
}
