import { task } from 'hardhat/config'
import { EContracts } from '../../utils/types'
import { EtherscanProvider } from '../../utils/providers/EtherscanProvider'
import { ContractVerifier } from '../helpers/ContractVerifier'
import { ConstructorArguments } from '../helpers/ConstructorArguments'

/**
 * Verifies the ClrFundDeployer contract
 * - it constructs the constructor arguments by querying the ClrFundDeployer contract
 * - it calls the etherscan hardhat plugin to verify the contract
 */
task('verify-deployer', 'Verify a ClrFundDeployer contract')
  .addParam('address', 'ClrFundDeployer contract address')
  .setAction(async ({ address }, hre) => {
    const contractVerifier = new ContractVerifier(hre)
    const getter = new ConstructorArguments(hre)

    const name = EContracts.ClrFundDeployer
    const constructorArgument = await getter.get(
      EContracts.ClrFundDeployer,
      address,
      hre.ethers
    )
    const [ok, err] = await contractVerifier.verify(
      address,
      constructorArgument
    )

    console.log(
      `${address} ${name}: \x1b[%sm%s\x1b[0m`,
      ok ? 32 : 31,
      ok ? 'ok' : err
    )
  })
