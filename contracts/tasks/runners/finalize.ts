/**
 * Finalize a funding round
 *
 * Make sure to set the following environment variables in the .env file
 * 1) WALLET_PRIVATE_KEY or WALLET_MNEMONIC
 *   - clrfund owner's wallet private key to interact with the contract
 *
 * Sample usage:
 *  yarn hardhat finalize --clrfund <clrfund address> --network <network>
 */

import { JSONFile } from '../../utils/JSONFile'
import { genTallyResultCommitment } from '@clrfund/common'
import { getNumber } from 'ethers'
import { task } from 'hardhat/config'
import { EContracts } from '../../utils/types'
import { ContractStorage } from '../helpers/ContractStorage'
import { Subtask } from '../helpers/Subtask'
import { getProofDirForRound, getTalyFilePath } from '../../utils/misc'

task('finalize', 'Finalize a funding round')
  .addOptionalParam('clrfund', 'The ClrFund contract address')
  .addParam('proofDir', 'The proof output directory', './proof_output')
  .setAction(async ({ clrfund, proofDir }, hre) => {
    const { ethers, network } = hre

    const storage = ContractStorage.getInstance()
    const subtask = Subtask.getInstance(hre)
    subtask.setHre(hre)

    await subtask.logStart()

    const clrfundContractAddress =
      clrfund ?? storage.mustGetAddress(EContracts.ClrFund, network.name)

    const clrfundContract = await ethers.getContractAt(
      EContracts.ClrFund,
      clrfundContractAddress
    )
    console.log('ClrFund address', clrfundContractAddress)

    const currentRoundAddress = await clrfundContract.getCurrentRound()
    const fundingRound = await ethers.getContractAt(
      EContracts.FundingRound,
      currentRoundAddress
    )
    console.log('Current round', fundingRound.target)

    const pollAddress = await fundingRound.poll()
    const pollContract = await ethers.getContractAt(
      EContracts.Poll,
      pollAddress
    )
    console.log('Poll', pollAddress)

    const treeDepths = await pollContract.treeDepths()
    console.log('voteOptionTreeDepth', treeDepths.voteOptionTreeDepth)

    const currentRoundProofDir = getProofDirForRound(
      proofDir,
      network.name,
      currentRoundAddress
    )
    const tallyFile = getTalyFilePath(currentRoundProofDir)
    const tally = JSONFile.read(tallyFile)
    if (!tally.maci) {
      throw Error('Bad tally file ' + tallyFile)
    }

    const totalSpent = tally.totalSpentVoiceCredits.spent
    const totalSpentSalt = tally.totalSpentVoiceCredits.salt

    const voteOptionTreeDepth = getNumber(
      treeDepths.voteOptionTreeDepth,
      'voteOptionTreeDepth'
    )
    const resultsCommitment = genTallyResultCommitment(
      tally.results.tally.map((x: string) => BigInt(x)),
      BigInt(tally.results.salt),
      voteOptionTreeDepth
    )

    const perVOVoiceCreditCommitment = genTallyResultCommitment(
      tally.perVOSpentVoiceCredits.tally.map((x: string) => BigInt(x)),
      BigInt(tally.perVOSpentVoiceCredits.salt),
      voteOptionTreeDepth
    )

    const tx = await clrfundContract.transferMatchingFunds(
      totalSpent,
      totalSpentSalt,
      resultsCommitment,
      perVOVoiceCreditCommitment
    )
    const receipt = await tx.wait()
    console.log(
      'Round finalized, totals verified. Gas used:',
      receipt.gasUsed.toString()
    )

    const success = true
    await subtask.finish(success)
  })
