import sdk from '@/graphql/sdk'
import { utils } from 'ethers'
import { Keypair, PubKey, Command, Message } from '@clrfund/maci-utils'
import { Transaction } from '@/utils/transaction'

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
  let found = false
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
    return found
  }

  let lastTx: Transaction | null = null

  // find the oldest key change message
  // if there are multiple key change messages for the same key, only the
  // oldest one should be valid
  for (let i = 0; i < result.messages.length; i++) {
    const { iv, data, blockNumber, transactionIndex } = result.messages[i]

    const tx = new Transaction({
      blockNumber: Number(blockNumber),
      transactionIndex: Number(transactionIndex),
    })

    if (!lastTx || tx.compare(lastTx) < 0) {
      lastTx = tx
      const maciMessage = new Message(iv, data || [])
      const { command, signature } = Command.decrypt(maciMessage, sharedKey)

      if (command.verifySignature(signature, keypair.pubKey)) {
        found = true
        break
      }
    }
  }

  return found
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
  while (!found) {
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
    } else {
      // could not find a new key, stop now
      break
    }
  }

  return keypair
}
