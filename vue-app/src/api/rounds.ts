import { factory } from './core'

export interface Round {
  index: number;
  address: string;
}

export async function getRounds(): Promise<Round[]> {
  const eventFilter = factory.filters.RoundStarted()
  const events = await factory.queryFilter(eventFilter, 0)
  const rounds: Round[] = []
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
