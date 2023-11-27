/**
 * Add contributors for testing purposes
 *
 * Sample usage:
 *
 *  HARDHAT_NETWORK=localhost yarn ts-node cli/addContributors.ts <clrfund address>
 *
 */

import { program } from 'commander'
import { ethers } from 'hardhat'

program
  .description('Add test contributors')
  .argument('clrfund', 'The ClrFund contract address')
  .parse()

async function main(args: any) {
  const [
    signer,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    contributor1,
    contributor2,
  ] = await ethers.getSigners()
  console.log('Adding contributors by', signer.address)

  const clrfundContract = await ethers.getContractAt('ClrFund', args[0], signer)
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
}

main(program.args)
  .then(() => {
    process.exit(0)
  })
  .catch(err => {
    console.error(err)
    process.exit(-1)
  })
