import leaderboardRounds from '@/rounds/rounds.json'
import { isSameAddress } from '@/utils/accounts'

type LeaderboardRecord = {
  address: string
  network: string
}

function isSameNetwork(network1 = '', network2 = ''): boolean {
  return network1.toLowerCase() === network2.toLowerCase()
}

export async function getLeaderboardData(roundAddress: string, network?: string) {
  const rounds = leaderboardRounds as LeaderboardRecord[]
  const checkNetwork = Boolean(network)

  const found = rounds.find((r: LeaderboardRecord) => {
    return isSameAddress(r.address, roundAddress) && (!checkNetwork || isSameNetwork(network, r.network))
  })

  if (!found) {
    return null
  }

  const data = await import(`../rounds/${found.network}/${found.address}.json`)
  if (!data.round) {
    data.round = {}
  }
  data.round.network = found.network
  return data
}
