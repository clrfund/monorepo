import { ByteArray, crypto, BigInt } from '@graphprotocol/graph-ts'
import { FundingRound, PublicKey } from '../generated/schema'

// Create the PublicKey entity id used in subgraph
// using MACI public key x and y values
export function makePublicKeyId(x: BigInt, y: BigInt): string {
  let publicKeyX = x.toString()
  let publicKeyY = y.toString()
  let publicKeyXY = ByteArray.fromUTF8(publicKeyX + '.' + publicKeyY)
  let publicKeyId = crypto.keccak256(publicKeyXY).toHexString()
  return publicKeyId
}
