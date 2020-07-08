import fs from 'fs'
import { ethers } from '@nomiclabs/buidler'
import { bigInt, SnarkBigInt, IncrementalQuinTree } from 'maci-crypto'

import { getEventArg } from '../tests/utils'

async function main() {
  const [,,, recipient1, recipient2] = await ethers.getSigners()
  // Finalize the round
  const state = JSON.parse(fs.readFileSync('state.json').toString())
  const factory = await ethers.getContractAt('FundingRoundFactory', state.factory)
  await factory.transferMatchingFunds()
  // Verify totals
  const fundingRound = await ethers.getContractAt('FundingRound', state.fundingRound)
  const tally = JSON.parse(fs.readFileSync('tally.json').toString())
  const totalSpent = parseInt(tally.totalVoiceCredits.spent)
  const totalSpentSalt = tally.totalVoiceCredits.salt
  await fundingRound.verifyTotals(totalSpent, totalSpentSalt)
  console.log('Round finalized, totals verified.')

  const treeDepth =  2
  // Claim funds
  for (const recipientIndex of [1, 2]) {
    const recipient = recipientIndex === 1 ? recipient1 : recipient2
    const result = parseInt(tally.results.tally[recipientIndex])
    const resultSalt = tally.results.salt
    const resultTree = new IncrementalQuinTree(treeDepth, bigInt(0))
    for (const leaf of tally.results.tally) {
      resultTree.insert(leaf)
    }
    const resultProof = resultTree.genMerklePath(recipientIndex)

    const spent = parseInt(tally.totalVoiceCreditsPerVoteOption.tally[recipientIndex])
    const spentSalt = tally.totalVoiceCreditsPerVoteOption.salt
    const spentTree = new IncrementalQuinTree(treeDepth, bigInt(0))
    for (const leaf of tally.totalVoiceCreditsPerVoteOption.tally) {
      spentTree.insert(leaf)
    }
    const spentProof = spentTree.genMerklePath(recipientIndex)
    const recipientClaimData = [
      result,
      resultProof.pathElements.map((x) => x.map((y: SnarkBigInt) => y.toString())),
      resultSalt,
      spent,
      spentProof.pathElements.map((x) => x.map((y: SnarkBigInt) => y.toString())),
      spentSalt,
    ]
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
