import { keccak256, isBytesLike, concat, toBeArray } from 'ethers'
import { Keypair as MaciKeypair, PrivKey, PubKey } from 'maci-domainobjs'

/**
 * Derives the MACI private key from the users signature hash
 * @param hash - user's signature hash
 * @return The MACI private key
 */
function genPrivKey(hash: string): PrivKey {
  if (!isBytesLike(hash)) {
    throw new Error(`genPrivKey() error. Hash must be a hex string: ${hash}`)
  }

  let rawPrivKey = BigInt(hash)
  let pubKey: PubKey | null = null

  for (let counter = 1; pubKey === null; counter++) {
    try {
      const privKey = new PrivKey(rawPrivKey)
      const keypair = new Keypair(privKey)

      // this will throw 'Invalid public key' if key is not on the Baby Jubjub elliptic curve
      keypair.pubKey.serialize()

      pubKey = keypair.pubKey
    } catch {
      const data = concat([toBeArray(rawPrivKey), toBeArray(counter)])
      rawPrivKey = BigInt(keccak256(data))
    }
  }

  return new PrivKey(rawPrivKey)
}

export class Keypair extends MaciKeypair {
  /**
   * generate a key pair from a seed
   * @param seed The sha256 hash of signature
   * @returns key pair
   */
  static createFromSeed(seed: string): Keypair {
    if (!seed) {
      throw new Error('Keypair seed cannot be empty')
    }
    const sanitizedSeed = seed.startsWith('0x') ? seed : '0x' + seed
    const privKey = genPrivKey(sanitizedSeed)
    return new Keypair(privKey)
  }
}

export { PubKey, PrivKey }
