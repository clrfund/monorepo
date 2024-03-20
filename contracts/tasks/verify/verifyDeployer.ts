import { task } from 'hardhat/config'
import { Contract } from 'ethers'
import { EContracts } from '../../utils/types'

async function getConstructorArguments(contract: Contract): Promise<unknown[]> {
  const constructorArguments = await Promise.all([
    contract.clrfundTemplate(),
    contract.maciFactory(),
    contract.roundFactory(),
  ])

  return constructorArguments
}

/**
 * Verifies the ClrFundDeployer contract
 * - it constructs the constructor arguments by querying the ClrFundDeployer contract
 * - it calls the etherscan hardhat plugin to verify the contract
 */
task('verify-deployer', 'Verify a ClrFundDeployer contract')
  .addParam('address', 'Poll contract address')
  .setAction(async ({ address }, { run, ethers }) => {
    const contract = await ethers.getContractAt(
      EContracts.ClrFundDeployer,
      address
    )

    const constructorArguments = await getConstructorArguments(contract)
    console.log('Constructor arguments', constructorArguments)

    await run('verify:verify', {
      address,
      constructorArguments,
    })
  })
