import fs from 'fs';
import { ethers } from '@nomiclabs/buidler';
import { BigNumber } from 'ethers'
import { PrivKey, PubKey, Keypair } from 'maci-domainobjs'

import { createMessage } from '../utils/maci'

async function main() {
  const [,,,,, contributor1, contributor2] = await ethers.getSigners()
  const state = JSON.parse(fs.readFileSync('state.json').toString())
  const coordinatorPubKey = PubKey.unserialize(state.coordinator.pubKey)

  for (const contributor of [contributor1, contributor2]) {
    const contributorAddress = await contributor.getAddress()
    const contributorData = state.contributors[contributorAddress]
    const contributorKeyPair = new Keypair(PrivKey.unserialize(contributorData.privKey))
    const messages = []
    const encPubKeys = []
    let nonce = 1
    // Change key
    const newContributorKeypair = new Keypair()
    const [message, encPubKey] = createMessage(
      contributorData.stateIndex,
      contributorKeyPair, newContributorKeypair,
      coordinatorPubKey,
      null, null, nonce,
    )
    messages.push(message.asContractParam())
    encPubKeys.push(encPubKey.asContractParam())
    nonce += 1
    // Vote
    for (const recipientIndex of [1, 2]) {
      const votes = BigNumber.from(contributorData.voiceCredits).div(4)
      const [message, encPubKey] = createMessage(
        contributorData.stateIndex,
        newContributorKeypair, null,
        coordinatorPubKey,
        recipientIndex, votes, nonce,
      )
      messages.push(message.asContractParam())
      encPubKeys.push(encPubKey.asContractParam())
      nonce += 1
    }

    const fundingRoundAsContributor = await ethers.getContractAt(
      'FundingRound',
      state.fundingRound,
      contributor,
    )
    await fundingRoundAsContributor.submitMessageBatch(messages, encPubKeys)
    console.log(`Contributor ${contributorAddress} voted.`)
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
