/**
 * Voting used in the e2e testing
 * Most of the input used by the script comes from the state.json file
 *
 * Set the COORDINATOR_MACISK env. variable for the coordinator MACI secret key
 *
 * Sample usage:
 *  yarn hardhat test-vote --stateFile <state.json> --network <network>
 */
import { task } from 'hardhat/config'
import { HardhatEthersHelpers } from '@nomicfoundation/hardhat-ethers/types'
import { JSONFile } from '../../utils/JSONFile'
import {
  PrivKey,
  Keypair,
  createMessage,
  Message,
  PubKey,
} from '@clrfund/common'
import dotenv from 'dotenv'
import { isPathExist } from '../../utils/misc'

dotenv.config()

type Args = {
  stateFile: string
  ethers: HardhatEthersHelpers
}

async function main({ stateFile, ethers }: Args) {
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
      messages.push(message)
      encPubKeys.push(encPubKey)
      nonce += 1
    }

    const fundingRound = await ethers.getContractAt(
      'FundingRound',
      state.fundingRound,
      contributor
    )
    const pollAddress = await fundingRound.poll()
    const pollContract = await ethers.getContractAt(
      'Poll',
      pollAddress,
      contributor
    )
    await pollContract.publishMessageBatch(
      messages.reverse().map((msg) => msg.asContractParam()),
      encPubKeys.reverse().map((key) => key.asContractParam())
    )
    console.log(`Contributor ${contributorAddress} voted.`)
  }
}

task('test-vote', 'Cast votes for test users')
  .addParam('stateFile', 'The file to store the state information')
  .setAction(async ({ stateFile }, { ethers }) => {
    await main({ stateFile, ethers })
  })
