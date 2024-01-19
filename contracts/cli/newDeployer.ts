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
import { MaciParameters } from '../utils/maciParameters'

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

  const maciParameters = await MaciParameters.fromConfig(
    args.circuit,
    args.directory
  )
  const maciFactory = await deployMaciFactory({
    libraries,
    ethers,
    maciParameters,
  })
  console.log('Deployed MaciFactory at', maciFactory.target)

  const clrfundTemplate = await deployContract({
    name: 'ClrFund',
    ethers,
  })
  console.log('Deployed ClrFund Template at', clrfundTemplate.target)

  const fundingRoundFactory = await deployContract({
    name: 'FundingRoundFactory',
    ethers,
  })
  console.log('Deployed FundingRoundFactory at', fundingRoundFactory.target)

  const clrfundDeployer = await deployContract({
    name: 'ClrFundDeployer',
    ethers,
    contractArgs: [
      clrfundTemplate.target,
      maciFactory.target,
      fundingRoundFactory.target,
    ],
  })
  console.log('Deployed ClrfundDeployer at', clrfundDeployer.target)

  if (args.stateFile) {
    const clrfundDeployerAddress = await clrfundDeployer.getAddress()
    JSONFile.update(args.stateFile, { deployer: clrfundDeployerAddress })
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
