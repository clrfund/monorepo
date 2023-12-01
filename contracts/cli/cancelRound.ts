/**
 * Cancel the current round
 *
 * Sample usage:
 * HARDHAT_NETWORK=localhost yarn ts-node cli/cancelRound.ts <ClrFund address>
 */
import { ethers, network } from 'hardhat'
import { program } from 'commander'

program
  .description('Cancel the current round')
  .argument('clrfund', 'The ClrFund contract address')
  .parse()

async function main(args: any) {
  const [deployer] = await ethers.getSigners()
  console.log('deployer', deployer.address)
  console.log('network', network.name)

  const clrfundContract = await ethers.getContractAt(
    'ClrFund',
    args[0],
    deployer
  )

  const cancelTx = await clrfundContract.cancelCurrentRound()
  await cancelTx.wait()
  console.log('Cancel transaction hash: ', cancelTx.hash)
}

main(program.args)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
