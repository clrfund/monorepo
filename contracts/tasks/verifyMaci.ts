import { task } from 'hardhat/config'

/**
 * Verifies the MACI contract
 * - it constructs the constructor arguments by querying the MACI contract
 * - it calls the etherscan hardhat plugin to verify the contract
 *
 * Sample usage:
 * yarn hardhat verify-maci <maci-address> --network <network>
 */
task('verify-maci', 'Verify a MACI contract')
  .addPositionalParam('maciAddress', 'MACI contract address')
  .setAction(async ({ maciAddress }, { run, ethers }) => {
    const maci = await ethers.getContractAt('MACI', maciAddress)
    const constructorArguments = await Promise.all([
      maci.pollFactory(),
      maci.messageProcessorFactory(),
      maci.tallyFactory(),
      maci.subsidyFactory(),
      maci.signUpGatekeeper(),
      maci.initialVoiceCreditProxy(),
      maci.topupCredit(),
      maci.stateTreeDepth(),
    ])

    console.log('Verifying the MACI contract', maciAddress)
    console.log('Constructor arguments', constructorArguments)

    await run('verify:verify', {
      address: maciAddress,
      constructorArguments,
    })
  })
