/* eslint-disable @typescript-eslint/camelcase */
import fs from 'fs'
import { network, ethers } from '@nomiclabs/buidler'
import { processMessages as processCmd, tally as tallyCmd } from 'maci-cli'

async function main() {
  const state = JSON.parse(fs.readFileSync('state.json').toString())
  const fundingRound = await ethers.getContractAt('FundingRound', state.fundingRound)
  const maciAddress = await fundingRound.maci()
  const providerUrl = (network.config as any).url
  const coordinatorEthPrivKey = process.env.COORDINATOR_ETH_PK || '0xd49743deccbccc5dc7baa8e69e5be03298da8688a15dd202e20f15d5e0e9a9fb'

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
