import { task } from 'hardhat/config'
import { Contract } from 'ethers'

async function getConstructorArguments(maciFactory: Contract): Promise<any[]> {
  const result = await Promise.all([
    maciFactory.vkRegistry(),
    maciFactory.factories(),
    maciFactory.verifier(),
  ])
  return result
}

/**
 * Verifies the MACI factory contract
 * - it constructs the constructor arguments by querying the MACI factory contract
 * - it calls the etherscan hardhat plugin to verify the contract
 */
task('verify-maci-factory', 'Verify a MACI factory contract')
  .addParam('address', 'MACI factory contract address')
  .setAction(async ({ address }, { run, ethers }) => {
    const maciFactory = await ethers.getContractAt('MACIFactory', address)

    const constructorArguments = await getConstructorArguments(maciFactory)
    console.log('Constructor arguments', constructorArguments)

    await run('verify:verify', {
      address,
      constructorArguments,
    })
  })
