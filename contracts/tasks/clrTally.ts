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
 *  yarn hardhat clr-tally --clrfund <clrfund-address> --maci-tx-hash <hash> --network <network>
 *
 * To rerun:
 *
 *  yarn hardhat clr-tally --clrfund <clrfund-address> --maci-state-file <file> \
 *    --tally-file <tally.json> --network <network>
 */
import { BaseContract, getNumber, Signer } from 'ethers'
import { task, types } from 'hardhat/config'

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
import { DEFAULT_CIRCUIT } from '../utils/circuits'
import { FundingRound, Poll, Tally } from '../typechain-types'
import { HardhatEthersHelpers } from '@nomicfoundation/hardhat-ethers/types'
import { EContracts } from '../utils/types'

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
 * @param hre Hardhat runtime environment
 */
async function getFundingRound(
  clrfund: string,
  coordinator: Signer,
  ethers: HardhatEthersHelpers
): Promise<FundingRound> {
  const clrfundContract = await ethers.getContractAt(
    EContracts.ClrFund,
    clrfund,
    coordinator
  )

  const fundingRound = await clrfundContract.getCurrentRound()
  const fundingRoundContract = await ethers.getContractAt(
    EContracts.FundingRound,
    fundingRound,
    coordinator
  )

  return fundingRoundContract as BaseContract as FundingRound
}

/**
 * Get the recipient tree depth (aka vote option tree depth)
 * @param fundingRoundContract Funding round conract
 * @param ethers Hardhat Ethers Helper
 * @returns Recipient tree depth
 */
async function getRecipientTreeDepth(
  fundingRoundContract: FundingRound,
  ethers: HardhatEthersHelpers
): Promise<number> {
  const pollAddress = await fundingRoundContract.poll()
  const pollContract = await ethers.getContractAt(EContracts.Poll, pollAddress)
  const treeDepths = await (pollContract as BaseContract as Poll).treeDepths()
  const voteOptionTreeDepth = treeDepths.voteOptionTreeDepth
  return getNumber(voteOptionTreeDepth)
}

/**
 * Get the message processor contract address from the tally contract
 * @param tallyAddress Tally contract address
 * @param ethers Hardhat ethers helper
 * @returns Message processor contract address
 */
async function getMessageProcessorAddress(
  tallyAddress: string,
  ethers: HardhatEthersHelpers
): Promise<string> {
  const tallyContract = (await ethers.getContractAt(
    EContracts.Tally,
    tallyAddress
  )) as BaseContract as Tally

  const messageProcessorAddress = await tallyContract.messageProcessor()
  return messageProcessorAddress
}

task('clr-tally', 'Tally votes')
  .addParam('clrfund', 'ClrFund contract address')
  .addOptionalParam('maciStateFile', 'MACI state file')
  .addOptionalParam('tallyFile', 'The tally file path')
  .addOptionalParam(
    'batchSize',
    'The batch size to upload tally result on-chain',
    10,
    types.int
  )
  .addParam('circuit', 'The circuit type', DEFAULT_CIRCUIT)
  .addParam('circuitDirectory', 'The circuit directory', './params')
  .addParam('outputDir', 'The proof output directory', './proof_output')
  .addOptionalParam('maciTxHash', 'The MACI creation transaction hash')
  .addOptionalParam('rapidsnark', 'The rapidsnark prover path')
  .addOptionalParam(
    'numQueueOps',
    'The number of operations for MACI tree merging',
    getNumber(DEFAULT_SR_QUEUE_OPS),
    types.int
  )
  .addOptionalParam(
    'blocksPerBatch',
    'The number of blocks per batch of logs to fetch on-chain',
    DEFAULT_GET_LOG_BATCH_SIZE,
    types.int
  )
  .addOptionalParam('sleep', 'Number of seconds to sleep between log fetch')
  .addOptionalParam(
    'quiet',
    'Whether to disable verbose logging',
    false,
    types.boolean
  )
  .setAction(
    async (
      {
        clrfund,
        quiet,
        maciStateFile,
        maciTxHash,
        outputDir,
        numQueueOps,
        tallyFile,
        blocksPerBatch,
        rapidsnark,
        sleep,
        circuit,
        circuitDirectory,
        batchSize,
      },
      { ethers, network }
    ) => {
      console.log('Verbose logging disabled:', quiet)

      const [coordinator] = await ethers.getSigners()
      console.log('Coordinator address: ', await coordinator.getAddress())

      const coordinatorMacisk = process.env.COORDINATOR_MACISK
      if (!coordinatorMacisk) {
        throw Error('Env. variable COORDINATOR_MACISK not set')
      }

      const fundingRoundContract = await getFundingRound(
        clrfund,
        coordinator,
        ethers
      )
      console.log('Funding round contract', fundingRoundContract.target)

      const recipientTreeDepth = await getRecipientTreeDepth(
        fundingRoundContract,
        ethers
      )

      const pollId = await fundingRoundContract.pollId()
      console.log('PollId', pollId)

      const maciAddress = await fundingRoundContract.maci()
      console.log('MACI address', maciAddress)

      const tallyAddress = await fundingRoundContract.tally()
      const messageProcessorAddress = await getMessageProcessorAddress(
        tallyAddress,
        ethers
      )

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
  )
