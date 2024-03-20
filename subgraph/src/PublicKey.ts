import { ByteArray, crypto, BigInt } from '@graphprotocol/graph-ts'

// Create the PublicKey entity id used in subgraph
// using MACI public key x and y values
export function makePublicKeyId(
  fundingRoundId: string,
  x: BigInt,
  y: BigInt
): string {
  let publicKeyX = x.toString()
  let publicKeyY = y.toString()
  let publicKeyXY = ByteArray.fromUTF8(
    fundingRoundId + '.' + publicKeyX + '.' + publicKeyY
  )
  let publicKeyId = crypto.keccak256(publicKeyXY).toHexString()
  return publicKeyId
}
