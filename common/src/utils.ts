import { BigNumber } from 'ethers'
import {
  genRandomSalt,
  IncrementalQuinTree,
  hashLeftRight,
  hash5,
  hash3,
  hash2,
} from 'maci-crypto'
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
  const spentProof: MerkleProof = spentTree.genMerklePath(recipientIndex)

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

/*
 * This function was copied from MACI to work around tree shaking not working
 * https://github.com/privacy-scaling-explorations/maci/blob/master/core/ts/MaciState.ts#L1581
 *
 * A helper function which hashes a list of results with a salt and returns the
 * hash.
 *
 * @param results A list of vote weights
 * @parm salt A random salt
 * @return The hash of the results and the salt, with the salt last
 */
export function genTallyResultCommitment(
  results: bigint[],
  salt: bigint,
  depth: number
): bigint {
  const tree = new IncrementalQuinTree(depth, BigInt(0), 5, hash5)
  for (const result of results) {
    tree.insert(result)
  }
  return hashLeftRight(tree.root, salt).valueOf()
}

export {
  Message,
  PCommand as Command,
  IncrementalQuinTree,
  hash5,
  hash2,
  hash3,
  hashLeftRight,
  LEAVES_PER_NODE,
}
