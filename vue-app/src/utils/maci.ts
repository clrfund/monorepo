import { BigNumber } from 'ethers'
import { bigInt, genRandomSalt } from 'maci-crypto'
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
