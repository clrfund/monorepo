import sdk from '@/graphql/sdk'
import extraRounds from '@/rounds/rounds.json'
import { chain } from './core'

export interface Round {
  index: number
  address: string
  network?: string
  hasLeaderboard: boolean
  startTime: number
}

function toRoundId({ network, address }: { network: string; address: string }): string {
  return `${network}-${address}`.toLowerCase()
}

//TODO: update to take factory address as a parameter
export async function getRounds(): Promise<Round[]> {
  //TODO: updateto pass factory address as a parameter, default to env. variable
  //NOTE: why not instantiate the sdk here?
  const data = await sdk.GetRounds()

  const rounds: Round[] = extraRounds.map(({ address, network, startTime }, index): Round => {
    return { index, address, network, hasLeaderboard: true, startTime }
  })

  const leaderboardRounds = new Set(rounds.map(r => toRoundId({ network: r.network || '', address: r.address })))

  const firstRound = Number(import.meta.env.VITE_FIRST_ROUND || 0)

  for (let roundIndex = 0; roundIndex < data.fundingRounds.length; roundIndex++) {
    if (roundIndex < firstRound) {
      // filter out cancelled or test rounds
      continue
    }

    const fundingRound = data.fundingRounds[roundIndex]
    const address = fundingRound.id
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
