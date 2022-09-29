import { task } from 'hardhat/config'

task('verify-round-factory', 'Verify a funding round factory contract')
  .addPositionalParam('address', 'Funding round factory contract address')
  .setAction(async ({ address }, { run, ethers }) => {
    const fundingRoundFactory = await ethers.getContractAt(
      'FundingRoundFactory',
      address
    )
    const maciFactoryAddress = await fundingRoundFactory.maciFactory()

    const constructorArguments = [maciFactoryAddress]

    console.log('Constructor arguments', constructorArguments)

    await run('verify:verify', {
      address,
      constructorArguments,
    })
  })
