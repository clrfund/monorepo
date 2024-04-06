/**
 * Script for tallying votes which involves fetching MACI logs, generating proofs,
 * and proving on chain
 *
 * Make sure to set the following environment variables in the .env file
 * 1) WALLET_PRIVATE_KEY or WALLET_MNEMONIC
 *   - coordinator's wallet private key to interact with contracts
 * 2) PINATA_API_KEY - The Pinata api key for pinning file to IPFS
 * 3) PINATA_SECRET_API_KEY - The Pinata secret api key for pinning file to IPFS
 *
 * Sample usage:
 *
 *  yarn hardhat publish-tally-results --clrfund <clrfund-address>
 *    --proof-dir <MACI proof output directory> --network <network>
 *
 */
import { BaseContract, getNumber, NonceManager } from 'ethers'
import { task, types } from 'hardhat/config'

import { Ipfs } from '../../utils/ipfs'
import { JSONFile } from '../../utils/JSONFile'
import { addTallyResultsBatch, TallyData, verify } from '../../utils/maci'
import { FundingRound, Poll } from '../../typechain-types'
import { HardhatEthersHelpers } from '@nomicfoundation/hardhat-ethers/types'
import { EContracts } from '../../utils/types'
import { Subtask } from '../helpers/Subtask'
import { getCurrentFundingRoundContract } from '../../utils/contracts'
import { getTalyFilePath } from '../../utils/misc'
import { ContractStorage } from '../helpers/ContractStorage'
import { PINATA_PINNING_URL } from '../../utils/constants'

/**
 * Publish the tally IPFS hash on chain if it's not already published
 * @param fundingRoundContract Funding round contract
 * @param tallyHash Tally hash
 */
async function publishTallyHash(
  fundingRoundContract: FundingRound,
  tallyHash: string
) {
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
  if (startIndex < total) {
    console.log('Uploading tally results in batches of', batchSize)
  }
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

task('publish-tally-results', 'Publish tally results')
  .addOptionalParam('clrfund', 'ClrFund contract address')
  .addParam('proofDir', 'The proof output directory')
  .addOptionalParam(
    'batchSize',
    'The batch size to upload tally result on-chain',
    8,
    types.int
  )
  .addFlag('manageNonce', 'Whether to manually manage transaction nonce')
  .addFlag('quiet', 'Whether to log on the console')
  .setAction(
    async ({ clrfund, proofDir, batchSize, manageNonce, quiet }, hre) => {
      const { ethers, network } = hre
      const storage = ContractStorage.getInstance()
      const subtask = Subtask.getInstance(hre)
      subtask.setHre(hre)

      const [signer] = await ethers.getSigners()
      if (!signer) {
        throw new Error('Env. variable WALLET_PRIVATE_KEY not set')
      }
      const coordinator = manageNonce ? new NonceManager(signer) : signer
      console.log('Coordinator address: ', await coordinator.getAddress())

      const apiKey = process.env.PINATA_API_KEY
      if (!apiKey) {
        throw new Error('Env. variable PINATA_API_KEY not set')
      }

      const secretApiKey = process.env.PINATA_SECRET_API_KEY
      if (!secretApiKey) {
        throw new Error('Env. variable PINATA_SECRET_API_KEY not set')
      }

      await subtask.logStart()

      const clrfundContractAddress =
        clrfund ?? storage.mustGetAddress(EContracts.ClrFund, network.name)
      const fundingRoundContract = await getCurrentFundingRoundContract(
        clrfundContractAddress,
        coordinator,
        ethers
      )
      console.log('Funding round contract', fundingRoundContract.target)

      const recipientTreeDepth = await getRecipientTreeDepth(
        fundingRoundContract,
        ethers
      )

      const tallyFile = getTalyFilePath(proofDir)
      const tallyData = JSONFile.read(tallyFile)
      const tallyAddress = await fundingRoundContract.tally()

      await verify({
        pollId: BigInt(tallyData.pollId),
        subsidyEnabled: false,
        tallyData,
        maciAddress: tallyData.maci,
        tallyAddress,
        signer: coordinator,
        quiet,
      })

      const tallyHash = await Ipfs.pinFile(tallyFile, apiKey, secretApiKey)

      // Publish tally hash if it is not already published
      await publishTallyHash(fundingRoundContract, tallyHash)

      // Submit tally results to the funding round contract
      // This function can be re-run from where it left off
      await submitTallyResults(
        fundingRoundContract,
        recipientTreeDepth,
        tallyData,
        batchSize
      )

      const success = true
      await subtask.finish(success)
    }
  )
