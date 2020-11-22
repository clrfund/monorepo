/* eslint-disable @typescript-eslint/camelcase */
import fs from 'fs'
import { network, ethers } from 'hardhat'
import { processMessages as processCmd, tally as tallyCmd } from 'maci-cli'

import { getIpfsHash } from '../utils/ipfs'

async function main() {
  const [, coordinator] = await ethers.getSigners()
  const state = JSON.parse(fs.readFileSync('state.json').toString())
  const fundingRound = await ethers.getContractAt('FundingRound', state.fundingRound)
  const maciAddress = await fundingRound.maci()
  const providerUrl = (network.config as any).url
  // Account #1
  const coordinatorEthPrivKey = process.env.COORDINATOR_ETH_PK || '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d'

  // Process messages
  const randomStateLeaf = await processCmd({
    contract: maciAddress,
    eth_privkey: coordinatorEthPrivKey,
    eth_provider: providerUrl,
    privkey: state.coordinator.privKey,
    repeat: true,
  })

  // Tally votes
  const tally: any = await tallyCmd({
    contract: maciAddress,
    eth_privkey: coordinatorEthPrivKey,
    eth_provider: providerUrl,
    privkey: state.coordinator.privKey,
    repeat: true,
    current_results_salt: '0x0',
    current_total_vc_salt: '0x0',
    current_per_vo_vc_salt: '0x0',
    leaf_zero: randomStateLeaf,
    tally_file: 'tally.json',
  })

  // Publish tally hash
  const tallyHash = await getIpfsHash(tally)
  await fundingRound.connect(coordinator).publishTallyHash(tallyHash)
  console.log(`Tally hash is ${tallyHash}`)

  // Finalize the round
  const factory = await ethers.getContractAt('FundingRoundFactory', state.factory)
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
