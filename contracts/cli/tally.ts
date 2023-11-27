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
import { ethers, network, config } from 'hardhat'
import { Contract } from 'ethers'

import { DEFAULT_SR_QUEUE_OPS } from '../utils/constants'
import { getIpfsHash } from '../utils/ipfs'
import { JSONFile } from '../utils/JSONFile'
import { deployMessageProcesorAndTally } from '../utils/deployment'
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
  .option('-h --maci-tx-hash <hash>', 'The MACI creation transaction hash')
  .option('-r --rapid-snark-directory <dir>', 'The rapidsnark directory')
  .option(
    '-n --num-queue-ops <num>',
    'The number of operation for tree merging',
    DEFAULT_SR_QUEUE_OPS
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
    rapidSnarkDirectory,
    maciTxHash,
    numQueueOps,
  } = args

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
      providerUrl,
      pollId,
      coordinatorMacisk,
      maciTxHash,
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
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
