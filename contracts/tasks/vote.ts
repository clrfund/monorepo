/**
 * Contribute to a funding round. This script is mainly used by e2e testing
 * All the input used by the script comes from the state.json file
 *
 * Sample usage:
 *  yarn hardhat contribute \
 *    --coordinator-macisk <macisk.*> \
 *    --state-file <state file>
 *    --network <network>
 */

import { task } from 'hardhat/config'
import { JSONFile } from '../utils/JSONFile'
import { PrivKey, Keypair, createMessage } from '@clrfund/common'
import { BigNumber } from 'ethers'

task('vote', 'Cast votes for test users')
  .addParam('coordinatorMacisk', 'The coordinator MACI secret key')
  .addParam('stateFile', 'The file to store the state information')
  .setAction(async ({ coordinatorMacisk, stateFile }, { ethers }) => {
    const [, , , , , , , , , , , , contributor1, contributor2] =
      await ethers.getSigners()

    const state = JSONFile.read(stateFile)
    const coordinatorKeyPair = new Keypair(
      PrivKey.unserialize(coordinatorMacisk)
    )

    const pollId = state.pollId
    for (const contributor of [contributor1, contributor2]) {
      const contributorAddress = await contributor.getAddress()
      const contributorData = state.contributors[contributorAddress]
      const contributorKeyPair = new Keypair(
        PrivKey.unserialize(contributorData.privKey)
      )

      const messages: { msgType: any; data: string[] }[] = []
      const encPubKeys: any[] = []
      let nonce = 1
      // Change key
      const newContributorKeypair = new Keypair()
      const [message, encPubKey] = createMessage(
        contributorData.stateIndex,
        contributorKeyPair,
        newContributorKeypair,
        coordinatorKeyPair.pubKey,
        null,
        null,
        nonce,
        pollId
      )
      messages.push(message.asContractParam())
      encPubKeys.push(encPubKey.asContractParam())
      nonce += 1
      // Vote
      for (const recipientIndex of [1, 2]) {
        const votes = BigNumber.from(contributorData.voiceCredits).div(4)
        const [message, encPubKey] = createMessage(
          contributorData.stateIndex,
          newContributorKeypair,
          null,
          coordinatorKeyPair.pubKey,
          recipientIndex,
          votes,
          nonce,
          pollId
        )
        messages.push(message.asContractParam())
        encPubKeys.push(encPubKey.asContractParam())
        nonce += 1
      }

      const fundingRoundAsContributor = await ethers.getContractAt(
        'FundingRound',
        state.fundingRound,
        contributor
      )
      await fundingRoundAsContributor.submitMessageBatch(
        messages.reverse(),
        encPubKeys.reverse()
      )
      console.log(`Contributor ${contributorAddress} voted.`)
    }
  })
