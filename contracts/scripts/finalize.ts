import fs from 'fs'
import { ethers } from 'hardhat'

async function main() {
  const [deployer] = await ethers.getSigners()
  const state = JSON.parse(fs.readFileSync('state.json').toString())
  const tally = JSON.parse(fs.readFileSync('tally.json').toString())
  const factory = await ethers.getContractAt('FundingRoundFactory', state.factory, deployer)
  const totalSpent = parseInt(tally.totalVoiceCredits.spent)
  const totalSpentSalt = tally.totalVoiceCredits.salt
  await factory.transferMatchingFunds(totalSpent, totalSpentSalt)
  console.log('Round finalized, totals verified.')
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
