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
import { ethers, network, config } from 'hardhat'
import { Contract, Signer } from 'ethers'

import { DEFAULT_SR_QUEUE_OPS } from '../utils/constants'
import { getIpfsHash } from '../utils/ipfs'
import { JSONFile } from '../utils/JSONFile'
import {
  deployContract,
  deployPoseidonLibraries,
  deployMessageProcesorAndTally,
} from '../utils/deployment'
import {
  getGenProofArgs,
  genProofs,
  proveOnChain,
  addTallyResultsBatch,
  mergeMaciSubtrees,
} from '../utils/maci'
import { getTalyFilePath } from '../utils/misc'

/**
 * Read variables from the environment file needed
 * to run the tally script
 *
 * @returns data used to run the tally script
 */
function readFromEnvironment(): {
  clrfund: string
  batchSize: number
  circuit: string
  circuitDirectory: string
  maciTransactionHash?: string
  rapidSnarkDirectory?: string
  outputDir: string
  stateFile?: string
  coordinatorMacisk: string
  numQueueOps: number
} {
  if (!process.env.CLRFUND) {
    console.log('process env', process.env)
    throw Error('Env. variable CLRFUND not set')
  }

  if (!process.env.CIRCUIT_DIRECTORY) {
    throw Error('Env. variable CIRCUIT_DIRECTORY not set')
  }

  if (!process.env.COORDINATOR_MACISK) {
    throw Error('Env. variable COORDINATOR_MACISK not set')
  }

  return {
    clrfund: process.env.CLRFUND || '',
    batchSize: Number(process.env.BATCH_SIZE || '20'),
    circuit: process.env.CIRCUIT_TYPE || 'micro',
    circuitDirectory: process.env.CIRCUIT_DIRECTORY || '',
    maciTransactionHash: process.env.MACI_TRANSACTION_HASH,
    rapidSnarkDirectory: process.env.RAPIDSNARK_DIRECTORY,
    outputDir: process.env.OUTPUT_DIR || './output',
    stateFile: process.env.STATE_FILE,
    coordinatorMacisk: process.env.COORDINATOR_MACISK || '',
    numQueueOps: Number(process.env.NUM_QUEUE_OPS || DEFAULT_SR_QUEUE_OPS),
  }
}

/**
 * Main tally logic
 */
async function main() {
  const {
    clrfund,
    batchSize,
    stateFile,
    outputDir,
    circuit,
    circuitDirectory,
    rapidSnarkDirectory,
    maciTransactionHash,
    coordinatorMacisk,
    numQueueOps,
  } = readFromEnvironment()

  const [coordinator] = await ethers.getSigners()
  console.log('Coordinator address: ', coordinator.address)

  const providerUrl = (network.config as any).url
  console.log('providerUrl', providerUrl)

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
  console.log('Funding round contract', fundingRoundContract.address)

  const publishedTallyHash = await fundingRoundContract.tallyHash()
  console.log('publishedTallyHash', publishedTallyHash)

  let tally
  if (!publishedTallyHash) {
    const pollIdBN = await fundingRoundContract.pollId()
    const pollId = pollIdBN.toString()
    console.log('PollId', pollId)

    const maciAddress = await fundingRoundContract.maci()
    console.log('MACI address', maciAddress)

    // Generate proof and tally file
    const genProofArgs = getGenProofArgs({
      maciAddress,
      providerUrl,
      pollId,
      coordinatorMacisk,
      maciTxHash: maciTransactionHash,
      rapidSnarkDirectory,
      circuitType: circuit,
      circuitDirectory,
      outputDir,
    })
    console.log('genProofsArg', genProofArgs)

    await mergeMaciSubtrees(maciAddress, pollId, numQueueOps)
    console.log('Completed tree merge')

    await genProofs(genProofArgs)
    console.log('Completed genProofs')

    tally = JSONFile.read(genProofArgs.tally_file)
    if (stateFile) {
      // Save tally file in the state
      JSONFile.update(stateFile, { tallyFile: genProofArgs.tally_file })
    }

    // deploy the MessageProcessor and Tally contracts used by proveOnChain
    const { mpContract, tallyContract } = await deployMessageProcesorAndTally({
      artifactsPath: config.paths.artifacts,
      ethers,
      signer: coordinator,
    })
    console.log('MessageProcessor', mpContract.address)
    console.log('Tally Contract', tallyContract.address)

    try {
      // Submit proofs to MACI contract
      await proveOnChain({
        contract: maciAddress,
        poll_id: pollId,
        mp: mpContract.address,
        tally: tallyContract.address,
        //subsidy: tallyContractAddress, // TODO: make subsidy optional
        proof_dir: outputDir,
      })
    } catch (e) {
      console.error('proveOnChain failed')
      throw e
    }

    // set the Tally contract address for verifying tally result on chain
    const setTallyTx = await fundingRoundContract.setTally(
      tallyContract.address
    )
    await setTallyTx.wait()
    console.log('Tally contract set in funding round')

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
