import { BigNumber } from 'ethers'
import { genRandomSalt, IncrementalQuinTree, hash5, hash2 } from 'maci-crypto'
import { PubKey, PCommand, Message } from 'maci-domainobjs'
import { Keypair } from './keypair'
import { utils } from 'ethers'
import { Tally } from './tally'

const LEAVES_PER_NODE = 5

declare type PathElements = bigint[][]
declare type Indices = number[]
declare type Leaf = bigint

interface MerkleProof {
  pathElements: PathElements
  indices: Indices
  depth: number
  /* eslint-disable-next-line @typescript-eslint/ban-types */
  root: BigInt
  leaf: Leaf
}

export function bnSqrt(a: BigNumber): BigNumber {
  // Take square root from a big number
  // https://stackoverflow.com/a/52468569/1868395
  if (a.isZero()) {
    return a
  }
  let x
  let x1 = a.div(2)
  do {
    x = x1
    x1 = x.add(a.div(x)).div(2)
  } while (!x.eq(x1))
  return x
}

export function createMessage(
  userStateIndex: number,
  userKeypair: Keypair,
  newUserKeypair: Keypair | null,
  coordinatorPubKey: PubKey,
  voteOptionIndex: number | null,
  voiceCredits: BigNumber | null,
  nonce: number,
  pollId: bigint,
  salt?: bigint
): [Message, PubKey] {
  const encKeypair = newUserKeypair ? newUserKeypair : userKeypair
  if (!salt) {
    salt = genRandomSalt() as bigint
  }

  const quadraticVoteWeight = voiceCredits
    ? bnSqrt(voiceCredits)
    : BigNumber.from(0)

  const command = new PCommand(
    BigInt(userStateIndex),
    encKeypair.pubKey,
    BigInt(voteOptionIndex || 0),
    BigInt(quadraticVoteWeight.toString()),
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
  // Create proof for total amount of spent voice credits
  const spent = tally.totalVoiceCreditsPerVoteOption.tally[recipientIndex]
  const spentSalt = tally.totalVoiceCreditsPerVoteOption.salt
  const spentTree = new IncrementalQuinTree(
    recipientTreeDepth,
    BigInt(0),
    LEAVES_PER_NODE,
    hash5
  )
  for (const leaf of tally.totalVoiceCreditsPerVoteOption.tally) {
    spentTree.insert(BigInt(leaf))
  }
  const spentProof: MerkleProof = spentTree.genMerklePath(recipientIndex)

  return [
    recipientIndex,
    spent,
    spentProof.pathElements.map((x) => x.map((y) => y.toString())),
    spentSalt,
  ]
}

/**
 * get the id of the subgraph public key entity from the pubKey value
 * @param pubKey MACI public key
 * @returns the id for the subgraph public key entity
 */
export function getPubKeyId(pubKey: PubKey): string {
  const pubKeyPair = pubKey.asContractParam()
  const id = utils.id(pubKeyPair.x + '.' + pubKeyPair.y)
  return id
}

export {
  Message,
  PCommand as Command,
  IncrementalQuinTree,
  hash5,
  hash2,
  LEAVES_PER_NODE,
}
