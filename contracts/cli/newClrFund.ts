/**
 * Create a new instance of the ClrFund contract.
 *
 * If the coordinator ETH address is not provided, use the signer address
 * If the COORDINATOR_MACISK environment varibale not set in the .env file,
 * this script will create a new random MACI key
 *
 * Display help:
 *  yarn ts-node cli/newClrFund.ts -h
 *
 * Sample usage:
 *
 *  HARDHAT_NETWORK=localhost yarn ts-node cli/newClrFund.ts \
 *    --directory <circuit directory> \
 *    --token <native token address> \
 *    --coordinator <coordinator ETH address> \
 *    --user-registry-type <user registry type> \
 *    --recipient-registry-type <recipient registry type>
 *
 *
 * If user registry address and recipient registry address are not provided,
 * the registry types become mandatory as well as the other parameters needed
 * to deploy the registries
 *
 * If token is not provided, a new ERC20 token will be created
 */
import { parseUnits, Signer } from 'ethers'
import { ethers, network, config } from 'hardhat'
import { getEventArg } from '../utils/contracts'
import { newMaciPrivateKey } from '../utils/maci'
import { MaciParameters } from '../utils/maciParameters'
import {
  challengePeriodSeconds,
  deployContract,
  deployUserRegistry,
  deployRecipientRegistry,
  setCoordinator,
  deployMaciFactory,
  deployPoseidonLibraries,
} from '../utils/deployment'
import { JSONFile } from '../utils/JSONFile'
import { Option, program } from 'commander'
import dotenv from 'dotenv'
import { UNIT, BRIGHTID_VERIFIER_ADDR } from '../utils/constants'
import { DEFAULT_CIRCUIT } from '../utils/circuits'

dotenv.config()

const DEFAULT_DEPOSIT_AMOUNT = '0.001'

program
  .description('Deploy a new ClrFund instance')
  .option('-d --deployer <deployer>', 'The ClrFund deployer contract address')
  .option('-q --circuit <circuit>', 'The circuit type', DEFAULT_CIRCUIT)
  .option('-z --directory <directory>', 'The circuit directory')
  .option('-c --coordinator <coordinator>', 'The coordinator ETH address')
  .option('-t --token <address>', 'The native token address')
  .addOption(
    new Option(
      '-a --initial-token-supply <amount>',
      'Initial token amount for new token'
    ).default(1000)
  )
  .addOption(
    new Option('-u --user-registry-type <user>', 'The user registry type')
      .choices(['simple', 'brightid', 'merkle', 'storage'])
      .default('simple')
  )
  .option('-x --brightid-context <context>', 'The brightid context')
  .addOption(
    new Option(
      '-v --brightid-verifier <verifier>',
      'The brightid verifier address'
    ).default(BRIGHTID_VERIFIER_ADDR)
  )
  .option(
    '-o --brightid-sponsor <sponsor>',
    'The brightid sponsor contract address'
  )
  .addOption(
    new Option(
      '-r --recipient-registry-type <recipient>',
      'The recipient registry type'
    )
      .choices(['simple', 'optimistic'])
      .default('optimistic')
  )
  .addOption(
    new Option(
      '-b --deposit <deposit>',
      'The optimistic recipient registry deposit'
    ).default(DEFAULT_DEPOSIT_AMOUNT)
  )
  .option(
    '-p --challenge-period <period>',
    'The optimistic recipient registry challenge period in seconds',
    challengePeriodSeconds
  )
  .option(
    '-s --state-file <file>',
    'File to store the ClrFundDeployer address for e2e testing'
  )
  .parse()

/**
 * Deploy ClrFund as a standalone instance
 * @param artifactsPath The hardhat artifacts path
 * @param circuit The circuit type
 * @param directory The directory containing the zkeys files
 * @returns ClrFund contract address
 */
async function deployStandaloneClrFund({
  artifactsPath,
  circuit,
  directory,
  signer,
}: {
  artifactsPath: string
  circuit: string
  directory: string
  signer: Signer
}): Promise<string> {
  const libraries = await deployPoseidonLibraries({
    artifactsPath,
    signer,
    ethers,
  })
  console.log('Deployed Poseidons', libraries)

  const maciParameters = await MaciParameters.fromConfig(circuit, directory)
  const quiet = false
  const maciFactory = await deployMaciFactory({
    libraries,
    ethers,
    maciParameters,
    quiet,
  })

  const fundingRoundFactory = await deployContract({
    name: 'FundingRoundFactory',
    ethers,
  })

  const clrfund = await deployContract({
    name: 'ClrFund',
    ethers,
    signer,
  })
  const clrfundAddress = await clrfund.getAddress()
  console.log('Deployed ClrFund at', clrfundAddress)

  const initTx = await clrfund.init(maciFactory, fundingRoundFactory)
  await initTx.wait()

  return clrfundAddress
}

