import sdk from '@/graphql/sdk'
import { utils } from 'ethers'
import { staticRoundsBaseUrl, staticRoundsFilename } from './core'
import { RoundStatus } from './round'

import { BaseRound } from './round-base'
import { DynamicRound } from './round-dynamic'
import { StaticRound } from './round-static'

export interface Round {
  index: number
  address: string
  status: string
  url?: string
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
        /* eslint-disable-next-line no-console */
        console.error('Error reading', url.href, err)
      }
    }

    for (const round of extraRounds) {
      const key = round.address.toLowerCase()
      const status = round.isFinalized
        ? RoundStatus.Finalized
        : RoundStatus.Cancelled
      rounds.set(key, {
        address: round.address,
        status,
        index: rounds.size,
        url: formatRoundUrl(round.address, round.network),
      })
    }

    for (const fundingRound of data.fundingRounds) {
      if (!rounds.has(fundingRound.id)) {
        const isFinalized = !!fundingRound.isFinalized
        const isCancelled = !!fundingRound.isCancelled
        const status = isCancelled
          ? RoundStatus.Cancelled
          : isFinalized
          ? RoundStatus.Finalized
          : 'Active'
        rounds.set(fundingRound.id.toLowerCase(), {
          index: rounds.size,
          address: fundingRound.id,
          status,
        })
      }
    }
    return new Rounds(rounds)
  }

  private get(roundAddress: string): Round | undefined {
    return roundAddress
      ? this.rounds.get(roundAddress.toLowerCase())
      : undefined
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

  async getRound(roundAddress: string): Promise<BaseRound | null> {
    const round = this.get(roundAddress)
    if (!round) {
      return null
    }

    const isFinalized = round.status === RoundStatus.Finalized
    if (round.url) {
      const data = await utils.fetchJson(round.url)
      return new StaticRound(data, isFinalized)
    } else {
      return new DynamicRound(roundAddress, isFinalized)
    }
  }

  isRoundFinalized(roundAddress: string): boolean {
    const round = this.get(roundAddress)
    if (!round) {
      return false
    }

    return round.status === RoundStatus.Finalized
  }

  isRoundCancelled(roundAddress: string): boolean {
    const round = this.get(roundAddress)
    if (!round) {
      return false
    }

    return round.status === RoundStatus.Cancelled
  }
}
