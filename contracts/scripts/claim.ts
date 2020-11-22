import fs from 'fs'
import { ethers } from 'hardhat'

import MACIArtifact from '../build/contracts/maci-contracts/sol/MACI.sol/MACI.json'
import { getEventArg } from '../utils/contracts'
import { getRecipientClaimData } from '../utils/maci'

async function main() {
  const [,,, recipient1, recipient2] = await ethers.getSigners()
  const state = JSON.parse(fs.readFileSync('state.json').toString())
  const tally = JSON.parse(fs.readFileSync('tally.json').toString())

  const fundingRound = await ethers.getContractAt('FundingRound', state.fundingRound)
  const maciAddress = await fundingRound.maci()
  const maci = await ethers.getContractAt(MACIArtifact.abi, maciAddress)
  const recipientTreeDepth = (await maci.treeDepths()).voteOptionTreeDepth

  // Claim funds
  for (const recipientIndex of [1, 2]) {
    const recipient = recipientIndex === 1 ? recipient1 : recipient2
    const recipientClaimData = getRecipientClaimData(
      recipientIndex,
      recipientTreeDepth,
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
