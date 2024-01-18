/**
 * Script for tallying votes
 *
 * This script can be rerun by passing in additional parameters:
 * --maci-logs, --maci-state-file
 *
 * Make sure to set the following environment variables in the .env file
 * if not running test using the localhost network
 * 1) COORDINATOR_ETH_PK - coordinator's wallet private key to interact with contracts
 * 2) COORDINATOR_MACISK - coordinator's MACI private key to decrypt messages
 *
 * Sample usage:
 *
 *  yarn ts-node cli/tally.ts --round-address <address> --start-block <maci-start-block>
 *
 * To rerun:
 *
 *  yarn ts-node cli/tally.ts --round-address <address>
 */
import { ethers } from 'hardhat'
import { Contract } from 'ethers'

import {
  DEFAULT_SR_QUEUE_OPS,
  DEFAULT_GET_LOG_BATCH_SIZE,
} from '../utils/constants'
import { getIpfsHash } from '../utils/ipfs'
import { JSONFile } from '../utils/JSONFile'
import {
  getGenProofArgs,
  genProofs,
  proveOnChain,
  addTallyResultsBatch,
  mergeMaciSubtrees,
} from '../utils/maci'
import { getTalyFilePath } from '../utils/misc'
import { program } from 'commander'
import { DEFAULT_CIRCUIT } from '../utils/circuits'

program
  .description('Tally votes')
  .requiredOption('-c --clrfund <clrfund>', 'ClrFund contract address')
  .option(
    '-b --batch-size <batch size>',
    'The batch size to upload tally result on-chain',
    '10'
  )
  .requiredOption('-c --circuit <type>', 'The circuit type', DEFAULT_CIRCUIT)
  .requiredOption('-d --circuit-directory <dir>', 'The circuit directory')
  .option(
    '-s --state-file <file>',
    'File to store the ClrFundDeployer address for e2e testing'
  )
  .requiredOption('-o --output-dir <dir>', 'The proof output directory')
  .option('-t --maci-tx-hash <hash>', 'The MACI creation transaction hash')
  .option('-r --rapid-snark <path>', 'The rapidsnark prover path')
  .option(
    '-n --num-queue-ops <num>',
    'The number of operation for tree merging',
    DEFAULT_SR_QUEUE_OPS
  )
  .option(
    '-k --blocks-per-batch <blocks>',
    'The number of blocks per batch of logs to fetch on-chain',
    DEFAULT_GET_LOG_BATCH_SIZE.toString()
  )
  .parse()

/**
 * Main tally logic
 */
async function main(args: any) {
  const {
    clrfund,
    batchSize,
    stateFile,
    outputDir,
    circuit,
    circuitDirectory,
    rapidSnark,
    maciTxHash,
    numQueueOps,
    blocksPerBatch,
  } = args

  const [coordinator] = await ethers.getSigners()
  console.log('Coordinator address: ', coordinator.address)

  let clrfundContract: Contract
  try {
    clrfundContract = await ethers.getContractAt(
      'ClrFund',
      clrfund,
      coordinator
    )
  } catch (e) {
    console.error('Error accessing ClrFund Contract at', clrfund)
    throw e
  }

  const fundingRound = await clrfundContract.getCurrentRound()
  const fundingRoundContract = await ethers.getContractAt(
    'FundingRound',
    fundingRound,
    coordinator
  )
  console.log('Funding round contract', fundingRoundContract.target)

  const publishedTallyHash = await fundingRoundContract.tallyHash()
  console.log('publishedTallyHash', publishedTallyHash)

  let tally
  if (!publishedTallyHash) {
    const coordinatorMacisk = process.env.COORDINATOR_MACISK
    if (!coordinatorMacisk) {
      throw Error('Env. variable COORDINATOR_MACISK not set')
    }

    const pollIdBN = await fundingRoundContract.pollId()
    const pollId = pollIdBN.toString()
    console.log('PollId', pollId)

    const maciAddress = await fundingRoundContract.maci()
    console.log('MACI address', maciAddress)

    // Generate proof and tally file
    const genProofArgs = getGenProofArgs({
      maciAddress,
      pollId,
      coordinatorMacisk,
      rapidSnark,
      circuitType: circuit,
      circuitDirectory,
      outputDir,
      blocksPerBatch: Number(blocksPerBatch),
      maciTxHash,
    })
    console.log('genProofsArg', genProofArgs)

    await mergeMaciSubtrees({ maciAddress, pollId, numOperations: numQueueOps })
    console.log('Completed tree merge')

    await genProofs(genProofArgs)
    console.log('Completed genProofs')

    tally = JSONFile.read(genProofArgs.tallyFile)
    if (stateFile) {
      // Save tally file in the state
      JSONFile.update(stateFile, { tallyFile: genProofArgs.tallyFile })
    }

    try {
      const pollAddress = await fundingRoundContract.poll()
      const pollContract = await ethers.getContractAt('Poll', pollAddress)
      const tallyAddress = await pollContract.tally()
      const tallyContact = await ethers.getContractAt('Tally', tallyAddress)
      const messageProcessorAddress = await tallyContact.mp()
      // Submit proofs to MACI contract
      await proveOnChain({
        pollId,
        proofDir: genProofArgs.outputDir,
        subsidyEnabled: false,
        maciAddress,
        messageProcessorAddress,
        tallyAddress,
      })
    } catch (e) {
      console.error('proveOnChain failed')
      throw e
    }

    // Publish tally hash
    const tallyHash = await getIpfsHash(tally)
    await fundingRoundContract.publishTallyHash(tallyHash)
    console.log(`Tally hash is ${tallyHash}`)
  } else {
    // read the tally.json file
    console.log(`Tally hash is ${publishedTallyHash}`)
    try {
      console.log(`Reading tally.json file...`)
      const tallyFile = getTalyFilePath(outputDir)
      tally = JSONFile.read(tallyFile)
    } catch (err) {
      console.log('Failed to get tally file', publishedTallyHash)
      throw err
    }
  }

  // Submit results to the funding round contract
  const startIndex = await fundingRoundContract.totalTallyResults()
  const total = tally.results.tally.length
  console.log('Uploading tally results in batches of', batchSize)
  const addTallyGas = await addTallyResultsBatch(
    fundingRoundContract,
    3,
    tally,
    Number(batchSize),
    startIndex.toNumber(),
    (processed: number) => {
      console.log(`Processed ${processed} / ${total}`)
    }
  )
  console.log('Tally results uploaded. Gas used:', addTallyGas.toString())
}

main(program.opts())
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
