/**
 * Set the user registry in the ClrFund contract.
 *
 * Sample usage:
 *
 *  yarn hardhat set-user-registry --network <network> \
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
 * Context is the bright app id
 * The context value can be found here: https://apps.brightid.org/#nodes
 */

import { task } from 'hardhat/config'
import { Contract } from 'ethers'
import { HardhatEthersHelpers } from '@nomiclabs/hardhat-ethers/types'
import { BrightIdParams, deployUserRegistry } from '../utils/deployment'
/**
 * Set the token address in the ClrFund contract
 *
 * @param clrfundContract ClrFund contract
 * @param registryType The user registry type, e.g brightid, simple, merkle, snapshot
 * @param registryAddress The user registry address to set in ClrFund
 */
async function setUserRegistry({
  clrfundContract,
  registryType,
  registryAddress,
  brightIdParams,
  ethers,
}: {
  clrfundContract: Contract
  registryType?: string
  registryAddress?: string
  brightIdParams?: BrightIdParams
  ethers: HardhatEthersHelpers
}) {
  let userRegistryAddress = registryAddress
  if (!userRegistryAddress) {
    const userRegistryType = registryType || ''
    const [signer] = await ethers.getSigners()
    console.log(`Deploying a user registry by: ${signer.address}`)

    const registry = await deployUserRegistry(
      userRegistryType,
      ethers,
      brightIdParams
    )
    userRegistryAddress = registry.address
  }

  const tx = await clrfundContract.setUserRegistry(userRegistryAddress)
  await tx.wait()

  console.log(`User registry (${registryType}): ${userRegistryAddress}`)
  console.log(`User registry set at tx ${tx.hash}`)
}

task('set-user-registry', 'Set the user registry in ClrFund')
  .addParam('clrfund', 'The ClrFund contract address')
  .addOptionalParam(
    'type',
    'The user registry type, e.g brightid, simple, merkle, snapshot'
  )
  .addOptionalParam('registry', 'The user registry contract address')
  .addOptionalParam('context', 'The BrightId context')
  .addOptionalParam('verifier', 'The BrightId verifier address')
  .addOptionalParam('sponsor', 'The BrightId sponsor contract address')
  .setAction(
    async (
      { clrfund, type, registry, context, verifier, sponsor },
      { ethers }
    ) => {
      const clrfundContract = await ethers.getContractAt('ClrFund', clrfund)

      let brightIdParams: BrightIdParams | undefined = undefined

      if (type === 'brightid') {
        if (!context) {
          throw Error('BrightId context is required')
        }

        if (!verifier) {
          throw Error('BrightId node verifier address is required')
        }

        if (!sponsor) {
          throw Error('BrightId sponsor contract address is required')
        }

        brightIdParams = {
          context,
          verifierAddress: verifier,
          sponsor,
        }
      }

      await setUserRegistry({
        clrfundContract: clrfundContract,
        registryType: type,
        registryAddress: registry,
        brightIdParams,
        ethers,
      })
    }
  )
