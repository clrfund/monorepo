/**
 * Add contributors for testing purposes
 *
 * Sample usage:
 *
 *  yarn hardhat test-add-contributors <clrfund address> --network <network>
 *
 */
import { task } from 'hardhat/config'
import { EContracts } from '../../utils/types'

task('test-add-contributors', 'Add test contributors')
  .addParam('clrfund', 'The ClrFund contract address')
  .setAction(async ({ clrfund }, { ethers }) => {
    const [signer, , , , , , , , , , , , contributor1, contributor2] =
      await ethers.getSigners()
    console.log('Adding contributors by', signer.address)

    const clrfundContract = await ethers.getContractAt(
      EContracts.ClrFund,
      clrfund,
      signer
    )
    const userRegistryAddress = await clrfundContract.userRegistry()
    console.log('User registry address', userRegistryAddress)

    const userRegistry = await ethers.getContractAt(
      EContracts.SimpleUserRegistry,
      userRegistryAddress,
      signer
    )
    const users = [contributor1, contributor2]
    let addUserTx
    for (const account of users) {
      addUserTx = await userRegistry.addUser(account.address)
      addUserTx.wait()
    }

    console.log(`Added ${users.length} contributors`)
  })
