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
import { Contract } from 'ethers'

program
  .description('Claim funnds for test recipients')
  .requiredOption(
    '-f --funding-round <fundingRoundAddress>',
    'The funding round contract address'
  )
  .requiredOption('-t --tally-file <file>', 'The tally file')
  .parse()

async function main(args: any) {
  const { fundingRound, tallyFile } = args
  const [, , recipient0, recipient1, recipient2] = await ethers.getSigners()

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
  const recipientTreeDepth = (await poll.treeDepths()).voteOptionTreeDepth

  // Claim funds
  const recipients = [recipient0, recipient1, recipient2]
  for (const recipientIndex of [1, 2]) {
    const recipientClaimData = getRecipientClaimData(
      recipientIndex,
      recipientTreeDepth,
      tally
    )
    const fundingRoundAsRecipient = fundingRoundContract.connect(
      recipients[recipientIndex]
    ) as Contract
    const claimTx = await fundingRoundAsRecipient.claimFunds(
      ...recipientClaimData
    )
    const claimedAmount = await getEventArg(
      claimTx,
      fundingRoundAsRecipient,
      'FundsClaimed',
      '_amount'
    )
    console.log(`Recipient ${recipientIndex} claimed ${claimedAmount} tokens.`)
  }
}

main(program.opts())
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
