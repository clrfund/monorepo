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
 * Find change change messages associated with the current keypair and return the new public key
 * @param keypair the current key
 * @param fundingRoundAddress funding round address where the key was generated
 * @param coordinatorPubKey the coordinator public key
 * @returns the new public key
 */
async function findNewPubKey({
  keypair,
  fundingRoundAddress,
  coordinatorPubKey,
}: {
  keypair: Keypair
  fundingRoundAddress: string
  coordinatorPubKey: PubKey
}): Promise<PubKey | null> {
  const pubKeyId = getPubKeyId(keypair.pubKey)
  const sharedKey = Keypair.genEcdhSharedKey(keypair.privKey, coordinatorPubKey)

  const result = await sdk.GetContributorMessages({
    fundingRoundAddress,
    pubKey: pubKeyId,
  })

  if (!(result.messages && result.messages?.length)) {
    return null
  }

  let newKey: PubKey | null = null
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
      const { command } = Command.decrypt(maciMessage, sharedKey)
      const { newPubKey } = command

      if (newPubKey) {
        newKey = newPubKey
      }
    }
  }

  return newKey
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

  // find the latest key, i.e. when no more new key
  let newPubKey: PubKey | null = keypair.pubKey
  while (newPubKey) {
    newPubKey = await findNewPubKey({
      keypair,
      fundingRoundAddress,
      coordinatorPubKey,
    })

    if (newPubKey) {
      keyIndex++
      const newKeypair = Keypair.createFromSignatureHash(
        encryptionKey,
        keyIndex
      )
      if (isSamePubKey(newKeypair.pubKey, newPubKey)) {
        keypair = newKeypair
      }
    }
  }

  return keypair
}
