import fs from 'fs'
import { ethers } from 'hardhat'

import { getEventArg } from '../utils/contracts'

async function main() {
  const [, , , recipient1, recipient2] = await ethers.getSigners()
  const state = JSON.parse(fs.readFileSync('state.json').toString())

  const fundingRound = await ethers.getContractAt(
    'FundingRound',
    state.fundingRound
  )

  // Claim funds
  for (const recipientIndex of [1, 2]) {
    const recipient = recipientIndex === 1 ? recipient1 : recipient2

    const fundingRoundAsRecipient = fundingRound.connect(recipient)
    const claimTx = await fundingRoundAsRecipient.claimFunds(recipientIndex)
    const claimedAmount = await getEventArg(
      claimTx,
      fundingRound,
      'FundsClaimed',
      '_amount'
    )
    console.log(`Recipient ${recipientIndex} claimed ${claimedAmount} tokens.`)
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
