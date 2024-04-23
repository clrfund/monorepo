import { keccak256, isBytesLike, concat, toBeArray } from 'ethers'
import { Keypair as MaciKeypair, PrivKey, PubKey } from 'maci-domainobjs'

const SNARK_FIELD_SIZE = BigInt(
  '21888242871839275222246405745257275088548364400416034343698204186575808495617'
)

/**
 * Returns a BabyJub-compatible value. This function is modified from
 * the MACI's genRandomBabyJubValue(). Instead of returning random value
 * for the private key, it derives the private key from the users
 * signature hash
 * @param hash - user's signature hash
 */
function genPrivKey(hash: string): PrivKey {
  // Prevent modulo bias
  //const lim = BigInt('0x10000000000000000000000000000000000000000000000000000000000000000')
  //const min = (lim - SNARK_FIELD_SIZE) % SNARK_FIELD_SIZE
  const min = BigInt(
    '6350874878119819312338956282401532410528162663560392320966563075034087161851'
  )

  if (!isBytesLike(hash)) {
    throw new Error(`Hash must be a hex string: ${hash}`)
  }

  let hashBN = BigInt(hash)
  // don't think we'll enter the for loop below, but, just in case
  for (let counter = 1; hashBN < min; counter++) {
    const data = concat([toBeArray(hashBN), toBeArray(counter)])
    hashBN = BigInt(keccak256(data))
  }

  const rawPrivKey = hashBN % SNARK_FIELD_SIZE
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
