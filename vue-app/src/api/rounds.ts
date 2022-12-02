import sdk from '@/graphql/sdk'
import { utils, Contract } from 'ethers'
import { staticRoundsBaseUrl, staticRoundsFilename, provider } from './core'

import { FundingRound } from './abi'
import { BaseRound } from './round-base'
import { DynamicRound } from './round-dynamic'
import { StaticRound } from './round-static'

export interface Round {
  index: number
  address: string
  isFinalized: boolean
  url?: string
}

async function isRoundFinalized(fundingRoundAddress: string): Promise<boolean> {
  const fundingRound = new Contract(fundingRoundAddress, FundingRound, provider)
  const [isFinalized, isCancelled] = await Promise.all([
    fundingRound.isFinalized(),
    fundingRound.isCancelled(),
  ])

  return isFinalized && !isCancelled
}

function formatRoundUrl(address: string, network: string): string {
  const url = new URL(`${staticRoundsBaseUrl}/${network}/${address}.json`)
  return url.href
}

export class Rounds {
  private rounds: Map<string, Round>

  constructor(rounds: Map<string, Round>) {
    this.rounds = rounds
  }

  // use this to create an instance of Rounds
  static async create() {
    const data = await sdk.GetRounds()
    const rounds = new Map<string, Round>()

    let extraRounds: any[] = []
    if (staticRoundsBaseUrl) {
      const url = new URL(`${staticRoundsBaseUrl}/${staticRoundsFilename}`)
      try {
        extraRounds = await utils.fetchJson(url.href)
      } catch (err) {
        console.error('Error reading', url.href, err)
      }
    }

    for (const round of extraRounds) {
      const key = round.address.toLowerCase()
      rounds.set(key, {
        address: round.address,
        isFinalized: round.isFinalized,
        index: rounds.size,
        url: formatRoundUrl(round.address, round.network),
      })
    }

    for (const fundingRound of data.fundingRounds) {
      if (!rounds.has(fundingRound.id)) {
        const isFinalized = await isRoundFinalized(fundingRound.id)
        rounds.set(fundingRound.id.toLowerCase(), {
          index: rounds.size,
          address: fundingRound.id,
          isFinalized,
        })
      }
    }
    return new Rounds(rounds)
  }

  private get(roundAddress: string): Round | undefined {
    return this.rounds.get(roundAddress.toLowerCase())
  }

  list(): Round[] {
    return Array.from(this.rounds.values()).sort(
      (r1, r2) => r1.index - r2.index
    )
  }

  getRoundIndex(roundAddress: string): number | undefined {
    const round = this.get(roundAddress)
    return round?.index
  }

  async getRound(roundAddress: string): Promise<BaseRound> {
    const round = this.get(roundAddress)
    if (round?.url) {
      const data = await utils.fetchJson(round.url)
      return new StaticRound(data, round.isFinalized)
    } else {
      return new DynamicRound(roundAddress, Boolean(round?.isFinalized))
    }
  }

  isRoundFinalized(roundAddress: string): boolean {
    const round = this.get(roundAddress)
    return round?.isFinalized ?? false
  }
}
