import { BigNumber } from 'ethers'
import { bigInt, SnarkBigInt, genRandomSalt, IncrementalQuinTree } from 'maci-crypto'
import { Keypair, PubKey, Command, Message } from 'maci-domainobjs'

export class MaciParameters {

  // Defaults
  stateTreeDepth = 4
  messageTreeDepth = 4
  voteOptionTreeDepth = 2
  tallyBatchSize = 4
  messageBatchSize = 4
  signUpDuration = 7 * 86400
  votingDuration = 7 * 86400

  constructor(parameters: {[name: string]: number} = {}) {
    for (const [name, value] of Object.entries(parameters)) {
      (this as any)[name] = value // eslint-disable-line @typescript-eslint/no-explicit-any
    }
  }

  values(): number[] {
    // To be passed to setMaciParameters()
    return [
      this.stateTreeDepth,
      this.messageTreeDepth,
      this.voteOptionTreeDepth,
      this.tallyBatchSize,
      this.messageBatchSize,
      this.signUpDuration,
      this.votingDuration,
    ]
  }
}

export function bnSqrt(a: BigNumber): BigNumber {
  // Take square root from a big number
  // https://stackoverflow.com/a/52468569/1868395
  let x
  let x1 = a.div(2)
  do {
    x = x1
    x1 = (x.add(a.div(x))).div(2)
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
  salt?: number,
): [Message, PubKey] {
  const encKeypair = new Keypair()
  if (!salt) {
    salt = genRandomSalt()
  }
  const quadraticVoteWeight = voiceCredits ? bnSqrt(voiceCredits) : 0
  const command = new Command(
    bigInt(userStateIndex),
    newUserKeypair ? newUserKeypair.pubKey : userKeypair.pubKey,
    bigInt(voteOptionIndex || 0),
    bigInt(quadraticVoteWeight),
    bigInt(nonce),
    bigInt(salt),
  )
  const signature = command.sign(userKeypair.privKey)
  const message = command.encrypt(
    signature,
    Keypair.genEcdhSharedKey(encKeypair.privKey, coordinatorPubKey),
  )
  return [message, encKeypair.pubKey]
}

export function getRecipientClaimData(
  recipientAddress: string,
  recipientIndex: number,
  tally: any,
): any[] {
  const TREE_DEPTH = 2
  // Create proof for tally result
  const result = tally.results.tally[recipientIndex]
  const resultSalt = tally.results.salt
  const resultTree = new IncrementalQuinTree(TREE_DEPTH, bigInt(0))
  for (const leaf of tally.results.tally) {
    resultTree.insert(leaf)
  }
  const resultProof = resultTree.genMerklePath(recipientIndex)
  // Create proof for total amount of spent voice credits
  const spent = tally.totalVoiceCreditsPerVoteOption.tally[recipientIndex]
  const spentSalt = tally.totalVoiceCreditsPerVoteOption.salt
  const spentTree = new IncrementalQuinTree(TREE_DEPTH, bigInt(0))
  for (const leaf of tally.totalVoiceCreditsPerVoteOption.tally) {
    spentTree.insert(leaf)
  }
  const spentProof = spentTree.genMerklePath(recipientIndex)

  return [
    recipientAddress,
    result,
    resultProof.pathElements.map((x) => x.map((y: SnarkBigInt) => y.toString())),
    resultSalt,
    spent,
    spentProof.pathElements.map((x) => x.map((y: SnarkBigInt) => y.toString())),
    spentSalt,
  ]
}
