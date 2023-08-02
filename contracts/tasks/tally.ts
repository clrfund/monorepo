import { task, types } from 'hardhat/config'
import fs from 'fs'
import { Contract, Wallet } from 'ethers'
import { genProofs, proveOnChain, fetchLogs } from 'maci-cli'

import { getIpfsHash } from '../utils/ipfs'
import { addTallyResultsBatch } from '../utils/maci'

/**
 * Tally votes for the specified funding round. This task can be rerun by
 * passing in additional parameters: --maci-logs, --maci-state-file
 *
 * Make sure to set the following environment variables in the .env file
 * if not running test using the localhost network
 * 1) COORDINATOR_ETH_PK - coordinator's wallet private key to interact with contracts
 * 2) COORDINATOR_PK - coordinator's MACI private key to decrypt messages
 *
 * Sample usage:
 *
 *  yarn hardhat tally --round-address <address> --start-block <maci-start-block> --network <network>
 *
 * To rerun:
 *
 *  yarn hardhat tally --round-address <address> --network <network> \
 *    --maci-logs <maci-log-files> --maci-state-file <maci-state-file>
 */

type TallyArgs = {
  fundingRound: Contract
  coordinatorMaciPrivKey: string
  coordinator: Wallet
  startBlock: number
  numBlocksPerRequest: number
  batchSize: number
  logsFile: string
  maciStateFile: string
  providerUrl: string
  voteOptionTreeDepth: number
}

async function main(args: TallyArgs) {
  const {
    fundingRound,
    coordinatorMaciPrivKey,
    coordinator,
    batchSize,
    logsFile,
    maciStateFile,
    providerUrl,
    voteOptionTreeDepth,
  } = args

  console.log('funding round address', fundingRound.address)
  const maciAddress = await fundingRound.maci()
  console.log('maci address', maciAddress)

  const publishedTallyHash = await fundingRound.tallyHash()

  let tally

  if (!publishedTallyHash) {
    // Process messages and tally votes
    const results = await genProofs({
      contract: maciAddress,
      eth_provider: providerUrl,
      privkey: coordinatorMaciPrivKey,
      tally_file: 'tally.json',
      output: 'proofs.json',
      logs_file: logsFile,
      macistate: maciStateFile,
    })
    if (!results) {
      throw new Error('generation of proofs failed')
    }
    const { proofs } = results
    tally = results.tally

    // Submit proofs to MACI contract
    await proveOnChain({
      contract: maciAddress,
      eth_privkey: coordinator.privateKey,
      eth_provider: providerUrl,
      privkey: coordinatorMaciPrivKey,
      proof_file: proofs,
    })

    // Publish tally hash
    const tallyHash = await getIpfsHash(tally)
    await fundingRound.publishTallyHash(tallyHash)
    console.log(`Tally hash is ${tallyHash}`)
  } else {
    // read the tally.json file
    console.log(`Tally hash is ${publishedTallyHash}`)
    try {
      console.log(`Reading tally.json file...`)
      const tallyStr = fs.readFileSync('tally.json').toString()
      tally = JSON.parse(tallyStr)
    } catch (err) {
      console.log('Failed to get tally file', publishedTallyHash, err)
      throw err
    }
  }

  // Submit results to the funding round contract
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

task('tally', 'Tally votes for the current round')
  .addParam(
    'roundAddress',
    'The funding round contract address',
    '',
    types.string
  )
  .addParam(
    'batchSize',
    'Number of tally result to submit on chain per batch',
    20,
    types.int
  )
  .addParam(
    'numBlocksPerRequest',
    'The number of blocks to fetch for each get log request',
    200000,
    types.int
  )
  .addParam(
    'startBlock',
    'The first block containing the MACI events',
    0,
    types.int
  )
  .addOptionalParam('maciLogs', 'The file path containing the MACI logs')
  .addOptionalParam(
    'maciStateFile',
    'The MACI state file, genProof will continue from it last run'
  )
  .setAction(
    async (
      {
        roundAddress,
        maciLogs,
        maciStateFile,
        batchSize,
        startBlock,
        numBlocksPerRequest,
      },
      { ethers, network }
    ) => {
      let fundingRoundAddress = roundAddress
      let coordinatorMaciPrivKey = process.env.COORDINATOR_PK || ''
      let coordinatorEthPrivKey =
        process.env.COORDINATOR_ETH_PK || process.env.WALLET_PRIVATE_KEY || ''
      const providerUrl = (network.config as any).url

      if (network.name === 'localhost') {
        const stateStr = fs.readFileSync('state.json').toString()
        const state = JSON.parse(stateStr)
        fundingRoundAddress = state.fundingRound
        coordinatorMaciPrivKey = state.coordinatorPrivKey
        // default to the first account
        coordinatorEthPrivKey = coordinatorEthPrivKey
          ? coordinatorEthPrivKey
          : '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
      } else {
        if (!coordinatorEthPrivKey) {
          throw Error(
            `Please set the environment variable COORDINATOR_ETH_PK, the coordinator's wallet private key`
          )
        }

        if (!coordinatorMaciPrivKey) {
          throw Error(
            `Please set the environment variable COORDINATOR_PK, the coordinator's MACI private key`
          )
        }
      }

      if (!fundingRoundAddress) {
        throw Error(`The '--round-address' parameter is required`)
      }

      console.log('Funding round address: ', fundingRoundAddress)
      const coordinator = new Wallet(coordinatorEthPrivKey, ethers.provider)
      console.log('Coordinator address: ', coordinator.address)

      const fundingRound = await ethers.getContractAt(
        'FundingRound',
        fundingRoundAddress,
        coordinator
      )

      const maciAddress = await fundingRound.maci()
      const maci = await ethers.getContractAt('MACI', maciAddress, coordinator)
      const [, , voteOptionTreeDepth] = await maci.treeDepths()
      console.log('Vote option tree depth', voteOptionTreeDepth)

      const timeMs = new Date().getTime()
      const logsFile = maciLogs ? maciLogs : `maci_logs_${timeMs}.json`
      if (!maciLogs) {
        const maciAddress = await fundingRound.maci()
        console.log('maci address', maciAddress)

        // Fetch Maci logs
        console.log('Fetching MACI logs from block', startBlock)
        await fetchLogs({
          contract: maciAddress,
          eth_provider: (network.config as any).url,
          privkey: coordinatorMaciPrivKey,
          start_block: startBlock,
          num_blocks_per_request: numBlocksPerRequest,
          output: logsFile,
        })
        console.log('MACI logs generated at', logsFile)
      }

      await main({
        fundingRound,
        coordinatorMaciPrivKey,
        coordinator,
        startBlock,
        numBlocksPerRequest,
        batchSize,
        voteOptionTreeDepth: Number(voteOptionTreeDepth),
        logsFile,
        providerUrl,
        maciStateFile: maciStateFile
          ? maciStateFile
          : `maci_state_${timeMs}.json`,
      })
    }
  )
