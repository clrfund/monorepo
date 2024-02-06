/**
 * Create a new MACI key pair
 *
 * Sample usage:
 *
 *  yarn ts-node tasks/maciNewKey.ts
 */

import { newMaciPrivateKey } from '../utils/maci'

function main() {
  newMaciPrivateKey()
}

main()
