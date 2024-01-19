/**
 * Finalize a funding round
 *
 * Sample usage:
 *  HARDHAT_NETWORK=localhost yarn ts-node cli/finalize.ts \
 *    --funding-round <funding round address> \
 *    --tally-file <tally file>
 */

import { ethers } from 'hardhat'
import { JSONFile } from '../utils/JSONFile'
import { genTallyResultCommitment } from '@clrfund/common'
import { program } from 'commander'
import { getNumber } from 'ethers'

program
  .description('Finalize a funding round')
  .requiredOption('-c --clrfund <clrfund>', 'The ClrFund contract address')
  .requiredOption('-t --tally-file <file>', 'The tally file path')
  .parse()

async function main(args: any) {
  const { tallyFile, clrfund } = args
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
  console.log('Current round', fundingRound.target)

  const pollAddress = await fundingRound.poll()
  const pollContract = await ethers.getContractAt('Poll', pollAddress)
  console.log('Poll', pollAddress)

  const treeDepths = await pollContract.treeDepths()
  console.log('voteOptionTreeDepth', treeDepths.voteOptionTreeDepth)

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
}

main(program.opts())
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
