import sdk from '@/graphql/sdk'
import extraRounds from '@/rounds/rounds.json'

export interface Round {
  index: number
  address: string
  network?: string
  hasLeaderboard: boolean
}

//TODO: update to take factory address as a parameter
export async function getRounds(): Promise<Round[]> {
  //TODO: updateto pass factory address as a parameter, default to env. variable
  //NOTE: why not instantiate the sdk here?
  const data = await sdk.GetRounds()

  const rounds: Round[] = extraRounds.map(({ address, network }, index): Round => {
    return { index, address, network, hasLeaderboard: true }
  })

  for (const fundingRound of data.fundingRounds) {
    rounds.push({
      index: rounds.length,
      address: fundingRound.id,
      hasLeaderboard: false,
    })
  }
  return rounds
}
