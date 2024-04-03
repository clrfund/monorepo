/**
 * Prove on chain the MACI proofs generated using genProofs
 *
 * Make sure to set the following environment variables in the .env file
 * 1) WALLET_PRIVATE_KEY or WALLET_MNEMONIC
 *   - coordinator's wallet private key to interact with contracts
 *
 * Sample usage:
 *
 *  yarn hardhat prove-on-chain --clrfund <clrfund-address> --proof-dir <proof directory> --network <network>
 *
 */
import { BaseContract, NonceManager } from 'ethers'
import { task, types } from 'hardhat/config'

import { proveOnChain } from '../../utils/maci'
import { Tally } from '../../typechain-types'
import { HardhatEthersHelpers } from '@nomicfoundation/hardhat-ethers/types'
import { EContracts } from '../../utils/types'
import { Subtask } from '../helpers/Subtask'
import { getCurrentFundingRoundContract } from '../../utils/contracts'

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

task('prove-on-chain', 'Prove on chain with the MACI proofs')
  .addParam('clrfund', 'ClrFund contract address')
  .addParam('proofDir', 'The proof output directory')
  .addFlag('manageNonce', 'Whether to manually manage transaction nonce')
  .addOptionalParam(
    'quiet',
    'Whether to disable verbose logging',
    false,
    types.boolean
  )
  .setAction(async ({ clrfund, quiet, manageNonce, proofDir }, hre) => {
    console.log('Verbose logging enabled:', !quiet)

    const { ethers } = hre
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

    await subtask.logStart()

    const fundingRoundContract = await getCurrentFundingRoundContract(
      clrfund,
      coordinator,
      ethers
    )
    console.log('Funding round contract', fundingRoundContract.target)

    const pollId = await fundingRoundContract.pollId()
    const maciAddress = await fundingRoundContract.maci()
    const tallyAddress = await fundingRoundContract.tally()
    const messageProcessorAddress = await getMessageProcessorAddress(
      tallyAddress,
      ethers
    )

    // proveOnChain if not already processed
    await proveOnChain({
      pollId,
      proofDir,
      subsidyEnabled: false,
      maciAddress,
      messageProcessorAddress,
      tallyAddress,
      signer: coordinator,
      quiet,
    })

    const success = true
    await subtask.finish(success)
  })
