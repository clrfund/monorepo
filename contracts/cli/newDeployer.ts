/**
 * Create a new instance of the ClrFundDeployer
 *
 * Sample usage:
 *
 *  HARDHAT_NETWORK=localhost yarn ts-node cli/newDeployer.ts -d ~/params
 *
 */
import {
  deployContract,
  deployPoseidonLibraries,
  deployMaciFactory,
  setMaciParameters,
} from '../utils/deployment'
import { DEFAULT_CIRCUIT } from '../utils/circuits'
import { JSONFile } from '../utils/JSONFile'
import { ethers, config, network } from 'hardhat'
import { program } from 'commander'

program
  .description('Deploy a new ClrFund deployer')
  .requiredOption('-d --directory <dir>', 'The circuit directory')
  .option('-c --circuit <type>', 'The circuit type', DEFAULT_CIRCUIT)
  .option(
    '-s --state-file <file>',
    'File to store the ClrFundDeployer address for e2e testing'
  )
  .parse()

async function main(args: any) {
  const [signer] = await ethers.getSigners()
  console.log('Circuit: ', args.circuit)
  console.log('Network: ', network.name)
  console.log(`Deploying from address: ${signer.address}`)
  console.log('args', args)

  const libraries = await deployPoseidonLibraries({
    artifactsPath: config.paths.artifacts,
    signer,
    ethers,
  })
  console.log('Deployed Poseidons', libraries)

  const maciFactory = await deployMaciFactory({ libraries, ethers })
  console.log('Deployed MaciFactory at', maciFactory.address)
  await setMaciParameters(maciFactory, args.directory, args.circuit)

  const clrfundTemplate = await deployContract({
    name: 'ClrFund',
    ethers,
  })
  console.log('Deployed ClrFund Template at', clrfundTemplate.address)

  const fundingRoundFactory = await deployContract({
    name: 'FundingRoundFactory',
    libraries,
    ethers,
  })
  console.log('Deployed FundingRoundFactory at', fundingRoundFactory.address)

  const clrfundDeployer = await deployContract({
    name: 'ClrFundDeployer',
    ethers,
    contractArgs: [
      clrfundTemplate.address,
      maciFactory.address,
      fundingRoundFactory.address,
    ],
  })
  console.log('Deployed ClrfundDeployer at', clrfundDeployer.address)

  if (args.stateFile) {
    JSONFile.update(args.stateFile, { deployer: clrfundDeployer.address })
  }
}

main(program.opts())
  .then(() => {
    process.exit(0)
  })
  .catch((err) => {
    console.error(err)
    process.exit(-1)
  })
