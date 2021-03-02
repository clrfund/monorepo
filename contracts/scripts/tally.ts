/* eslint-disable @typescript-eslint/camelcase */
import fs from 'fs'
import { network, ethers } from 'hardhat'
import { Wallet } from 'ethers'
import { genProofs, proveOnChain } from 'maci-cli'

import { getIpfsHash } from '../utils/ipfs'

async function main() {
  // Account #1
  const coordinatorEthPrivKey = process.env.COORDINATOR_ETH_PK || '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d'
  const coordinator = new Wallet(coordinatorEthPrivKey, ethers.provider)
  const stateStr = process.env.CLRFUND_STATE || fs.readFileSync('state.json').toString()
  const state = JSON.parse(stateStr)
  const fundingRound = await ethers.getContractAt(
    'FundingRound',
    state.fundingRound,
    coordinator,
  )
  const maciAddress = await fundingRound.maci()
  const providerUrl = (network.config as any).url

  // Process messages and tally votes
  const results = await genProofs({
    contract: maciAddress,
    eth_provider: providerUrl,
    privkey: state.coordinatorPrivKey,
    tally_file: 'tally.json',
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
    privkey: state.coordinatorPrivKey,
    proof_file: proofs,
  })

  // Publish tally hash
  const tallyHash = await getIpfsHash(tally)
  await fundingRound.publishTallyHash(tallyHash)
  console.log(`Tally hash is ${tallyHash}`)
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
