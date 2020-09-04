import fs from 'fs'
import { ethers } from '@nomiclabs/buidler'

import { getEventArg } from '../utils/contracts'
import { getRecipientClaimData } from '../utils/maci'

async function main() {
  const [,,, recipient1, recipient2] = await ethers.getSigners()
  const state = JSON.parse(fs.readFileSync('state.json').toString())
  const tally = JSON.parse(fs.readFileSync('tally.json').toString())

  const fundingRound = await ethers.getContractAt('FundingRound', state.fundingRound)
  // Claim funds
  for (const recipientIndex of [1, 2]) {
    const recipient = recipientIndex === 1 ? recipient1 : recipient2
    const recipientClaimData = getRecipientClaimData(
      await recipient.getAddress(),
      recipientIndex,
      tally,
    )
    const fundingRoundAsRecipient = fundingRound.connect(recipient)
    const claimTx = await fundingRoundAsRecipient.claimFunds(...recipientClaimData)
    const claimedAmount = await getEventArg(claimTx, fundingRound, 'FundsClaimed', '_amount')
    console.log(`Recipient ${recipientIndex} claimed ${claimedAmount} tokens.`)
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
