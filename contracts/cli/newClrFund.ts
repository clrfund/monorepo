/**
 * Create a new instance of the ClrFund contract.
 *
 * If the coordinator ETH address is not provided, use the signer address
 * If the COORDINATOR_MACISK env. varibale not set, create a new random MACI key
 *
 * Sample usage:
 *
 *  HARDHAT_NETWORK=localhost yarn ts-node cli/newClrFund.ts \
 *    --deployer <clrfund deployer contract address> \
 *    --token <native token address> \
 *    [--coordinator <coordinator ETH address> ] \
 *    [--user-registry-type <user registry type> ] \
 *    [--recipient-registry-type <recipient registry type> ]
 *
 *
 * If user registry address and recipient registry address are not provided,
 * the registry types become mandatory as well as the other parameters needed
 * to deploy the registries
 *
 * If token is not provided, a new ERC20 token will be created
 */
import { ethers, network } from 'hardhat'
import { getEventArg } from '../utils/contracts'
import { newMaciPrivateKey } from '../utils/maci'
import {
  challengePeriodSeconds,
  deployContract,
  deployUserRegistry,
  deployRecipientRegistry,
  setCoordinator,
} from '../utils/deployment'
import { JSONFile } from '../utils/JSONFile'
import { program } from 'commander'
import dotenv from 'dotenv'
import { UNIT } from '../utils/constants'
dotenv.config()

program
  .description('Deploy a new ClrFund instance')
  .requiredOption(
    '-d --deployer <deployer>',
    'The ClrFund deployer contract address'
  )
  .option('-c --coordinator <coordinator>', 'The coordinator ETH address')
  .option('-t --token <address>', 'The native token address')
  .option('-a --initial-token-supply <amount>', 'Initial token amount', '1000')
  .option('-u --user-registry-type <type>', 'The user registry type')
  .option('-x --brightid-context <context>', 'The brightid context')
  .option('-v --brightid-verifier <verifier>', 'The brightid verifier address')
  .option(
    '-o --brightid-sponsor <sponsor>',
    'The brightid sponsor contract address'
  )
  .option('-r --recipient-registry-type <type>', 'The recipient registry type')
  .option('-b --deposit <deposit>', 'The optimistic recipient registry deposit')
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

async function main(args: any) {
  const { deployer, coordinator, stateFile } = args
  const [signer] = await ethers.getSigners()

  console.log('Network: ', network.name)
  console.log(`Deploying from address: ${signer.address}`)
  console.log('args', args)

  // If the maci secret key is not set in the env. variable, create a new key
  const coordinatorMacisk =
    process.env.COORDINATOR_MACISK ?? newMaciPrivateKey()

  const clrfundDeployer = await ethers.getContractAt(
    'ClrFundDeployer',
    deployer
  )
  console.log('ClrFundDeployer:', clrfundDeployer.address)

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
    const initialTokenSupply = UNIT.mul(args.initialTokenSupply)
    const tokenContract = await deployContract({
      name: 'AnyOldERC20Token',
      contractArgs: [initialTokenSupply],
      ethers,
      signer,
    })
    tokenAddress = tokenContract.address
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
    userRegistryAddress = userRegistryContract.address
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
    const recipientRegistryContract = await deployRecipientRegistry({
      ethers,
      signer,
      type: args.recipientRegistryType,
      challengePeriod: args.challengePeriod,
      deposit: args.deposit,
      controller: clrfund,
    })
    recipientRegistryAddress = recipientRegistryContract.address
  }
  const setRecipientRegistryTx = await clrfundContract.setRecipientRegistry(
    recipientRegistryAddress
  )
  await setRecipientRegistryTx.wait()
  console.log(
    `Set ${args.recipientRegistryType} recipient registry: ${recipientRegistryAddress}`
  )

  if (stateFile) {
    JSONFile.update(stateFile, { clrfund })
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