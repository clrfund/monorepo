import sdk from '@/graphql/sdk'
import { utils } from 'ethers'
import { Keypair, PubKey, Command, Message } from '@clrfund/maci-utils'

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

/**
 * Check if the public keys are the same
 * @param key1 public key 1
 * @param key2 public key 2
 * @returns true if they are the same
 */
export function isSamePubKey(key1: PubKey, key2: PubKey): boolean {
  const k1 = key1.asContractParam()
  const k2 = key2.asContractParam()
  return k1.x === k2.x && k1.y === k2.y
}

/**
 * Find a message that was encrypted using the newKeypair and signed by the keypair
 * @param keypair the current key
 * @param newKeypair the new key to find
 * @param fundingRoundAddress funding round address where the key was generated
 * @param coordinatorPubKey the coordinator public key
 * @returns true if the new key exists
 */
async function findNewKey({
  keypair,
  newKeypair,
  fundingRoundAddress,
  coordinatorPubKey,
}: {
  keypair: Keypair
  newKeypair: Keypair
  fundingRoundAddress: string
  coordinatorPubKey: PubKey
}): Promise<boolean> {
  const pubKeyId = getPubKeyId(newKeypair.pubKey)
  const sharedKey = Keypair.genEcdhSharedKey(
    newKeypair.privKey,
    coordinatorPubKey
  )

  const result = await sdk.GetContributorMessages({
    fundingRoundAddress,
    pubKey: pubKeyId,
  })

  if (!(result.messages && result.messages?.length)) {
    return false
  }

  // there should only be 1 key change message, if we found more than 1, they are invalid
  let found = 0
  for (let i = 0; i < result.messages.length; i++) {
    const { iv, data } = result.messages[i]

    const maciMessage = new Message(iv, data || [])
    const { command, signature } = Command.decrypt(maciMessage, sharedKey)

    if (command.verifySignature(signature, keypair.pubKey)) {
      found++
    }
  }

  return found === 1
}

/**
 * Get the current MACI keypair by checking for key changes
 *
 * @param encryptionKey hash of the user signature to generate the key from
 * @returns Keypair
 */
export async function getKeyPair({
  encryptionKey,
  fundingRoundAddress,
  coordinatorPubKey,
}: {
  fundingRoundAddress: string
  encryptionKey: string
  coordinatorPubKey: PubKey
}): Promise<Keypair> {
  let keyIndex = 1
  let keypair = Keypair.createFromSignatureHash(encryptionKey, keyIndex)

  // increment the key index and loop until we cannot find any key for that index
  let found = false
  do {
    keyIndex++
    const newKeypair = Keypair.createFromSignatureHash(encryptionKey, keyIndex)
    found = await findNewKey({
      keypair,
      newKeypair,
      fundingRoundAddress,
      coordinatorPubKey,
    })

    if (found) {
      keypair = newKeypair
    }
    // stop when we did't find the next key
  } while (found)

  return keypair
}
