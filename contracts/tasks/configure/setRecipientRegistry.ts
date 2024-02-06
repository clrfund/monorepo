/**
 * Set the recipient registry in the ClrFund contract.
 *
 * Sample usage:
 *
 *  yarn hardhat set-recipient-registry --clrfund <clrfund address> --type optimistic --network <network>
 *
 *  Valid recipient registry types are simple, brightid, merkle, storage
 *
 */

import { task } from 'hardhat/config'
import { parseUnits } from 'ethers'
import {
  deployRecipientRegistry,
  challengePeriodSeconds,
} from '../../utils/deployment'
import { EContracts } from '../../utils/types'

task('set-recipient-registry', 'Set the recipient registry in ClrFund')
  .addParam('clrfund', 'The ClrFund contract address')
  .addOptionalParam(
    'type',
    'The recipient registry type, e.g simple, optimistic'
  )
  .addOptionalParam('registry', 'The recipient registry to set to')
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
      const clrfundContract = await ethers.getContractAt(
        EContracts.ClrFund,
        clrfund
      )

      const recipientRegistryType = type || ''
      let recipientRegistryAddress = registry
      if (!recipientRegistryAddress) {
        const [signer] = await ethers.getSigners()
        console.log(`Deploying recipient registry by: ${signer.address}`)

        const token = await clrfundContract.nativeToken()
        const tokenContract = await ethers.getContractAt(
          EContracts.ERC20,
          token
        )
        const decimals = await tokenContract.decimals()
        const depositInUnits = parseUnits(deposit, decimals)

        const controller = await clrfundContract.getAddress()
        const registry = await deployRecipientRegistry({
          type: recipientRegistryType,
          controller,
          deposit: depositInUnits,
          challengePeriod: BigInt(challengePeriod),
          ethers,
        })
        recipientRegistryAddress = await registry.getAddress()
      }

      const tx = await clrfundContract.setRecipientRegistry(
        recipientRegistryAddress
      )
      await tx.wait()

      console.log(
        `Recipient registry (${recipientRegistryType}): ${recipientRegistryAddress}`
      )
      console.log(`Recipient registry set at tx: ${tx.hash}`)
    }
  )
