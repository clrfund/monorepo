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
    coordinator = signers[0]
  } else {
    factoryAddress = process.env.FACTORY_ADDRESS || ''
    // default to the first account
    const coordinatorEthPrivKey =
      process.env.COORDINATOR_ETH_PK ||
      '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
    coordinator = new Wallet(coordinatorEthPrivKey, ethers.provider)
  }

  const tally = JSON.parse(fs.readFileSync('tally.json').toString())
  const factory = await ethers.getContractAt(
    'FundingRoundFactory',
    factoryAddress,
    coordinator
  )
  console.log('Funding round factory address', factory.address)

  const currentRoundAddress = await factory.getCurrentRound()
  const fundingRound = await ethers.getContractAt(
    'FundingRound',
    currentRoundAddress,
    coordinator
  )
  console.log('Current round', fundingRound.address)

  const maciAddress = await fundingRound.maci()
  const maci = await ethers.getContractAt('MACI', maciAddress, coordinator)
  const [, , voteOptionTreeDepth] = await maci.treeDepths()
  console.log('Vote option tree depth', voteOptionTreeDepth)

  const batchSize = Number(process.env.TALLY_BATCH_SIZE) || 20
  const startIndex = await fundingRound.totalTallyResults()
  const total = tally.results.tally.length
  console.log('Adding tally results in batches of', batchSize)
  const addTallyGas = await addTallyResultsBatch(
    fundingRound,
    voteOptionTreeDepth,
    tally,
    batchSize,
    startIndex.toNumber(),
    (processed) => {
      console.log(`Processed ${processed} / ${total}`)
    }
  )
  console.log('Tally results added. Gas used:', addTallyGas.toString())

  const totalSpent = parseInt(tally.totalVoiceCredits.spent)
  const totalSpentSalt = tally.totalVoiceCredits.salt
  const tx = await factory.transferMatchingFunds(totalSpent, totalSpentSalt)
  const receipt = await tx.wait()
  console.log(
    'Round finalized, totals verified. Gas used:',
    receipt.gasUsed.toString()
  )
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
