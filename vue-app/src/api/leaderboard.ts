import leaderboardRounds from '@/rounds/rounds.json'

type LeaderboardRecord = {
  address: string
  network: string
}

export async function getLeaderboardData(roundAddress: string, network: string) {
  const rounds = leaderboardRounds as LeaderboardRecord[]

  const lowercaseRoundAddress = roundAddress.toLocaleLowerCase()
  const lowercaseNetwork = network.toLowerCase()
  const found = rounds.find((r: LeaderboardRecord) => {
    return r.address.toLowerCase() === lowercaseRoundAddress && r.network.toLowerCase() === lowercaseNetwork
  })

  return found ? import(`../rounds/${found.network}/${found.address}.json`) : null
}
