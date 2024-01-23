/**
 * Script for tallying votes
 *
 * This script can be rerun by passing in --maci-state-file and --tally-file
 * If the --maci-state-file is passed, it will skip MACI log fetching
 * If the --tally-file is passed, it will skip MACI log fetching and proof generation
 *
 * Make sure to set the following environment variables in the .env file
 * 1) WALLET_PRIVATE_KEY or WALLET_MNEMONIC
 *   - coordinator's wallet private key to interact with contracts
 * 2) COORDINATOR_MACISK - coordinator's MACI private key to decrypt messages
 *
 * Sample usage:
 *
 *  HARDHAT_NETWORK=<network> yarn ts-node cli/tally.ts --clrfund <clrfund-address> --maci-tx-hash <hash>
 *
 * To rerun:
 *
 *  yarn ts-node cli/tally.ts --clrfund <clrfund-address> --maci-state-file <file> --tally-file <tally.json>
 */
import { ethers, network } from 'hardhat'
import { BaseContract, getNumber, Signer } from 'ethers'

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
  genLocalState,
  TallyData,
} from '../utils/maci'
import { getMaciStateFilePath, getDirname } from '../utils/misc'
import { program } from 'commander'
import { DEFAULT_CIRCUIT } from '../utils/circuits'
import { FundingRound, Poll, Tally } from '../typechain-types'

program
  .description('Tally votes')
  .requiredOption('-c --clrfund <clrfund>', 'ClrFund contract address')
  .option('-s --maci-state-file <path>', 'MACI state file')
  .option('-f --tally-file <path>', 'The tally file path')
  .option(
    '-b --batch-size <batch size>',
    'The batch size to upload tally result on-chain',
    '10'
  )
  .requiredOption('-u --circuit <type>', 'The circuit type', DEFAULT_CIRCUIT)
  .requiredOption(
    '-d --circuit-directory <dir>',
    'The circuit directory',
    './params'
  )
  .option(
    '-o --output-dir <dir>',
    'The proof output directory',
    './proof_output'
  )
  .option('-t --maci-tx-hash <hash>', 'The MACI creation transaction hash')
  .option('-r --rapidsnark <path>', 'The rapidsnark prover path')
  .option(
    '-n --num-queue-ops <num>',
    'The number of operations for MACI tree merging',
    DEFAULT_SR_QUEUE_OPS
  )
  .option(
    '-k --blocks-per-batch <blocks>',
    'The number of blocks per batch of logs to fetch on-chain',
    DEFAULT_GET_LOG_BATCH_SIZE.toString()
  )
  .option('-z --sleep <seconds>', 'Sleep between log fetch')
  .option('-q --quiet', 'Whether to disable verbose logging', false)
  .parse()

/**
 * Publish the tally IPFS hash on chain if it's not already published
 * @param fundingRoundContract Funding round contract
 * @param tallyData Tally data
 */
async function publishTallyHash(
  fundingRoundContract: FundingRound,
  tallyData: TallyData
) {
  const tallyHash = await getIpfsHash(tallyData)
  console.log(`Tally hash is ${tallyHash}`)

  const tallyHashOnChain = await fundingRoundContract.tallyHash()
  if (tallyHashOnChain !== tallyHash) {
    const tx = await fundingRoundContract.publishTallyHash(tallyHash)
    const receipt = await tx.wait()
    if (receipt?.status !== 1) {
      throw new Error('Failed to publish tally hash on chain')
    }

    console.log('Published tally hash on chain')
  }
}
/**
 * Submit tally data to funding round contract
 * @param fundingRoundContract Funding round contract
 * @param batchSize Number of tally results per batch
 * @param tallyData Tally file content
 */
async function submitTallyResults(
  fundingRoundContract: FundingRound,
  recipientTreeDepth: number,
  tallyData: TallyData,
  batchSize: number
) {
  const startIndex = await fundingRoundContract.totalTallyResults()
  const total = tallyData.results.tally.length
  console.log('Uploading tally results in batches of', batchSize)
  const addTallyGas = await addTallyResultsBatch(
    fundingRoundContract,
    recipientTreeDepth,
    tallyData,
    getNumber(batchSize),
    getNumber(startIndex),
    (processed: number) => {
      console.log(`Processed ${processed} / ${total}`)
    }
  )
  console.log('Tally results uploaded. Gas used:', addTallyGas.toString())
}

/**
 * Return the current funding round contract handle
 * @param clrfund ClrFund contract address
 * @param coordinator Signer who will interact with the funding round contract
 */
