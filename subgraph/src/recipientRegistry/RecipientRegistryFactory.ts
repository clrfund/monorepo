import { Address } from '@graphprotocol/graph-ts'
import { OptimisticRecipientRegistry as OptimisticRecipientRegistryContract } from '../../generated/FundingRoundFactory/OptimisticRecipientRegistry'
import { SimpleRecipientRegistry as SimpleRecipientRegistryContract } from '../../generated/FundingRoundFactory/SimpleRecipientRegistry'
import { KlerosRecipientRegistry as KlerosRecipientRegistryContract } from '../../generated/FundingRoundFactory/KlerosRecipientRegistry'
import { UniversalRecipientRegistry as UniversalRecipientRegistryContract } from '../../generated/FundingRoundFactory/UniversalRecipientRegistry'

import { RecipientRegistry } from '../../generated/schema'
import {
  RecipientRegistryType,
  getRecipientRegistryType,
} from './RecipientRegistryType'

export class RecipientRegistryCreateParams {
  recipientRegistryAddress: Address
  fundingRoundFactoryId: string
  createdAt: string
}

class RecipientRegistryFactoryOptimistic {
  static create(params: RecipientRegistryCreateParams): RecipientRegistry {
    let recipientRegistryId = params.recipientRegistryAddress.toHexString()
    let recipientRegistry = new RecipientRegistry(recipientRegistryId)

    let optimisticRegistry = OptimisticRecipientRegistryContract.bind(
      params.recipientRegistryAddress
    )
    recipientRegistry.baseDeposit = optimisticRegistry.baseDeposit()
    recipientRegistry.challengePeriodDuration =
      optimisticRegistry.challengePeriodDuration()
    recipientRegistry.owner = optimisticRegistry.owner()

    recipientRegistry.controller = optimisticRegistry.controller()
    recipientRegistry.maxRecipients = optimisticRegistry.maxRecipients()
    recipientRegistry.fundingRoundFactory = params.fundingRoundFactoryId
    recipientRegistry.createdAt = params.createdAt

    return recipientRegistry
  }
}

class RecipientRegistryFactoryUniversal {
  static create(params: RecipientRegistryCreateParams): RecipientRegistry {
    let recipientRegistryId = params.recipientRegistryAddress.toHexString()
    let recipientRegistry = new RecipientRegistry(recipientRegistryId)

    let registry = UniversalRecipientRegistryContract.bind(
      params.recipientRegistryAddress
    )
    recipientRegistry.baseDeposit = registry.baseDeposit()
    recipientRegistry.challengePeriodDuration =
      registry.challengePeriodDuration()
    recipientRegistry.owner = registry.owner()

    recipientRegistry.controller = registry.controller()
    recipientRegistry.maxRecipients = registry.maxRecipients()
    recipientRegistry.fundingRoundFactory = params.fundingRoundFactoryId
    recipientRegistry.createdAt = params.createdAt

    return recipientRegistry
  }
}

class RecipientRegistryFactorySimple {
  static create(params: RecipientRegistryCreateParams): RecipientRegistry {
    let recipientRegistryId = params.recipientRegistryAddress.toHexString()
    let recipientRegistry = new RecipientRegistry(recipientRegistryId)

    let simpleRegistry = SimpleRecipientRegistryContract.bind(
      params.recipientRegistryAddress
    )
    recipientRegistry.owner = simpleRegistry.owner()
    recipientRegistry.controller = simpleRegistry.controller()
    recipientRegistry.maxRecipients = simpleRegistry.maxRecipients()
    recipientRegistry.fundingRoundFactory = params.fundingRoundFactoryId
    recipientRegistry.createdAt = params.createdAt

    return recipientRegistry
  }
}

class RecipientRegistryFactoryKleros {
  static create(params: RecipientRegistryCreateParams): RecipientRegistry {
    let recipientRegistryId = params.recipientRegistryAddress.toHexString()
    let recipientRegistry = new RecipientRegistry(recipientRegistryId)

    let klerosRegistry = KlerosRecipientRegistryContract.bind(
      params.recipientRegistryAddress
    )
    recipientRegistry.controller = klerosRegistry.controller()
    recipientRegistry.maxRecipients = klerosRegistry.maxRecipients()
    recipientRegistry.fundingRoundFactory = params.fundingRoundFactoryId
    recipientRegistry.createdAt = params.createdAt

    return recipientRegistry
  }
}

export class RecipientRegistryFactory {
  static create(
    params: RecipientRegistryCreateParams
  ): RecipientRegistry | null {
    let type = getRecipientRegistryType(params.recipientRegistryAddress)
    switch (type) {
      case RecipientRegistryType.Optimistic:
        return RecipientRegistryFactoryOptimistic.create(params)
      case RecipientRegistryType.Kleros:
        return RecipientRegistryFactoryKleros.create(params)
      case RecipientRegistryType.Universal:
        return RecipientRegistryFactoryUniversal.create(params)
      case RecipientRegistryType.Simple:
        return RecipientRegistryFactorySimple.create(params)
      default:
        return null
    }
  }
}
