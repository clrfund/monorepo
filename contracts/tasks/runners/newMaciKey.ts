/**
 * Create a new MACI key
 *
 * Sample usage:
 *
 *  yarn hardhat new-maci-key
 */

import { newMaciPrivateKey } from '../../utils/maci'

import { task } from 'hardhat/config'

task('new-maci-key', 'Generate a new MACI key').setAction(async () => {
  const privateKey = newMaciPrivateKey()
  console.log('MACI private key:', privateKey)
})
