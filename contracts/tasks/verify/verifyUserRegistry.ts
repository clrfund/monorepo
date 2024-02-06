/**
 * Verifies the user registry
 *
 * Sample usage:
 * yarn hardhat verify-user-registry --address <user registry address> --network <network>
 */
import { task } from 'hardhat/config'
import { EContracts } from '../../utils/types'

type ProvidedArgs = {
  context?: string
  verifier?: string
  sponsor?: string
}

async function getConstructorArguments(
  address: string,
  ethers: any,
  provided: ProvidedArgs = {}
): Promise<any[]> {
  const registry = await ethers.getContractAt(
    EContracts.BrightIdUserRegistry,
    address
  )

  try {
    let verifier = await registry.verifier()
    if (provided.verifier) {
      verifier = provided.verifier
    }

    const sponsor = provided.sponsor
      ? provided.sponsor
      : await registry.brightIdSponsor()

    const context = provided.context
      ? provided.context
      : await registry.context()

    return [context, verifier, sponsor]
  } catch {
    // simple user registry
    return []
  }
}

task('verify-user-registry', 'Verify a user registry contract')
  .addParam('address', 'User registry contract address')
  .addOptionalParam('sponsor', 'BrightId sponsor contract address')
  .addOptionalParam('verifier', 'BrightId verifier address')
  .addOptionalParam('context', 'BrightId context')
  .setAction(
    async ({ address, sponsor, verifier, context }, { run, ethers }) => {
      const constructorArguments = await getConstructorArguments(
        address,
        ethers,
        { sponsor, verifier, context }
      )
      console.log('Constructor arguments', constructorArguments)

      await run('verify:verify', {
        address,
        constructorArguments,
      })
    }
  )
