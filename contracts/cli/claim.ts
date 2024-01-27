/**
 * Claim funds. This script is mainly used by e2e testing
 *
 * Sample usage:
 *  HARDHAT_NETWORK=localhost yarn ts-node cli/claim.ts -f fundingRoundAddress -t tally-file
 */

import { getEventArg } from '../utils/contracts'
import { getRecipientClaimData } from '@clrfund/common'
import { JSONFile } from '../utils/JSONFile'
import { ethers } from 'hardhat'
import { program } from 'commander'
import { isPathExist } from '../utils/misc'
import { getNumber } from 'ethers'

program
  .description('Claim funnds for test recipients')
  .requiredOption(
    '-f, --funding-round <fundingRoundAddress>',
    'The funding round contract address'
  )
  .requiredOption('-r, --recipient-index <index>', 'The recipient index')
  .requiredOption('-t, --tally-file <file>', 'The tally file')
  .option('-a, --amount <amount>', 'The expected claim amount to verify')
  .parse()

async function main(args: any) {
  const { fundingRound, tallyFile, recipientIndex, amount } = args
  console.log('recipientIndex', recipientIndex)

  if (!isPathExist(tallyFile)) {
    throw new Error(`Path ${tallyFile} does not exist`)
  }
  const tally = JSONFile.read(tallyFile)

  const fundingRoundContract = await ethers.getContractAt(
    'FundingRound',
    fundingRound
  )
  const pollAddress = await fundingRoundContract.poll()
  console.log('pollAddress', pollAddress)

  const poll = await ethers.getContractAt('Poll', pollAddress)
  const treeDepths = await poll.treeDepths()
  const recipientTreeDepth = getNumber(
    treeDepths.voteOptionTreeDepth,
    'voteOptionTreeDepth'
  )

  // Claim funds
  const recipientClaimData = getRecipientClaimData(
    getNumber(recipientIndex),
    recipientTreeDepth,
    tally
  )
  const claimTx = await fundingRoundContract.claimFunds(...recipientClaimData)
  const receipt = await claimTx.wait()
  if (receipt.status !== 1) {
    throw new Error('Failed claimFunds()')
  }
  const claimedAmount = await getEventArg(
    claimTx,
    fundingRoundContract,
    'FundsClaimed',
    '_amount'
  )

  console.log(
    `Recipient ${recipientIndex} claimed ${claimedAmount} tokens. Gas used: ${receipt.gasUsed}`
  )

  if (amount) {
    if (BigInt(claimedAmount) !== BigInt(amount)) {
      throw new Error(`Expected claim amount ${amount} got ${claimedAmount}`)
    }
  }
}

main(program.opts())
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
