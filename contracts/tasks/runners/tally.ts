/**
 * Script for tallying votes which involves fetching MACI logs, generating proofs,
 * proving on chain, and uploading tally results on chain
 *
 * Sample usage:
 *  yarn hardhat tally --clrfund <clrfund-address> --maci-tx-hash <hash> --network <network>
 *
 * This script can be re-run with the same input parameters
 */
import { getNumber } from 'ethers'
import { task, types } from 'hardhat/config'

import {
  DEFAULT_SR_QUEUE_OPS,
  DEFAULT_GET_LOG_BATCH_SIZE,
} from '../../utils/constants'
import { EContracts } from '../../utils/types'
import { ContractStorage } from '../helpers/ContractStorage'
import { Subtask } from '../helpers/Subtask'

task('tally', 'Tally votes')
  .addOptionalParam('clrfund', 'ClrFund contract address')
  .addOptionalParam('maciTxHash', 'MACI creation transaction hash')
  .addOptionalParam(
    'maciStartBlock',
    'MACI creation block',
    undefined,
    types.int
  )
  .addFlag('manageNonce', 'Whether to manually manage transaction nonce')
  .addOptionalParam(
    'batchSize',
    'The batch size to upload tally result on-chain',
    8,
    types.int
  )
  .addParam('proofDir', 'The proof output directory', './proof_output')
  .addParam('paramsDir', 'The circuit zkeys directory', './params')
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
        maciTxHash,
        maciStartBlock,
        quiet,
        proofDir,
        paramsDir,
        numQueueOps,
        blocksPerBatch,
        rapidsnark,
        sleep,
        batchSize,
        manageNonce,
      },
      hre
    ) => {
      console.log('Verbose logging enabled:', !quiet)

      const storage = ContractStorage.getInstance()
      const subtask = Subtask.getInstance(hre)
      subtask.setHre(hre)

      await subtask.logStart()

      const clrfundContractAddress =
        clrfund ?? storage.mustGetAddress(EContracts.ClrFund, hre.network.name)

      await hre.run('gen-proofs', {
        clrfund: clrfundContractAddress,
        maciStartBlock,
        maciTxHash,
        numQueueOps,
        blocksPerBatch,
        rapidsnark,
        sleep,
        proofDir,
        paramsDir,
        manageNonce,
        quiet,
      })

      // proveOnChain if not already processed
      await hre.run('prove-on-chain', {
        clrfund: clrfundContractAddress,
        proofDir,
        manageNonce,
        quiet,
      })

      // Publish tally hash if it is not already published
      await hre.run('publish-tally-results', {
        clrfund: clrfundContractAddress,
        proofDir,
        batchSize,
        manageNonce,
        quiet,
      })

      const success = true
      await subtask.finish(success)
    }
  )
