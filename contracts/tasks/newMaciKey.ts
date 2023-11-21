/**
 * Create a new MACI key pair
 *
 * Sample usage:
 *
 *  yarn hardhat new-maci-key
 */

import { task } from 'hardhat/config'
import { Keypair } from '@clrfund/maci-domainobjs'

task('new-maci-key', 'Create a random maci key pair').setAction(async () => {
  const keypair = new Keypair()
  const SecretKey = keypair.privKey.serialize()
  const PublicKey = keypair.pubKey.serialize()

  console.log(`SecretKey: ${SecretKey}`)
  console.log(`PublicKey: ${PublicKey}`)
})
