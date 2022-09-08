import fs from 'fs'
import { Wallet } from 'ethers'
import { ethers, network } from 'hardhat'
import { addTallyResultsBatch } from '../utils/maci'

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

  const currentRoundAddress = await factory.getCurrentRound()
  const fundingRound = await ethers.getContractAt(
    'FundingRound',
    currentRoundAddress,
    coordinator
  )

  const maciAddress = await fundingRound.maci()
  const maci = await ethers.getContractAt('MACI', maciAddress, coordinator)
  const [, , voteOptionTreeDepth] = await maci.treeDepths()

  const batchSize = Number(process.env.TALLY_BATCH_SIZE) || 20
  await addTallyResultsBatch(
    fundingRound,
    voteOptionTreeDepth,
    tally,
    batchSize
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
