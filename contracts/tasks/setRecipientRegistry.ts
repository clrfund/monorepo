/**
 * Set the recipient registry in the ClrFund contract.
 *
 * Sample usage:
 *
 *  yarn hardhat set-recipient-registry --network <network> \
 *    --clrfund <clrfund contract address> \
 *    [--type <user registry type>] \
 *    [--registry <user registry address> ] \
 *    [--context <brightid context> ] \
 *    [--verifier <brightid verifier address> ] \
 *    [--sponsor <brightid sponsor contract address> ]
 *
 * Valid user registry types are simple, brightid, merkle, storage
 *
 * Verifier is the brightid node verifier address.
 * Clrfund's brightId node is in the ethSigningAddress field from https://brightid.clr.fund
 *
 */

import { task } from 'hardhat/config'
import { BigNumber, Contract, utils } from 'ethers'
import { HardhatEthersHelpers } from '@nomiclabs/hardhat-ethers/types'
import {
  deployRecipientRegistry,
  challengePeriodSeconds,
} from '../utils/deployment'

async function getDepositInUnits(
  clrfundContract: Contract,
  ethers: HardhatEthersHelpers,
  deposit: string
): Promise<BigNumber> {
  let depositInUnits = BigNumber.from(0)
  try {
    const token = await clrfundContract.nativeToken()
    const tokenContract = await ethers.getContractAt('ERC20', token)
    const decimals = await tokenContract.decimals()
    depositInUnits = utils.parseUnits(deposit, decimals)
  } catch (e) {
    console.log('Error formatting deposit amount ' + (e as Error).message)
    console.log('Set deposit to 0')
  }

  return depositInUnits
}

/**
 * Set the token address in the ClrFund contract
 *
 * @param clrfundContract ClrFund contract
 * @param registryType The user registry type, e.g brightid, simple, merkle, snapshot
 * @param registryAddress The user registry address to set in ClrFund
 * @param ethers the hardhat ethers handle
 */
async function setRecipientRegistry({
  clrfundContract,
  registryType,
  registryAddress,
  deposit,
  challengePeriod,
  ethers,
}: {
  clrfundContract: Contract
  registryType?: string
  registryAddress?: string
  deposit: string
  challengePeriod: string
  ethers: HardhatEthersHelpers
}) {
  let recipientRegistryAddress = registryAddress
  if (!recipientRegistryAddress) {
    const recipientRegistryType = registryType || ''
    const [signer] = await ethers.getSigners()
    console.log(`Deploying recipient registry by: ${signer.address}`)

    const controller = clrfundContract.address
    const depositInUnits = await getDepositInUnits(
      clrfundContract,
      ethers,
      deposit
    )
    const registry = await deployRecipientRegistry({
      type: recipientRegistryType,
      controller,
      deposit: depositInUnits,
      challengePeriod,
      ethers,
    })
    recipientRegistryAddress = registry.address
  }

  const tx = await clrfundContract.setRecipientRegistry(
    recipientRegistryAddress
  )
  await tx.wait()

  console.log(
    `Recipient registry (${registryType}): ${recipientRegistryAddress}`
  )
  console.log(`Recipient registry set at tx: ${tx.hash}`)
}

task('set-recipient-registry', 'Set the recipient registry in ClrFund')
  .addParam('clrfund', 'The ClrFund contract address')
  .addOptionalParam(
    'type',
    'The recipient registry type, e.g simple, optimistic'
  )
  .addOptionalParam('registry', 'The user registry contract address')
  .addOptionalParam(
    'deposit',
    'The base deposit for the optimistic registry',
    '0.001'
  )
  .addOptionalParam(
    'challengePeriod',
    'The challenge period in seconds',
    challengePeriodSeconds
  )
  .setAction(
    async (
      { clrfund, type, registry, deposit, challengePeriod },
      { ethers }
    ) => {
      const clrfundContract = await ethers.getContractAt('ClrFund', clrfund)

      await setRecipientRegistry({
        clrfundContract: clrfundContract,
        registryType: type,
        registryAddress: registry,
        deposit,
        challengePeriod,
        ethers,
      })
    }
  )
