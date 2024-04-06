/**
 * Script for generating MACI proofs
 *
 * Make sure to set the following environment variables in the .env file
 * 1) WALLET_PRIVATE_KEY or WALLET_MNEMONIC
 *   - coordinator's wallet private key to interact with contracts
 * 2) COORDINATOR_MACISK - coordinator's MACI private key to decrypt messages
 *
 * Sample usage:
 *
 *  yarn hardhat gen-proofs --clrfund <clrfund-address> --proof-dir <proof output directory> \
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
import {
  getMaciStateFilePath,
  getTalyFilePath,
  isPathExist,
  makeDirectory,
} from '../../utils/misc'
import { EContracts } from '../../utils/types'
import { Subtask } from '../helpers/Subtask'
import { getCurrentFundingRoundContract } from '../../utils/contracts'
import { ContractStorage } from '../helpers/ContractStorage'
import { DEFAULT_CIRCUIT } from '../../utils/circuits'
import { JSONFile } from '../../utils/JSONFile'

/**
 * Check if the tally file with the maci contract address exists
 * @param tallyFile The tally file path
 * @param maciAddress The MACI contract address
 * @returns true if the file exists and it contains the MACI contract address
 */
function tallyFileExists(tallyFile: string, maciAddress: string): boolean {
  if (!isPathExist(tallyFile)) {
    return false
  }
  try {
    const tallyData = JSONFile.read(tallyFile)
    return (
      tallyData.maci &&
      tallyData.maci.toLowerCase() === maciAddress.toLowerCase()
    )
  } catch {
    // in case the file does not have the expected format/field
    return false
  }
}

task('gen-proofs', 'Generate MACI proofs offchain')
  .addOptionalParam('clrfund', 'FundingRound contract address')
  .addParam('proofDir', 'The proof output directory')
  .addOptionalParam('maciTxHash', 'MACI creation transaction hash')
  .addOptionalParam(
    'maciStartBlock',
    'MACI creation block',
    undefined,
    types.int
  )
  .addFlag('manageNonce', 'Whether to manually manage transaction nonce')
  .addOptionalParam('rapidsnark', 'The rapidsnark prover path')
  .addParam('paramsDir', 'The circuit zkeys directory', './params')
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
        proofDir,
        paramsDir,
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
      const storage = ContractStorage.getInstance()
      const subtask = Subtask.getInstance(hre)
      subtask.setHre(hre)

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

      const circuit =
        subtask.tryGetConfigField<string>(EContracts.VkRegistry, 'circuit') ||
        DEFAULT_CIRCUIT

      const circuitDirectory =
        subtask.tryGetConfigField<string>(
          EContracts.VkRegistry,
          'paramsDirectory'
        ) || paramsDir

      await subtask.logStart()

      const clrfundContractAddress =
        clrfund ?? storage.mustGetAddress(EContracts.ClrFund, network.name)
      const fundingRoundContract = await getCurrentFundingRoundContract(
        clrfundContractAddress,
        coordinator,
        ethers
      )
      console.log('Funding round contract', fundingRoundContract.target)

      const pollId = await fundingRoundContract.pollId()
      console.log('PollId', pollId)

      const maciAddress = await fundingRoundContract.maci()
      await mergeMaciSubtrees({
        maciAddress,
        pollId,
        numQueueOps,
        signer: coordinator,
        quiet,
      })

      if (!isPathExist(proofDir)) {
        makeDirectory(proofDir)
      }

      const tallyFile = getTalyFilePath(proofDir)
      const maciStateFile = getMaciStateFilePath(proofDir)
      const providerUrl = (network.config as any).url

      if (tallyFileExists(tallyFile, maciAddress)) {
        console.log('The tally file has already been generated.')
        return
      }

      if (!isPathExist(maciStateFile)) {
        if (!maciTxHash && maciStartBlock == null) {
          throw new Error(
            'Please provide a value for --maci-tx-hash or --maci-start-block'
          )
        }

        await genLocalState({
          quiet,
          outputPath: maciStateFile,
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
        maciStateFile,
        tallyFile,
        signer: coordinator,
        quiet,
      })
      await genProofs(genProofArgs)

      const success = true
      await subtask.finish(success)
    }
  )
