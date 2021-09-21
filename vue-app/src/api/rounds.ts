import sdk from '@/graphql/sdk'
import { ipfsGatewayUrl, extraRounds } from './core'

export interface Round {
  index: number
  address: string
  url?: string
}
//TODO: update to take factory address as a parameter
export async function getRounds(): Promise<Round[]> {
  //TODO: updateto pass factory address as a parameter, default to env. variable
  //NOTE: why not instantiate the sdk here?
  const data = await sdk.GetRounds()

  const rounds: Round[] = extraRounds.map((ipfsHash: string, index): Round => {
    return { index, address: '', url: `${ipfsGatewayUrl}/ipfs/${ipfsHash}` }
  })

  for (const fundingRound of data.fundingRounds) {
    rounds.push({
      index: rounds.length,
      address: fundingRound.id,
    })
  }
  return rounds
}
