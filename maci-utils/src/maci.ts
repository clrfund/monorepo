import { BigNumber, utils } from 'ethers'
import { genRandomSalt, IncrementalQuinTree } from 'maci-crypto'
import {
  Keypair as MaciKeypair,
  PubKey,
  PrivKey,
  Command,
  Message,
} from 'maci-domainobjs'

const SNARK_FIELD_SIZE = BigInt(
  '21888242871839275222246405745257275088548364400416034343698204186575808495617'
)

declare type PathElements = BigInt[][]
declare type Indices = number[]
declare type Leaf = BigInt

interface MerkleProof {
  pathElements: PathElements
  indices: Indices
  depth: number
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

/**
 * Returns a BabyJub-compatible value. This function is modified from
 * the MACI's genRandomBabyJubValue(). Instead of returning random value
 * for the private key, it derives the private key from the users',
 * signature hash
 * @param hash - user's signature hash
 */
function genPrivKey(hash: string): PrivKey {
  // Prevent modulo bias
  //const lim = BigInt('0x10000000000000000000000000000000000000000000000000000000000000000')
  //const min = (lim - SNARK_FIELD_SIZE) % SNARK_FIELD_SIZE
  const min = BigNumber.from(
    '6350874878119819312338956282401532410528162663560392320966563075034087161851'
  )

  if (!utils.isBytesLike(hash)) {
    throw new Error(`Hash must be a hex string: ${hash}`)
  }

  let hashBN = BigNumber.from(hash)
  // don't think we'll enter the for loop below, but, just in case
  for (let counter = 1; min.gte(hashBN); counter++) {
    const data = utils.concat([utils.hexValue(hashBN), utils.arrayify(counter)])
    hashBN = BigNumber.from(utils.keccak256(data))
  }

  const rawPrivKey: BigInt = BigInt(hashBN.toString()) % SNARK_FIELD_SIZE
  if (rawPrivKey >= SNARK_FIELD_SIZE) {
    throw new Error(
      `privKey ${rawPrivKey} must be less than SNARK_FIELD_SIZE ${SNARK_FIELD_SIZE}`
    )
  }

  return new PrivKey(rawPrivKey)
}

export class Keypair extends MaciKeypair {
  // generate a key pair from a user's signature hash
  static createFromSignatureHash(hash: string): Keypair {
    const privKey = genPrivKey(hash.startsWith('0x') ? hash : '0x' + hash)
    return new Keypair(privKey)
  }
}

export function createMessage(
  userStateIndex: number,
  userKeypair: Keypair,
  newUserKeypair: Keypair | null,
  coordinatorPubKey: PubKey,
  voteOptionIndex: number | null,
  voiceCredits: BigNumber | null,
  nonce: number,
  salt?: BigInt
): [Message, PubKey] {
  const encKeypair = newUserKeypair ? newUserKeypair : userKeypair
  if (!salt) {
    salt = genRandomSalt()
  }

  const quadraticVoteWeight = voiceCredits
    ? bnSqrt(voiceCredits)
    : BigNumber.from(0)

  const command = new Command(
    BigInt(userStateIndex),
    encKeypair.pubKey,
    BigInt(voteOptionIndex || 0),
    BigInt(quadraticVoteWeight.toString()),
    BigInt(nonce),
    salt
  )
  const signature = command.sign(userKeypair.privKey)
  const message = command.encrypt(
    signature,
    Keypair.genEcdhSharedKey(encKeypair.privKey, coordinatorPubKey)
  )
  return [message, encKeypair.pubKey]
}

export interface Tally {
  provider: string
  maci: string
  results: {
    commitment: string
    tally: string[]
    salt: string
  }
  totalVoiceCredits: {
    spent: string
    commitment: string
    salt: string
  }
  totalVoiceCreditsPerVoteOption: {
    commitment: string
    tally: string[]
    salt: string
  }
}

export function getRecipientClaimData(
  recipientIndex: number,
  recipientTreeDepth: number,
  tally: Tally
): any[] {
  // Create proof for total amount of spent voice credits
  const spent = tally.totalVoiceCreditsPerVoteOption.tally[recipientIndex]
  const spentSalt = tally.totalVoiceCreditsPerVoteOption.salt
  const spentTree = new IncrementalQuinTree(recipientTreeDepth, BigInt(0))
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

export { PrivKey, PubKey, Command, Message }
