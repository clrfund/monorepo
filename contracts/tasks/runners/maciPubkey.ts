/**
 * Print the serialized MACI public key given either the secret key or
 * the x and y values of the public key
 *
 * Usage: hardhat maci-pubkey --macisk <secret key>
 */
import { id } from 'ethers'
import { task } from 'hardhat/config'
import { PubKey, PrivKey, Keypair } from '@clrfund/common'

task('maci-pubkey', 'Get the serialized MACI public key')
  .addOptionalParam('x', 'MACI public key x')
  .addOptionalParam('y', 'MACI public key y')
  .addOptionalParam('macisk', 'MACI secret key')
  .setAction(async ({ x, y, macisk }) => {
    if (macisk) {
      const isValid = PrivKey.isValidSerializedPrivKey(macisk)
      console.log('isValid', isValid)
      const keypair = new Keypair(PrivKey.deserialize(macisk))
      console.log(`Public Key: ${keypair.pubKey.serialize()}`)
      console.log(keypair.pubKey.asContractParam())
    } else {
      if (!x || !y) {
        console.error('Must provide either macisk or x y values')
        return
      }
      const pubKey = new PubKey([BigInt(x), BigInt(y)])
      console.log(`Public Key: ${pubKey.serialize()}`)

      const subgraphId = id(x + '.' + y)
      console.log(`Subgraph id: ${subgraphId}`)
    }
  })
