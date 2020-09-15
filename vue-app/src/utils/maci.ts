import { BigNumber } from 'ethers'
import { bigInt, SnarkBigInt, genRandomSalt, IncrementalQuinTree } from 'maci-crypto'
import { Keypair, PubKey, Command, Message } from 'maci-domainobjs'

function bnSqrt(a: BigNumber): BigNumber {
  // Take square root from a big number
  // https://stackoverflow.com/a/52468569/1868395
  if (a.isZero()) {
    return a
  }
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
  recipientTreeDepth: number,
  tally: any,
): any[] {
  // Create proof for tally result
  const result = tally.results.tally[recipientIndex]
  const resultSalt = tally.results.salt
  const resultTree = new IncrementalQuinTree(recipientTreeDepth, bigInt(0))
  for (const leaf of tally.results.tally) {
    resultTree.insert(leaf)
  }
  const resultProof = resultTree.genMerklePath(recipientIndex)
  // Create proof for total amount of spent voice credits
  const spent = tally.totalVoiceCreditsPerVoteOption.tally[recipientIndex]
  const spentSalt = tally.totalVoiceCreditsPerVoteOption.salt
  const spentTree = new IncrementalQuinTree(recipientTreeDepth, bigInt(0))
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
