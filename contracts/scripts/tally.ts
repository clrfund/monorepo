/* eslint-disable @typescript-eslint/camelcase */
import fs from 'fs'
import { network, ethers } from 'hardhat'
import { Wallet } from 'ethers'
import { genProofs, proveOnChain, fetchLogs } from 'maci-cli'

import { getIpfsHash } from '../utils/ipfs'
import { addTallyResultsBatch } from '../utils/maci'

async function main() {
  let fundingRoundAddress: string
  let coordinatorPrivKey: string
  let coordinatorEthPrivKey: string
  let startBlock = 0
  let numBlocksPerRequest = 20000
  const batchSize = Number(process.env.TALLY_BATCH_SIZE) || 20
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
    numBlocksPerRequest =
      Number(process.env.NUM_BLOCKS_PER_REQUEST) || numBlocksPerRequest

    if (process.env.MACI_START_BLOCK) {
      startBlock = Number(process.env.MACI_START_BLOCK)
    } else {
      throw new Error(
        'Please set MACI_START_BLOCK environment variable for fetchLogs'
      )
    }
  }

  const timeMs = new Date().getTime()
  const maciStateFile = `maci_state_${timeMs}.json`
  const logsFile = `maci_logs_${timeMs}.json`
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

  // Fetch Maci logs
  console.log('Fetching MACI logs from block', startBlock)
  await fetchLogs({
    contract: maciAddress,
    eth_provider: providerUrl,
    privkey: coordinatorPrivKey,
    start_block: startBlock,
    num_blocks_per_request: numBlocksPerRequest,
    output: logsFile,
  })
  console.log('MACI logs generated at', logsFile)

  // Process messages and tally votes
  const results = await genProofs({
    contract: maciAddress,
    eth_provider: providerUrl,
    privkey: coordinatorPrivKey,
    tally_file: 'tally.json',
    output: 'proofs.json',
    logs_file: logsFile,
    macistate: maciStateFile,
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

  // Submit results to the funding round contract
  const maci = await ethers.getContractAt('MACI', maciAddress, coordinator)
  const [, , voteOptionTreeDepth] = await maci.treeDepths()
  console.log('Vote option tree depth', voteOptionTreeDepth)

  const startIndex = await fundingRound.totalTallyResults()
  const total = tally.results.tally.length
  console.log('Uploading tally results in batches of', batchSize)
  const addTallyGas = await addTallyResultsBatch(
    fundingRound,
    voteOptionTreeDepth,
    tally,
    batchSize,
    startIndex.toNumber(),
    (processed: number) => {
      console.log(`Processed ${processed} / ${total}`)
    }
  )
  console.log('Tally results uploaded. Gas used:', addTallyGas.toString())
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
