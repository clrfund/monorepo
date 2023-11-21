/**
 * Add contributors for testing purposes
 *
 * Sample usage:
 *
 *  yarn hardhat add-contributors --network <network> \
 *    --state-file <state file for inputs>
 *
 */

import { task } from 'hardhat/config'

task('add-contributors', 'Add test contributors')
  .addParam('clrfund', 'The ClrFund contract address')
  .setAction(async ({ clrfund }, { ethers }) => {
    const [signer, , , , , , , , , , , , contributor1, contributor2] =
      await ethers.getSigners()
    console.log('Adding contributors by', signer.address)

    const clrfundContract = await ethers.getContractAt(
      'ClrFund',
      clrfund,
      signer
    )
    const userRegistryAddress = await clrfundContract.userRegistry()
    console.log('User registry address', userRegistryAddress)

    const userRegistry = await ethers.getContractAt(
      'SimpleUserRegistry',
      userRegistryAddress,
      signer
    )
    const users = [contributor1, contributor2]
    let addUserTx
    for (const account of users) {
      addUserTx = await userRegistry.addUser(account.getAddress())
      addUserTx.wait()
    }

    console.log(`Added ${users.length} contributors`)
  })
