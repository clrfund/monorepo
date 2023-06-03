import leaderboardRounds from '@/rounds/rounds.json'

export async function getLeaderboardData(roundAddress: string) {
  const found = leaderboardRounds.find(record => {
    return record.address === roundAddress
  })

  return found ? import(`../rounds/${found.network}/${found.address}`) : null
}
