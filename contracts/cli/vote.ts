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
import {
  PrivKey,
  Keypair,
  createMessage,
  Message,
  PubKey,
} from '@clrfund/common'
import { ethers } from 'hardhat'
import { program } from 'commander'
import dotenv from 'dotenv'
import { isPathExist } from '../utils/misc'
import { AbiCoder } from 'ethers'
import { FundingRound } from '../typechain-types'

dotenv.config()

const abiCoder = new AbiCoder()
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

  const fundingRound = await ethers.getContractAt(
    'FundingRound',
    state.fundingRound
  )

  const pollId = state.pollId
  for (const contributor of [contributor1, contributor2]) {
    const address = await contributor.getAddress()
    const contributorData = state.contributors[address]
    const data = abiCoder.encode(['address'], [address])
    const voiceCredits = await fundingRound.getVoiceCredits(address, data)
    const contributorKeyPair = new Keypair(
      PrivKey.deserialize(contributorData.privKey)
    )

    const messages: Message[] = []
    const encPubKeys: PubKey[] = []
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
    messages.push(message)
    encPubKeys.push(encPubKey)
    nonce += 1

    // Vote
    for (const recipientIndex of [1, 2]) {
      const votes = voiceCredits / BigInt(2)
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
      messages.push(message)
      encPubKeys.push(encPubKey)
      nonce += 1
      console.log(
        `Contributor ${address} votes ${votes} for recipient ${recipientIndex}`
      )
    }

    const fundingRoundAsContributor = fundingRound.connect(
      contributor
    ) as FundingRound

    const tx = await fundingRoundAsContributor.submitMessageBatch(
      messages.reverse().map((msg) => msg.asContractParam()),
      encPubKeys.reverse().map((key) => key.asContractParam())
    )
    const receipt = await tx.wait()
    if (receipt?.status !== 1) {
      throw new Error('Failed submitMessageBatch()')
    }
    console.log('Gas used:', receipt.gasUsed)

    state.contributors[address].privKey =
      newContributorKeypair.privKey.serialize()
    state.contributors[address].pubKey =
      newContributorKeypair.pubKey.serialize()
  }

  // Update state file with new key
  JSONFile.update(stateFile, state)
}

main(program.args)
  .then(() => {
    process.exit(0)
  })
  .catch((err) => {
    console.error(err)
    process.exit(-1)
  })
