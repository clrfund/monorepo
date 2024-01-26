/**
 * Verify the tally file
 *
 * Sample usage:
 * HARDHAT_NETWORK=<network> yarn ts-node cli/verify.ts -f <tally.json> -t <tally contract address>
 */
import { ethers, network } from 'hardhat'
import { verify } from '../utils/maci'
import { program } from 'commander'
import { JSONFile } from '../utils/JSONFile'

program
  .description('Verify the tally file')
  .requiredOption('-f tally-file <file>', 'The tally file')
  .requiredOption('-t tally-address <address>', 'The tally contract address')
  .parse()

async function main(args: any) {
  const [deployer] = await ethers.getSigners()
  console.log('deployer', deployer.address)
  console.log('network', network.name)
  console.log('args', args)

  const { tallyFile, tallyAddress } = args
  const tallyData = JSONFile.read(tallyFile)
  const pollId = tallyData.pollId
  const maciAddress = tallyData.maci

  await verify({
    subsidyEnabled: false,
    tallyFile,
    pollId: BigInt(pollId),
    maciAddress,
    tallyAddress,
    quiet: false,
  })
}

main(program.opts())
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
