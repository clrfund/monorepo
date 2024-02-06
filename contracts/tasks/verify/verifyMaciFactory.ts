/**
 * Verifies the MACI factory contract
 *
 * Sample usage:
 * yarn hardhat verify-maci-factory --address <maci factory address> --network <network>
 */

import { task } from 'hardhat/config'
import { Contract } from 'ethers'
import { EContracts } from '../../utils/types'

async function getConstructorArguments(maciFactory: Contract): Promise<any[]> {
  const result = await Promise.all([
    maciFactory.vkRegistry(),
    maciFactory.factories(),
    maciFactory.verifier(),
  ])
  return result
}

task('verify-maci-factory', 'Verify a MACI factory contract')
  .addParam('address', 'MACI factory contract address')
  .setAction(async ({ address }, { run, ethers }) => {
    const maciFactory = await ethers.getContractAt(
      EContracts.MACIFactory,
      address
    )

    const constructorArguments = await getConstructorArguments(maciFactory)
    console.log('Constructor arguments', constructorArguments)

    await run('verify:verify', {
      address,
      constructorArguments,
    })
  })
