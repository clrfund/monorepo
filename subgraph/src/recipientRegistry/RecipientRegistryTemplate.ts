import {
  RecipientRegistryType,
  getRecipientRegistryType,
} from './RecipientRegistryType'
import { Address, log } from '@graphprotocol/graph-ts'
import {
  OptimisticRecipientRegistry as OptimisticRecipientRegistryTemplate,
  SimpleRecipientRegistry as SimpleRecipientRegistryTemplate,
  KlerosRecipientRegistry as KlerosRecipientRegistryTemplate,
} from '../../generated/templates'

export class RecipientRegistryTemplate {
  static create(registryAddress: Address): void {
    let type = getRecipientRegistryType(registryAddress)
    switch (type) {
      case RecipientRegistryType.Kleros:
        KlerosRecipientRegistryTemplate.create(registryAddress)
        break
      case RecipientRegistryType.Optimistic:
        OptimisticRecipientRegistryTemplate.create(registryAddress)
        break
      case RecipientRegistryType.Simple:
        SimpleRecipientRegistryTemplate.create(registryAddress)
        break
      default:
        log.error('Unknown recipient registry type, not creating template', [])
    }
  }
}
