import { id } from 'ethers'
import {
  genTreeCommitment as genTallyResultCommitment,
  genRandomSalt,
  IncrementalQuinTree,
  hashLeftRight,
  hash5,
  hash3,
  hash2,
} from 'maci-crypto'
import { PubKey, PCommand, Message } from 'maci-domainobjs'
import { Keypair } from './keypair'
import { Tally } from './tally'
import { bnSqrt } from './math'

const LEAVES_PER_NODE = 5

export function createMessage(
  userStateIndex: number,
  userKeypair: Keypair,
  newUserKeypair: Keypair | null,
  coordinatorPubKey: PubKey,
  voteOptionIndex: number | null,
  voiceCredits: bigint | null,
  nonce: number,
  pollId: bigint,
  salt?: bigint
): [Message, PubKey] {
  const encKeypair = newUserKeypair ? newUserKeypair : userKeypair
  if (!salt) {
    salt = genRandomSalt() as bigint
  }

  const quadraticVoteWeight = voiceCredits ? bnSqrt(voiceCredits) : 0n

  const command = new PCommand(
    BigInt(userStateIndex),
    encKeypair.pubKey,
    BigInt(voteOptionIndex || 0),
    quadraticVoteWeight,
    BigInt(nonce),
    pollId,
    salt
  )
  const signature = command.sign(userKeypair.privKey)
  const message = command.encrypt(
    signature,
    Keypair.genEcdhSharedKey(encKeypair.privKey, coordinatorPubKey)
  )
  return [message, encKeypair.pubKey]
}

export function getRecipientClaimData(
  recipientIndex: number,
  recipientTreeDepth: number,
  tally: Tally
): any[] {
  const maxRecipients = tally.perVOSpentVoiceCredits.tally.length
  if (recipientIndex >= maxRecipients) {
    throw new Error(`Invalid recipient index ${recipientIndex}.`)
  }

  // Create proof for total amount of spent voice credits
  const spent = tally.perVOSpentVoiceCredits.tally[recipientIndex]
  const spentSalt = tally.perVOSpentVoiceCredits.salt
  const spentTree = new IncrementalQuinTree(
    recipientTreeDepth,
    BigInt(0),
    LEAVES_PER_NODE,
    hash5
  )
  for (const leaf of tally.perVOSpentVoiceCredits.tally) {
    spentTree.insert(BigInt(leaf))
  }
  const spentProof = spentTree.genProof(recipientIndex)

  const resultsCommitment = genTallyResultCommitment(
    tally.results.tally.map((x) => BigInt(x)),
    BigInt(tally.results.salt),
    recipientTreeDepth
  )

  const spentVoiceCreditsCommitment = hash2([
    BigInt(tally.totalSpentVoiceCredits.spent),
    BigInt(tally.totalSpentVoiceCredits.salt),
  ])

  return [
    recipientIndex,
    spent,
    spentProof.pathElements.map((x) => x.map((y) => y.toString())),
    spentSalt,
    resultsCommitment,
    spentVoiceCreditsCommitment,
  ]
}

export {
  genTallyResultCommitment,
  Message,
  PCommand as Command,
  IncrementalQuinTree,
  hash5,
  hash2,
  hash3,
  hashLeftRight,
  LEAVES_PER_NODE,
}
