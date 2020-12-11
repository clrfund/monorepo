import { factory, ipfsGatewayUrl } from './core'

export interface Round {
  index: number;
  address: string;
  url?: string;
}

export async function getRounds(): Promise<Round[]> {
  const eventFilter = factory.filters.RoundStarted()
  const events = await factory.queryFilter(eventFilter, 0)
  const extraRounds = (process.env.VUE_APP_EXTRA_ROUNDS || '').split(',')
  const rounds: Round[] = extraRounds.map((ipfsHash: string, index): Round => {
    return { index, address: '', url: `${ipfsGatewayUrl}/ipfs/${ipfsHash}` }
  })
  for (const event of events) {
    if (event.args) {
      rounds.push({
        index: rounds.length,
        address: event.args._round,
      })
    }
  }
  return rounds
}
