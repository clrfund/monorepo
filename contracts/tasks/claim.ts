/**
 * Claim funds. This script is mainly used by e2e testing
 *
 * Sample usage:
 *  yarn hardhat claim --funding-round <funding round> --network <network>
 */

import { task } from 'hardhat/config'
import { getEventArg } from '../utils/contracts'
import { getRecipientClaimData } from '@clrfund/common'
import { JSONFile } from '../utils/JSONFile'
import { getTalyFilePath } from '../utils/misc'

task('claim', 'Claim funnds for test recipients')
  .addParam('fundingRound', 'The funding round contract address')
  .addParam('tallyDirectory', 'The tally file directory')
  .setAction(async ({ fundingRound, tallyDirectory }, { ethers }) => {
    const [, , recipient0, recipient1, recipient2] = await ethers.getSigners()
    const tallyFile = getTalyFilePath(tallyDirectory)
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
      )
      const claimTx = await fundingRoundAsRecipient.claimFunds(
        ...recipientClaimData
      )
      const claimedAmount = await getEventArg(
        claimTx,
        fundingRoundAsRecipient,
        'FundsClaimed',
        '_amount'
      )
      console.log(
        `Recipient ${recipientIndex} claimed ${claimedAmount} tokens.`
      )
    }
  })
