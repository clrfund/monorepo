import { Address, BigInt } from '@graphprotocol/graph-ts'
import { OptimisticRecipientRegistry as RecipientRegistryContract } from '../generated/OptimisticRecipientRegistry/OptimisticRecipientRegistry'

import { RecipientRegistry, ClrFund } from '../generated/schema'
import { OptimisticRecipientRegistry as RecipientRegistryTemplate } from '../generated/templates'

/*
 * Create the recipient registry entity
 */
export function createRecipientRegistry(
  clrFundId: string,
  recipientRegistryAddress: Address
): RecipientRegistry {
  let recipientRegistryId = recipientRegistryAddress.toHexString()
  let recipientRegistry = new RecipientRegistry(recipientRegistryId)
  RecipientRegistryTemplate.create(recipientRegistryAddress)

  let recipientRegistryContract = RecipientRegistryContract.bind(
    recipientRegistryAddress
  )
  let baseDeposit = recipientRegistryContract.try_baseDeposit()
  if (baseDeposit.reverted) {
    recipientRegistry.baseDeposit = BigInt.fromI32(0)
    recipientRegistry.challengePeriodDuration = BigInt.fromI32(0)
  } else {
    recipientRegistry.baseDeposit = baseDeposit.value
    let challengePeriodDuration =
      recipientRegistryContract.challengePeriodDuration()
    recipientRegistry.challengePeriodDuration = challengePeriodDuration
  }
  let controller = recipientRegistryContract.try_controller()
  let maxRecipients = recipientRegistryContract.try_maxRecipients()
  let owner = recipientRegistryContract.try_owner()

  if (!controller.reverted) {
    recipientRegistry.controller = controller.value
  }
  if (!maxRecipients.reverted) {
    recipientRegistry.maxRecipients = maxRecipients.value
  }
  if (!owner.reverted) {
    recipientRegistry.owner = owner.value
  }
  recipientRegistry.clrFund = clrFundId
  recipientRegistry.save()

  return recipientRegistry
}

/*
 * Load the recipient registry entity from the subgraph with the given address
 */
export function loadRecipientRegistry(
  address: Address
): RecipientRegistry | null {
  let recipientRegistryId = address.toHexString()
  let recipientRegistry = RecipientRegistry.load(recipientRegistryId)
  if (!recipientRegistry) {
    let recipientRegistryContract = RecipientRegistryContract.bind(address)
    let controller = recipientRegistryContract.try_controller()
    if (!controller.reverted) {
      // Recipient registry's controller must be the ClrFund contract
      let clrFundId = controller.value.toHexString()
      let clrFund = ClrFund.load(clrFundId)
      if (clrFund) {
        /* This is our registry, create it */
        recipientRegistry = createRecipientRegistry(clrFund.id, address)

        // update factory
        clrFund.recipientRegistry = recipientRegistryId
        clrFund.recipientRegistryAddress = address
        clrFund.save()
      }
    }
  }

  return recipientRegistry
}