/**
 * Deploy the ClrFund contract using the deployer contract
 * @param deployer ClrFund deployer contract
 * @returns ClrFund contract address
 */
async function deployClrFundFromDeployer(deployer: string): Promise<string> {
  const clrfundDeployer = await ethers.getContractAt(
    'ClrFundDeployer',
    deployer
  )
  console.log('ClrFundDeployer:', clrfundDeployer.target)

  const tx = await clrfundDeployer.deployClrFund()
  const receipt = await tx.wait()

  let clrfund: string
  try {
    clrfund = await getEventArg(tx, clrfundDeployer, 'NewInstance', 'clrfund')
    console.log('ClrFund: ', clrfund)
  } catch (e) {
    console.log('receipt', receipt)
    throw new Error(
      'Unable to get clrfund address after deployment. ' + (e as Error).message
    )
  }

  return clrfund
}

async function main(args: any) {
  const { deployer, coordinator, stateFile, circuit, directory } = args
  const [signer] = await ethers.getSigners()

  console.log('Network: ', network.name)
  console.log(`Deploying from address: ${signer.address}`)
  console.log('args', args)

  if (!directory && !deployer) {
    throw new Error(`'-z --directory <directory>' is required`)
  }

  // If the maci secret key is not set in the env. variable, create a new key
  const coordinatorMacisk =
    process.env.COORDINATOR_MACISK ?? newMaciPrivateKey()

  const clrfund = deployer
    ? await deployClrFundFromDeployer(deployer)
    : await deployStandaloneClrFund({
        signer,
        circuit,
        directory,
        artifactsPath: config.paths.artifacts,
      })

  const clrfundContract = await ethers.getContractAt('ClrFund', clrfund, signer)

  // set coordinator, use the coordinator address if available,
  // otherwise use the signer address
  const coordinatorAddress = coordinator ?? signer.address
  const setCoordinatorTx = await setCoordinator({
    clrfundContract,
    coordinatorAddress,
    coordinatorMacisk,
  })
  await setCoordinatorTx.wait()
  console.log('Set coordinator address', coordinatorAddress)

  // set token
  let tokenAddress = args.token
  if (!tokenAddress) {
    const initialTokenSupply = UNIT * BigInt(args.initialTokenSupply)
    const tokenContract = await deployContract({
      name: 'AnyOldERC20Token',
      contractArgs: [initialTokenSupply],
      ethers,
      signer,
    })
    tokenAddress = await tokenContract.getAddress()
  }
  const setTokenTx = await clrfundContract.setToken(tokenAddress)
  await setTokenTx.wait()
  console.log('Set token address', tokenAddress)

  // set user registry
  let userRegistryAddress = args.userRegistryAddress
  if (!userRegistryAddress) {
    const userRegistryContract = await deployUserRegistry({
      ethers,
      signer,
      userRegistryType: args.userRegistryType,
      brightidContext: args.brightidContext,
      brightidVerifier: args.brightidVerifier,
      brightidSponsor: args.brightidSponsor,
    })
    userRegistryAddress = await userRegistryContract.getAddress()
  }
  const setUserRegistryTx =
    await clrfundContract.setUserRegistry(userRegistryAddress)
  await setUserRegistryTx.wait()
  console.log(
    `Set ${args.userRegistryType} user registry: ${userRegistryAddress}`
  )

  // set recipient registry
  let recipientRegistryAddress = args.recipientRegistryAddress
  if (!recipientRegistryAddress) {
    const deposit = parseDeposit(args.deposit)
    const recipientRegistryContract = await deployRecipientRegistry({
      ethers,
      signer,
      type: args.recipientRegistryType,
      challengePeriod: args.challengePeriod,
      deposit,
      controller: clrfund,
    })
    recipientRegistryAddress = await recipientRegistryContract.getAddress()
  }

  const setRecipientRegistryTx = await clrfundContract.setRecipientRegistry(
    recipientRegistryAddress
  )
  await setRecipientRegistryTx.wait()

  console.log(
    `Set ${args.recipientRegistryType} recipient registry: ${recipientRegistryAddress}`
  )

  if (stateFile) {
    // save the test data for running the tally script later
    JSONFile.update(stateFile, { clrfund, coordinatorMacisk })
  }
}

function parseDeposit(deposit: string): bigint {
  try {
    return parseUnits(deposit)
  } catch (e) {
    throw new Error(`Error parsing deposit ${(e as Error).message}`)
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
