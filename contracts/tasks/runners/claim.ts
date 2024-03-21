/**
 * Claim funds. This script is mainly used by e2e testing
 *
 * Sample usage:
 *  yarn hardhat claim \
 *   --tally-file <tally file> \
 *   --recipient <recipient-index> \
 *   --network <network>
 */

import { getEventArg } from '../../utils/contracts'
import { getRecipientClaimData } from '@clrfund/common'
import { JSONFile } from '../../utils/JSONFile'
import { isPathExist } from '../../utils/misc'
import { getNumber } from 'ethers'
import { task, types } from 'hardhat/config'
import { EContracts } from '../../utils/types'
import { ContractStorage } from '../helpers/ContractStorage'

task('claim', 'Claim funnds for test recipients')
  .addParam(
    'recipient',
    'The recipient index in the tally file',
    undefined,
    types.int
  )
  .addParam('tallyFile', 'The tally file')
  .setAction(async ({ tallyFile, recipient }, { ethers, network }) => {
    if (!isPathExist(tallyFile)) {
      throw new Error(`Path ${tallyFile} does not exist`)
    }

    if (recipient <= 0) {
      throw new Error('Recipient must be greater than 0')
    }

    const storage = ContractStorage.getInstance()
    const fundingRound = storage.mustGetAddress(
      EContracts.FundingRound,
      network.name
    )

    const tally = JSONFile.read(tallyFile)

    const fundingRoundContract = await ethers.getContractAt(
      EContracts.FundingRound,
      fundingRound
    )

    const recipientStatus = await fundingRoundContract.recipients(recipient)
    if (recipientStatus.fundsClaimed) {
      throw new Error(`Recipient already claimed funds`)
    }

    const pollAddress = await fundingRoundContract.poll()
    console.log('pollAddress', pollAddress)

    const poll = await ethers.getContractAt(EContracts.Poll, pollAddress)
    const treeDepths = await poll.treeDepths()
    const recipientTreeDepth = getNumber(treeDepths.voteOptionTreeDepth)

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
