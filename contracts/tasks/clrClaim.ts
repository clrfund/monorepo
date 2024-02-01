/**
 * Claim funds. This script is mainly used by e2e testing
 *
 * Sample usage:
 *  yarn hardhat clr-claim \
 *   --funding-round <funding round contract address> \
 *   --tally-file <tally file> \
 *   --recipient <recipient-index> \
 *   --network <network>
 */

import { getEventArg } from '../utils/contracts'
import { getRecipientClaimData } from '@clrfund/common'
import { JSONFile } from '../utils/JSONFile'
import { isPathExist } from '../utils/misc'
import { getNumber } from 'ethers'
import { task, types } from 'hardhat/config'
import { EContracts } from '../utils/types'

task('clr-claim', 'Claim funnds for test recipients')
  .addParam('fundingRound', 'The funding round contract address')
  .addParam(
    'recipient',
    'The recipient index in the tally file',
    undefined,
    types.int
  )
  .addParam('tallyFile', 'The tally file')
  .setAction(async ({ fundingRound, tallyFile, recipient }, { ethers }) => {
    if (!isPathExist(tallyFile)) {
      throw new Error(`Path ${tallyFile} does not exist`)
    }

    if (recipient <= 0) {
      throw new Error('Recipient must be greater than 0')
    }

    const tally = JSONFile.read(tallyFile)

    const fundingRoundContract = await ethers.getContractAt(
      EContracts.FundingRound,
      fundingRound
    )
    const pollAddress = await fundingRoundContract.poll()
    console.log('pollAddress', pollAddress)

    const poll = await ethers.getContractAt(EContracts.Poll, pollAddress)
    const treeDepths = await poll.treeDepths()
    const recipientTreeDepth = getNumber(
      treeDepths.voteOptionTreeDepth,
      'voteOptionTreeDepth'
    )

    // Claim funds
    const recipientClaimData = getRecipientClaimData(
      recipient,
      recipientTreeDepth,
      tally
    )
    const claimTx = await fundingRoundContract.claimFunds(...recipientClaimData)
    const claimedAmount = await getEventArg(
      claimTx,
      fundingRoundContract,
      'FundsClaimed',
      '_amount'
    )
    console.log(`Recipient ${recipient} claimed ${claimedAmount} tokens.`)
  })
