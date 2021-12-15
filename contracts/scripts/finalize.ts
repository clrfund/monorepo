import fs from 'fs'
import { Wallet } from 'ethers'
import { ethers, network } from 'hardhat'

async function main() {
  let fundingRoundAddress, coordinator
  if (network.name === 'localhost') {
    const state = JSON.parse(fs.readFileSync('state.json').toString())
    fundingRoundAddress = state.factory

    const signers = await ethers.getSigners()
    coordinator = signers[1]
  } else {
    fundingRoundAddress = process.env.ROUND_ADDRESS || ''
    const coordinatorEthPrivKey = process.env.COORDINATOR_ETH_PK || ''
    coordinator = new Wallet(coordinatorEthPrivKey, ethers.provider)
  }

  const tally = JSON.parse(fs.readFileSync('tally.json').toString())
  const factory = await ethers.getContractAt(
    'FundingRoundFactory',
    fundingRoundAddress,
    coordinator
  )
  const totalSpent = parseInt(tally.totalVoiceCredits.spent)
  const totalSpentSalt = tally.totalVoiceCredits.salt
  await factory.transferMatchingFunds(totalSpent, totalSpentSalt)
  console.log('Round finalized, totals verified.')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
