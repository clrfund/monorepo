/* eslint-disable @typescript-eslint/camelcase */
import fs from 'fs'
import { network, ethers } from 'hardhat'
import { Wallet } from 'ethers'
import { genProofs, proveOnChain } from 'maci-cli'

import { getIpfsHash } from '../utils/ipfs'

async function main() {
  let fundingRoundAddress: string
  let coordinatorPrivKey: string
  let coordinatorEthPrivKey: string
  if (network.name === 'localhost') {
    const stateStr = fs.readFileSync('state.json').toString()
    const state = JSON.parse(stateStr)
    fundingRoundAddress = state.fundingRound
    coordinatorPrivKey = state.coordinatorPrivKey
    // default to the first account
    coordinatorEthPrivKey =
      process.env.COORDINATOR_ETH_PK ||
      '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
  } else {
    fundingRoundAddress = process.env.ROUND_ADDRESS || ''
    coordinatorPrivKey = process.env.COORDINATOR_PK || ''
    coordinatorEthPrivKey = process.env.COORDINATOR_ETH_PK || ''
  }
  const coordinator = new Wallet(coordinatorEthPrivKey, ethers.provider)
  const fundingRound = await ethers.getContractAt(
    'FundingRound',
    fundingRoundAddress,
    coordinator
  )
  console.log('funding round address', fundingRound.address)
  const maciAddress = await fundingRound.maci()
  console.log('maci address', maciAddress)
  const providerUrl = (network.config as any).url

  // Process messages and tally votes
  const results = await genProofs({
    contract: maciAddress,
    eth_provider: providerUrl,
    privkey: coordinatorPrivKey,
    tally_file: 'tally.json',
    output: 'proofs.json',
  })
  if (!results) {
    throw new Error('generation of proofs failed')
  }
  const { proofs, tally } = results

  // Submit proofs to MACI contract
  await proveOnChain({
    contract: maciAddress,
    eth_privkey: coordinatorEthPrivKey,
    eth_provider: providerUrl,
    privkey: coordinatorPrivKey,
    proof_file: proofs,
  })

  // Publish tally hash
  const tallyHash = await getIpfsHash(tally)
  await fundingRound.publishTallyHash(tallyHash)
  console.log(`Tally hash is ${tallyHash}`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
