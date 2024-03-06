/**
 * Create a new instance of the ClrFund contract.
 *
 * If the coordinator ETH address is not provided, use the signer address
 * If the COORDINATOR_MACISK environment varibale not set in the .env file,
 * this script will create a new random MACI key
 *
 * Sample usage:
 *
 * yarn hardhat new-clrfund \
 *    --directory <circuit directory> \
 *    --token <native token address> \
 *    --coordinator <coordinator ETH address> \
 *    --user-registry-type <user registry type> \
 *    --recipient-registry-type <recipient registry type> \
 *    --network <network>
 *
 *
 * If user registry address and recipient registry address are not provided,
 * the registry types become mandatory as well as the other parameters needed
 * to deploy the registries
 *
 * If token is not provided, a new ERC20 token will be created
 */
import { parseUnits, Signer } from 'ethers'
import { getEventArg } from '../../utils/contracts'
import { newMaciPrivateKey } from '../../utils/maci'
import { MaciParameters } from '../../utils/maciParameters'
import {
  challengePeriodSeconds,
  deployContract,
  deployUserRegistry,
  deployRecipientRegistry,
  setCoordinator,
  deployMaciFactory,
  deployPoseidonLibraries,
} from '../../utils/deployment'
import { JSONFile } from '../../utils/JSONFile'
import dotenv from 'dotenv'
import { UNIT, BRIGHTID_VERIFIER_ADDR } from '../../utils/constants'
import { DEFAULT_CIRCUIT } from '../../utils/circuits'
import { task, types } from 'hardhat/config'
import { EContracts } from '../../utils/types'
import { HardhatEthersHelpers } from '@nomicfoundation/hardhat-ethers/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

dotenv.config()

const DEFAULT_DEPOSIT_AMOUNT = '0.001'

type Args = {
  deployer: string
  circuit: string
  directory: string
  coordinator?: string
  token?: string
  initialTokenSupply: number
  userRegistryAddress?: string
  userRegistryType?: string
  brightidContext?: string
  brightidSponsor?: string
  brightidVerifier?: string
  recipientRegistryAddress?: string
  recipientRegistryType?: string
  deposit?: string
  challengePeriod?: number
  stateFile?: string
}

task('new-clrfund', 'Deploy a new ClrFund instance')
  .addOptionalParam('deployer', 'The ClrFund deployer contract address')
  .addOptionalParam('circuit', 'The circuit type', DEFAULT_CIRCUIT)
  .addOptionalParam('directory', 'The circuit directory')
  .addOptionalParam('coordinator', 'The coordinator ETH address')
  .addOptionalParam('token', 'The native token address')
  .addOptionalParam(
    'initialTokenSupply',
    'Initial token amount for new token',
    1000,
    types.int
  )
  .addOptionalParam('userRegistryAddress', 'The user registry address')
  .addOptionalParam(
    'userRegistryType',
    'The user registry type: simple, semaphore, brightid, merkle, storage',
    'simple'
  )
  .addOptionalParam('brightidContext', 'The brightid context')
  .addOptionalParam(
    'brightidVerifier',
    'The brightid verifier address',
    BRIGHTID_VERIFIER_ADDR
  )
  .addOptionalParam('brightidSponsor', 'The brightid sponsor contract address')
  .addOptionalParam(
    'recipientRegistryAddress',
    'The recipient registry address'
  )
  .addOptionalParam(
    'recipientRegistryType',
    'The recipient registry type: simpleoptimistic',
    'optimistic'
  )
  .addOptionalParam(
    'deposit',
    'The optimistic recipient registry deposit',
    DEFAULT_DEPOSIT_AMOUNT
  )
  .addOptionalParam(
    'challengePeriod',
    'The optimistic recipient registry challenge period in seconds',
    challengePeriodSeconds
  )
  .addOptionalParam(
    'stateFile',
    'File to store the ClrFundDeployer address for e2e testing'
  )
  .setAction(async (args, hre) => {
    await main(args, hre)
  })

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
  ethers,
}: {
  artifactsPath: string
  circuit: string
  directory: string
  signer: Signer
  ethers: HardhatEthersHelpers
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
async function deployClrFundFromDeployer(
  deployer: string,
  ethers: HardhatEthersHelpers
): Promise<string> {
  const clrfundDeployer = await ethers.getContractAt(
    EContracts.ClrFundDeployer,
    deployer
  )
  console.log(EContracts.ClrFundDeployer, clrfundDeployer.target)

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

async function main(args: Args, hre: HardhatRuntimeEnvironment) {
  const ethers = hre.ethers
  const { deployer, coordinator, stateFile, circuit, directory } = args
  const [signer] = await ethers.getSigners()

  console.log('Network: ', hre.network.name)
  console.log(`Deploying from address: ${signer.address}`)
  console.log('args', args)

  if (!directory && !deployer) {
    throw new Error(`'--directory' is required`)
  }

  if (!args.userRegistryAddress && !args.userRegistryType) {
    throw new Error(
      `Either '--user-registry-address' or '--user-registry-type' is required`
    )
  }

  if (!args.recipientRegistryAddress && !args.recipientRegistryType) {
    throw new Error(
      `Either '--recipient-registry-address' or '--recipient-registry-type' is required`
    )
  }

  const userRegistryType = args.userRegistryType || ''
  const recipientRegistryType = args.recipientRegistryType || ''

  // If the maci secret key is not set in the env. variable, create a new key
  const coordinatorMacisk =
    process.env.COORDINATOR_MACISK ?? newMaciPrivateKey()

  const clrfund = deployer
    ? await deployClrFundFromDeployer(deployer, ethers)
    : await deployStandaloneClrFund({
        signer,
        circuit,
        directory,
        artifactsPath: hre.config.paths.artifacts,
        ethers,
      })

  const clrfundContract = await ethers.getContractAt(
    EContracts.ClrFund,
    clrfund,
    signer
  )

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
      name: EContracts.AnyOldERC20Token,
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
    if (!args.userRegistryType) {
      throw new Error('Missing --user-registry-type')
    }
    const userRegistryContract = await deployUserRegistry({
      ethers,
      signer,
      userRegistryType: userRegistryType,
      brightidContext: args.brightidContext,
      brightidVerifier: args.brightidVerifier,
      brightidSponsor: args.brightidSponsor,
    })
    userRegistryAddress = await userRegistryContract.getAddress()
  }
  const setUserRegistryTx =
    await clrfundContract.setUserRegistry(userRegistryAddress)
  await setUserRegistryTx.wait()
  console.log(`Set ${userRegistryType} user registry: ${userRegistryAddress}`)

  // set recipient registry
  let recipientRegistryAddress = args.recipientRegistryAddress
  if (!recipientRegistryAddress) {
    const deposit = parseDeposit(args.deposit || '0')
    const recipientRegistryContract = await deployRecipientRegistry({
      ethers,
      signer,
      type: recipientRegistryType,
      challengePeriod: BigInt(args.challengePeriod || 0),
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
