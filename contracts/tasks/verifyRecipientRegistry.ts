import { task } from 'hardhat/config'

type ProvidedArgs = {
  baseDeposit?: string
  challengePeriodDuration?: string
}

async function getConstructorArguments(
  address: string,
  ethers: any,
  provided: ProvidedArgs = {}
): Promise<any[]> {
  const registry = await ethers.getContractAt(
    'OptimisticRecipientRegistry',
    address
  )

  const controller = await registry.controller()
  try {
    let baseDeposit = await registry.baseDeposit()
    if (provided.baseDeposit) {
      baseDeposit = provided.baseDeposit
    }

    const challengePeriodDuration = provided.challengePeriodDuration
      ? provided.challengePeriodDuration
      : await registry.challengePeriodDuration()

    return [baseDeposit, challengePeriodDuration, controller]
  } catch {
    try {
      const klerosRegistry = await ethers.getContractAt(
        'KlerosGTCRAdapter',
        address
      )
      const tcr = await klerosRegistry.tcr()
      return [tcr, controller]
    } catch {
      return [controller]
    }
  }
}

task('verify-recipient-registry', 'Verify a recipient registry contract')
  .addPositionalParam('address', 'Recipient registry contract address')
  .setAction(async ({ address }, { run, ethers }) => {
    const constructorArguments = await getConstructorArguments(address, ethers)
    console.log('Constructor arguments', constructorArguments)

    await run('verify:verify', {
      address,
      constructorArguments,
    })
  })
