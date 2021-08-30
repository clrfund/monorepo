import { ipfsGatewayUrl, extraRounds, SUBGRAPH_ENDPOINT } from './core'
import { request, gql } from 'graphql-request'

export interface Round {
  index: number
  address: string
  url?: string
}

export async function getRounds(): Promise<Round[]> {
  const query = gql`
    query {
      fundingRounds {
        id
      }
    }
  `

  const data = await request(SUBGRAPH_ENDPOINT, query)

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
