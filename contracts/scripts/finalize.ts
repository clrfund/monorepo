import fs from 'fs'
import { Wallet } from 'ethers'
import { ethers, network } from 'hardhat'

async function main() {
  let factoryAddress, coordinator
  if (network.name === 'localhost') {
    const state = JSON.parse(fs.readFileSync('state.json').toString())
    factoryAddress = state.factory

    const signers = await ethers.getSigners()
    coordinator = signers[1]
  } else {
    factoryAddress = process.env.FACTORY_ADDRESS || ''
    const coordinatorEthPrivKey = process.env.COORDINATOR_ETH_PK || ''
    coordinator = new Wallet(coordinatorEthPrivKey, ethers.provider)
  }

  const tally = JSON.parse(fs.readFileSync('tally.json').toString())
  const factory = await ethers.getContractAt(
    'FundingRoundFactory',
    factoryAddress,
    coordinator
  )
  const totalSpent = parseInt(tally.totalVoiceCredits.spent)
  const totalSpentSalt = tally.totalVoiceCredits.salt
  const tx = await factory.transferMatchingFunds(totalSpent, totalSpentSalt)
  await tx.wait()
  console.log('Round finalized, totals verified.')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
