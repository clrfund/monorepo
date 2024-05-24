/**
 * Simulate contributions to a funding round. This script is mainly used for testing.
 *
 * Sample usage:
 *  yarn hardhat simulate-contribute --count <number of contributors> \
 *   --fund <fund for transaction fee> --network <network>
 *
 * Make sure deployed-contracts.json exists with the funding round address
 * Make sure to use a token with mint() function like 0x65bc8dd04808d99cf8aa6749f128d55c2051edde
 */

import { Keypair, createMessage, Message, PubKey } from '@clrfund/common'

import { UNIT } from '../../utils/constants'
import { getContractAt, getEventArg } from '../../utils/contracts'
import type { FundingRound, ERC20, Poll } from '../../typechain-types'
import { task, types } from 'hardhat/config'
import { EContracts } from '../../utils/types'
import { ContractStorage } from '../helpers/ContractStorage'
import { parseEther, Wallet } from 'ethers'

const tokenAbi = [
  'function mint(address,uint256)',
  'function transfer(address,uint256)',
  'function approve(address,uint256)',
]
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
    const votes = BigInt(voiceCredits) / BigInt(2)
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

task('simulate-contribute', 'Contribute to a funding round')
  .addParam('count', 'Number of contributors to simulate', 70, types.int)
  .addParam('fund', 'Number of contributors to simulate', '0.01')
  .setAction(async ({ count, fund }, { ethers, network }) => {
    // gas for transactions
    const value = parseEther(fund)
    const contributionAmount = UNIT

    const [deployer] = await ethers.getSigners()
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
    const pollContract = await getContractAt<Poll>(
      EContracts.Poll,
      pollAddress,
      ethers
    )

    const rawCoordinatorPubKey = await pollContract.coordinatorPubKey()
    const coordinatorPubKey = new PubKey([
      BigInt(rawCoordinatorPubKey.x),
      BigInt(rawCoordinatorPubKey.y),
    ])

    const tokenAddress = await fundingRound.nativeToken()
    const token = await ethers.getContractAt(tokenAbi, tokenAddress)

    const maciAddress = await fundingRound.maci()
    const maci = await ethers.getContractAt(EContracts.MACI, maciAddress)

    const userRegistryAddress = await fundingRound.userRegistry()
    const userRegistry = await ethers.getContractAt(
      EContracts.SimpleUserRegistry,
      userRegistryAddress
    )

    for (let i = 0; i < count; i++) {
      const contributor = Wallet.createRandom(ethers.provider)

      let tx = await userRegistry.addUser(contributor.address)
      let receipt = await tx.wait()
      if (receipt.status !== 1) {
        throw new Error(`Failed to add user to the user registry`)
      }

      // transfer token to contributor first
      tx = await token.mint(contributor.address, contributionAmount)
      receipt = await tx.wait()
      if (receipt.status !== 1) {
        throw new Error(`Failed to mint token for ${contributor.address}`)
      }

      tx = await deployer.sendTransaction({ value, to: contributor.address })
      receipt = await tx.wait()
      if (receipt.status !== 1) {
        throw new Error(`Failed to fund ${contributor.address}`)
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
        `Contributor ${
          contributor.address
        } registered. State index: ${stateIndex}. Voice credits: ${voiceCredits.toString()}.`
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
      console.log(`Contributor ${contributor.address} voted.`)
    }
  })
