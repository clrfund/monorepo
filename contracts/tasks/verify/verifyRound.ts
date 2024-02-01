import { task } from 'hardhat/config'
import { EContracts } from '../../utils/types'

async function getConstructorArguments(
  address: string,
  ethers: any
): Promise<any[]> {
  const round = await ethers.getContractAt(EContracts.FundingRound, address)

  const args = await Promise.all([
    round.nativeToken(),
    round.userRegistry(),
    round.recipientRegistry(),
    round.coordinator(),
  ])
  return args
}

task('verify-round', 'Verify a funding round contract')
  .addParam('address', 'Funding round contract address')
  .setAction(async ({ address }, { run, ethers }) => {
    const constructorArguments = await getConstructorArguments(address, ethers)
    console.log('Constructor arguments', constructorArguments)

    await run('verify:verify', {
      address,
      constructorArguments,
    })
  })
