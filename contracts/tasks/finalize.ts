/**
 * Finalize a funding round
 *
 * Sample usage:
 *  yarn hardhat finalize \
 *    --funding-round <funding round address> --network <network>
 */

import { task } from 'hardhat/config'
import { JSONFile } from '../utils/JSONFile'
import { genTallyResultCommitment } from '@clrfund/common'

task('finalize', 'Finalize a funding round')
  .addParam('clrfund', 'The ClrFund contract address')
  .addParam('tallyFile', 'The tally file path')
  .setAction(async ({ clrfund, tallyFile }, { ethers }) => {
    const tally = JSONFile.read(tallyFile)
    if (!tally.maci) {
      throw Error('Bad tally file ' + tallyFile)
    }

    const clrfundContract = await ethers.getContractAt('ClrFund', clrfund)
    console.log('ClrFund address', clrfund)

    const currentRoundAddress = await clrfundContract.getCurrentRound()
    const fundingRound = await ethers.getContractAt(
      'FundingRound',
      currentRoundAddress
    )
    console.log('Current round', fundingRound.address)

    const pollAddress = await fundingRound.poll()
    const pollContract = await ethers.getContractAt('Poll', pollAddress)
    console.log('Poll', pollAddress)

    const treeDepths = await pollContract.treeDepths()
    console.log('voteOptionTreeDepth', treeDepths.voteOptionTreeDepth)

    const totalSpent = parseInt(tally.totalSpentVoiceCredits.spent)
    const totalSpentSalt = tally.totalSpentVoiceCredits.salt

    const resultsCommitment = genTallyResultCommitment(
      tally.results.tally.map((x: string) => BigInt(x)),
      tally.results.salt,
      treeDepths.voteOptionTreeDepth
    )

    const perVOVoiceCreditCommitment = genTallyResultCommitment(
      tally.perVOSpentVoiceCredits.tally.map((x: string) => BigInt(x)),
      tally.perVOSpentVoiceCredits.salt,
      treeDepths.voteOptionTreeDepth
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
  })
