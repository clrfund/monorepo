/**
 * Voting used in the e2e testing
 * Most of the input used by the script comes from the state.json file
 *
 * Set the COORDINATOR_MACISK env. variable for the coordinator MACI secret key
 *
 * Sample usage:
 *  HARDHAT_NETWORK=localhost yarn ts-node cli/vote.ts <state.json>
 */

import { JSONFile } from '../utils/JSONFile'
import { PrivKey, Keypair, createMessage } from '@clrfund/common'
import { ethers } from 'hardhat'
import { program } from 'commander'
import dotenv from 'dotenv'
import { isPathExist } from '../utils/misc'

dotenv.config()

program
  .description('Cast votes for test users')
  .argument('stateFile', 'The file to store the state information')
  .parse()

async function main(args: any) {
  const stateFile = args[0]
  if (!isPathExist(stateFile)) {
    throw new Error(`File ${stateFile} not found`)
  }

  const coordinatorMacisk = process.env.COORDINATOR_MACISK
  if (!coordinatorMacisk) {
    throw Error('Env. variable COORDINATOR_MACISK not set')
  }

  const [, , , , , , , , , , , , contributor1, contributor2] =
    await ethers.getSigners()

  const state = JSONFile.read(stateFile)
  const coordinatorKeyPair = new Keypair(PrivKey.deserialize(coordinatorMacisk))

  const pollId = state.pollId
  for (const contributor of [contributor1, contributor2]) {
    const contributorAddress = await contributor.getAddress()
    const contributorData = state.contributors[contributorAddress]
    const contributorKeyPair = new Keypair(
      PrivKey.deserialize(contributorData.privKey)
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
      const votes = BigInt(contributorData.voiceCredits) / BigInt(4)
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
}

main(program.args)
  .then(() => {
    process.exit(0)
  })
  .catch((err) => {
    console.error(err)
    process.exit(-1)
  })
