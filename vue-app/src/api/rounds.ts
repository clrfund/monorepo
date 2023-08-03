import sdk from '@/graphql/sdk'
import extraRounds from '@/rounds/rounds.json'
import { chain, voidedRounds } from './core'

export interface Round {
  index: number
  address: string
  network?: string
  hasLeaderboard: boolean
  startTime: number
}

export function isVoidedRound(address: string): boolean {
  return voidedRounds.has(address.toLowerCase())
}

function toRoundId({ network, address }: { network: string; address: string }): string {
  return `${network}-${address}`.toLowerCase()
}

//TODO: update to take factory address as a parameter
export async function getRounds(): Promise<Round[]> {
  //TODO: updateto pass factory address as a parameter, default to env. variable

  let data
  try {
    data = await sdk.GetRounds()
  } catch {
    return []
  }

  const rounds: Round[] = extraRounds.map(({ address, network, startTime }, index): Round => {
    return { index, address, network, hasLeaderboard: true, startTime }
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
        network: r.network,
      }
    })
}