async function getFundingRound(
  clrfund: string,
  coordinator: Signer
): Promise<FundingRound> {
  const clrfundContract = await ethers.getContractAt(
    'ClrFund',
    clrfund,
    coordinator
  )

  const fundingRound = await clrfundContract.getCurrentRound()
  const fundingRoundContract = await ethers.getContractAt(
    'FundingRound',
    fundingRound,
    coordinator
  )

  return fundingRoundContract as BaseContract as FundingRound
}

/**
 * Get the recipient tree depth (aka vote option tree depth)
 * @param fundingRoundContract Funding round conract
 * @returns Recipient tree depth
 */
async function getRecipientTreeDepth(
  fundingRoundContract: FundingRound
): Promise<number> {
  const pollAddress = await fundingRoundContract.poll()
  const pollContract = await ethers.getContractAt('Poll', pollAddress)
  const treeDepths = await (pollContract as BaseContract as Poll).treeDepths()
  const voteOptionTreeDepth = treeDepths.voteOptionTreeDepth
  return getNumber(voteOptionTreeDepth)
}

/**
 * Get the message processor contract address from the tally contract
 * @param tallyAddress Tally contract address
 * @returns Message processor contract address
 */
async function getMessageProcessorAddress(
  tallyAddress: string
): Promise<string> {
  const tallyContract = (await ethers.getContractAt(
    'Tally',
    tallyAddress
  )) as BaseContract as Tally

  const messageProcessorAddress = await tallyContract.messageProcessor()
  return messageProcessorAddress
}

/**
 * Main tally logic
 */
async function main(args: any) {
  const {
    clrfund,
    batchSize,
    maciStateFile,
    tallyFile,
    outputDir,
    circuit,
    circuitDirectory,
    rapidsnark,
    maciTxHash,
    numQueueOps,
    blocksPerBatch,
    sleep,
    quiet,
  } = args

  console.log('Verbose logging disabled:', quiet)

  const [coordinator] = await ethers.getSigners()
  console.log('Coordinator address: ', coordinator.address)

  const coordinatorMacisk = process.env.COORDINATOR_MACISK
  if (!coordinatorMacisk) {
    throw Error('Env. variable COORDINATOR_MACISK not set')
  }

  const fundingRoundContract = await getFundingRound(clrfund, coordinator)
  console.log('Funding round contract', fundingRoundContract.target)

  const recipientTreeDepth = await getRecipientTreeDepth(fundingRoundContract)

  const pollId = await fundingRoundContract.pollId()
  console.log('PollId', pollId)

  const maciAddress = await fundingRoundContract.maci()
  console.log('MACI address', maciAddress)

  const tallyAddress = await fundingRoundContract.tally()
  const messageProcessorAddress = await getMessageProcessorAddress(tallyAddress)

  const providerUrl = (network.config as any).url

  const outputPath = maciStateFile
    ? maciStateFile
    : getMaciStateFilePath(outputDir)

  await mergeMaciSubtrees({
    maciAddress,
    pollId,
    numQueueOps,
    quiet,
  })

  let tallyFilePath: string = tallyFile || ''
  if (!tallyFile) {
    if (!maciStateFile) {
      await genLocalState({
        quiet,
        outputPath,
        pollId,
        maciContractAddress: maciAddress,
        coordinatorPrivateKey: coordinatorMacisk,
        ethereumProvider: providerUrl,
        transactionHash: maciTxHash,
        blockPerBatch: blocksPerBatch,
        sleep,
      })
    }

    const genProofArgs = getGenProofArgs({
      maciAddress,
      pollId,
      coordinatorMacisk,
      rapidsnark,
      circuitType: circuit,
      circuitDirectory,
      outputDir,
      blocksPerBatch: getNumber(blocksPerBatch),
      maciTxHash,
      maciStateFile: outputPath,
      quiet,
    })
    await genProofs(genProofArgs)
    tallyFilePath = genProofArgs.tallyFile
  }

  const tally = JSONFile.read(tallyFilePath) as TallyData
  const proofDir = getDirname(tallyFilePath)
  console.log('Proof directory', proofDir)

  // proveOnChain if not already processed
  await proveOnChain({
    pollId,
    proofDir,
    subsidyEnabled: false,
    maciAddress,
    messageProcessorAddress,
    tallyAddress,
    quiet,
  })

  // Publish tally hash if it is not already published
  await publishTallyHash(fundingRoundContract, tally)

  // Submit tally results to the funding round contract
  // This function can be re-run from where it left off
  await submitTallyResults(
    fundingRoundContract,
    recipientTreeDepth,
    tally,
    batchSize
  )
}

main(program.opts())
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
