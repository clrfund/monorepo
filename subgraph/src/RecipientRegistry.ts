import { Address, BigInt } from '@graphprotocol/graph-ts'
import { OptimisticRecipientRegistry as RecipientRegistryContract } from '../generated/OptimisticRecipientRegistry/OptimisticRecipientRegistry'

import { RecipientRegistry, FundingRoundFactory } from '../generated/schema'
import { OptimisticRecipientRegistry as recipientRegistryTemplate } from '../generated/templates'

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
      // Recipient registry's controller must be the factory
      let factoryId = controller.value.toHexString()
      let factory = FundingRoundFactory.load(factoryId)
      if (factory) {
        /* This is our registry, create it */
        recipientRegistry = new RecipientRegistry(recipientRegistryId)
        recipientRegistryTemplate.create(address)
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
        recipientRegistry.fundingRoundFactory = factory.id
        recipientRegistry.save()
      }
    }
  }

  return recipientRegistry
}
