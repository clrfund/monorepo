import sdk from '@/graphql/sdk'
import { utils } from 'ethers'
import { Keypair, PubKey } from '@clrfund/maci-utils'

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
 * Check if the key was used to encrypt messages
 *
 * @param keypair the key to check
 * @param fundingRoundAddress round address
 * @param contributorAddress wallet address
 * @returns true if the key was used to encrypt messages
 */
export async function findKeyPair({
  keypair,
  fundingRoundAddress,
  contributorAddress,
}: {
  keypair: Keypair
  fundingRoundAddress: string
  contributorAddress: string
}): Promise<boolean> {
  const pubKeyId = getPubKeyId(keypair.pubKey)
  const result = await sdk.GetContributorMessages({
    fundingRoundAddress,
    pubKey: pubKeyId,
    contributorAddress,
  })

  return result.messages && result.messages.length > 0
}

/**
 * Check if the public key exists
 * @param pubKey public key to check
 * @returns true if the public key exists in the subgraph
 */
export async function publicKeyExists(pubKey: PubKey): Promise<boolean> {
  const pubKeyId = getPubKeyId(pubKey)
  const data = await sdk.GetPublicKey({ pubKey: pubKeyId })

  return Boolean(data.publicKey)
}
