/**
 * Contribute to a funding round. This script is mainly used by e2e testing
 * All the input used by the script comes from the state.json file
 *
 * Sample usage:
 *  yarn hardhat contribute --network <network>
 *
 * Make sure deployed-contracts.json exists with the funding round address
 */

import { Keypair, createMessage, Message, PubKey } from '@clrfund/common'

import { UNIT } from '../../utils/constants'
import { getEventArg } from '../../utils/contracts'
import type { FundingRound, ERC20, Poll } from '../../typechain-types'
import { task } from 'hardhat/config'
import { EContracts } from '../../utils/types'
import { ContractStorage } from '../helpers/ContractStorage'

/**
 * Cast a vote by the contributor
 *
 * @param stateIndex The contributor stateIndex
 * @param pollId The pollId
 * @param contributorKeyPair The contributor MACI key pair
 * @param coordinatorPubKey The coordinator MACI public key
 * @param voiceCredits The total voice credits the contributor can use
 * @param pollContract The poll contract with the vote function
 */
async function vote(
  stateIndex: number,
  pollId: bigint,
  contributorKeyPair: Keypair,
  coordinatorPubKey: PubKey,
  voiceCredits: bigint,
  pollContract: Poll
) {
  const messages: Message[] = []
  const encPubKeys: PubKey[] = []
  let nonce = 1
  // Change key
  const newContributorKeypair = new Keypair()
  const [message, encPubKey] = createMessage(
    stateIndex,
    contributorKeyPair,
    newContributorKeypair,
    coordinatorPubKey,
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
    const votes = BigInt(voiceCredits) / BigInt(4)
    const [message, encPubKey] = createMessage(
      stateIndex,
      newContributorKeypair,
      null,
      coordinatorPubKey,
      recipientIndex,
      votes,
      nonce,
      pollId
    )
    messages.push(message)
    encPubKeys.push(encPubKey)
    nonce += 1
  }

  const tx = await pollContract.publishMessageBatch(
    messages.reverse().map((msg) => msg.asContractParam()),
    encPubKeys.reverse().map((key) => key.asContractParam())
  )
  const receipt = await tx.wait()
  if (receipt?.status !== 1) {
    throw new Error(`Contributor ${stateIndex} failed to vote`)
  }
}

task('contribute', 'Contribute to a funding round').setAction(
  async (_, { ethers, network }) => {
    const [deployer, , , , , , , , , , , , contributor1, contributor2] =
      await ethers.getSigners()

    const storage = ContractStorage.getInstance()
    const fundingRoundContractAddress = storage.mustGetAddress(
      EContracts.FundingRound,
      network.name
    )
    const fundingRound = await ethers.getContractAt(
      EContracts.FundingRound,
      fundingRoundContractAddress
    )

    const pollId = await fundingRound.pollId()
    const pollAddress = await fundingRound.poll()
    const pollContract = await ethers.getContractAt(
      EContracts.Poll,
      pollAddress
    )

    const rawCoordinatorPubKey = await pollContract.coordinatorPubKey()
    const coordinatorPubKey = new PubKey([
      BigInt(rawCoordinatorPubKey.x),
      BigInt(rawCoordinatorPubKey.y),
    ])

    const tokenAddress = await fundingRound.nativeToken()
    const token = await ethers.getContractAt(
      EContracts.AnyOldERC20Token,
      tokenAddress
    )

    const maciAddress = await fundingRound.maci()
    const maci = await ethers.getContractAt(EContracts.MACI, maciAddress)

    const userRegistryAddress = await fundingRound.userRegistry()
    const userRegistry = await ethers.getContractAt(
      EContracts.SimpleUserRegistry,
      userRegistryAddress
    )

    const contributionAmount = (UNIT * BigInt(16)) / BigInt(10)

    for (const contributor of [contributor1, contributor2]) {
      const contributorAddress = await contributor.getAddress()

      let tx = await userRegistry.addUser(contributorAddress)
      let receipt = await tx.wait()
      if (receipt.status !== 1) {
        throw new Error(`Failed to add user to the user registry`)
      }

      // transfer token to contributor first
      tx = await token.transfer(contributorAddress, contributionAmount)
      receipt = await tx.wait()
      if (receipt.status !== 1) {
        throw new Error(`Failed to transfer token for ${contributorAddress}`)
      }

      const contributorKeypair = new Keypair()
      const tokenAsContributor = token.connect(contributor) as ERC20
      tx = await tokenAsContributor.approve(
        fundingRound.target,
        contributionAmount
      )
      receipt = await tx.wait()
      if (receipt.status !== 1) {
        throw new Error('Failed to approve token')
      }

      const fundingRoundAsContributor = fundingRound.connect(
        contributor
      ) as FundingRound
      const contributionTx = await fundingRoundAsContributor.contribute(
        contributorKeypair.pubKey.asContractParam(),
        contributionAmount
      )
      receipt = await contributionTx.wait()
      if (receipt.status !== 1) {
        throw new Error('Failed to contribute')
      }

      const stateIndex = await getEventArg(
        contributionTx,
        maci,
        'SignUp',
        '_stateIndex'
      )
      const voiceCredits = await getEventArg(
        contributionTx,
        maci,
        'SignUp',
        '_voiceCreditBalance'
      )

      console.log(
        `Contributor ${contributorAddress} registered. State index: ${stateIndex}. Voice credits: ${voiceCredits.toString()}.`
      )

      const pollContractAsContributor = pollContract.connect(
        contributor
      ) as Poll

      await vote(
        stateIndex,
        pollId,
        contributorKeypair,
        coordinatorPubKey,
        voiceCredits,
        pollContractAsContributor
      )
      console.log(`Contributor ${contributorAddress} voted.`)
    }
  }
)
