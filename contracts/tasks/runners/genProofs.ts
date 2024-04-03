/**
 * Script for generating MACI proofs
 *
 * Pass --maci-tx-hash if this is the first time running the script and you
 * want to get MACI logs starting from the block as recorded in the MACI creation
 * transaction hash
 *
 * Pass --maci-state-file if you have previously ran the script and have
 * the maci-state file (maci-state.json)
 *
 * Make sure to set the following environment variables in the .env file
 * 1) WALLET_PRIVATE_KEY or WALLET_MNEMONIC
 *   - coordinator's wallet private key to interact with contracts
 * 2) COORDINATOR_MACISK - coordinator's MACI private key to decrypt messages
 *
 * Sample usage:
 *
 *  yarn hardhat tally --clrfund <clrfund-address> --proof-dir <proof output directory> \
 *   --maci-tx-hash <hash> --network <network>
 *
 */
import { getNumber, NonceManager } from 'ethers'
import { task, types } from 'hardhat/config'

import {
  DEFAULT_GET_LOG_BATCH_SIZE,
  DEFAULT_SR_QUEUE_OPS,
} from '../../utils/constants'
import {
  getGenProofArgs,
  genProofs,
  genLocalState,
  mergeMaciSubtrees,
} from '../../utils/maci'
import { getMaciStateFilePath } from '../../utils/misc'
import { EContracts } from '../../utils/types'
import { Subtask } from '../helpers/Subtask'
import { getCurrentFundingRoundContract } from '../../utils/contracts'

task('gen-proofs', 'Generate MACI proofs offchain')
  .addParam('clrfund', 'FundingRound contract address')
  .addParam('proofDir', 'The proof output directory')
  .addOptionalParam('maciTxHash', 'MACI creation transaction hash')
  .addOptionalParam(
    'maciStartBlock',
    'MACI creation block',
    undefined,
    types.int
  )
  .addOptionalParam('maciStateFile', 'MACI state file')
  .addFlag('manageNonce', 'Whether to manually manage transaction nonce')
  .addOptionalParam('rapidsnark', 'The rapidsnark prover path')
  .addOptionalParam(
    'blocksPerBatch',
    'The number of blocks per batch of logs to fetch on-chain',
    DEFAULT_GET_LOG_BATCH_SIZE,
    types.int
  )
  .addOptionalParam(
    'numQueueOps',
    'The number of operations for MACI tree merging',
    getNumber(DEFAULT_SR_QUEUE_OPS),
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
        maciStartBlock,
        maciTxHash,
        quiet,
        maciStateFile,
        proofDir,
        blocksPerBatch,
        rapidsnark,
        numQueueOps,
        sleep,
        manageNonce,
      },
      hre
    ) => {
      console.log('Verbose logging enabled:', !quiet)

      const { ethers, network } = hre
      const subtask = Subtask.getInstance(hre)
      subtask.setHre(hre)

      if (!maciStateFile && !maciTxHash && maciStartBlock == undefined) {
        throw new Error('Please provide --maci-start-block or --maci-tx-hash')
      }

      const [coordinatorSigner] = await ethers.getSigners()
      if (!coordinatorSigner) {
        throw new Error('Env. variable WALLET_PRIVATE_KEY not set')
      }
      const coordinator = manageNonce
        ? new NonceManager(coordinatorSigner)
        : coordinatorSigner
      console.log('Coordinator address: ', await coordinator.getAddress())

      const coordinatorMacisk = process.env.COORDINATOR_MACISK
      if (!coordinatorMacisk) {
        throw new Error('Env. variable COORDINATOR_MACISK not set')
      }

      const circuit = subtask.getConfigField<string>(
        EContracts.VkRegistry,
        'circuit'
      )
      const circuitDirectory = subtask.getConfigField<string>(
        EContracts.VkRegistry,
        'paramsDirectory'
      )

      await subtask.logStart()

      const fundingRoundContract = await getCurrentFundingRoundContract(
        clrfund,
        coordinator,
        ethers
      )
      console.log('Funding round contract', fundingRoundContract.target)

      const pollId = await fundingRoundContract.pollId()
      console.log('PollId', pollId)

      const maciAddress = await fundingRoundContract.maci()

      const providerUrl = (network.config as any).url

      await mergeMaciSubtrees({
        maciAddress,
        pollId,
        numQueueOps,
        signer: coordinator,
        quiet,
      })

      const maciStateFilePath = maciStateFile
        ? maciStateFile
        : getMaciStateFilePath(proofDir)

      if (!maciStateFile) {
        await genLocalState({
          quiet,
          outputPath: maciStateFilePath,
          pollId,
          maciContractAddress: maciAddress,
          coordinatorPrivateKey: coordinatorMacisk,
          ethereumProvider: providerUrl,
          transactionHash: maciTxHash,
          startBlock: maciStartBlock,
          blockPerBatch: blocksPerBatch,
          signer: coordinator,
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
        outputDir: proofDir,
        blocksPerBatch: getNumber(blocksPerBatch),
        maciTxHash,
        maciStateFile: maciStateFilePath,
        signer: coordinator,
        quiet,
      })
      await genProofs(genProofArgs)

      const success = true
      await subtask.finish(success)
    }
  )
