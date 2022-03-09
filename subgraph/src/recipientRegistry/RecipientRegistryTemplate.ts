import { RecipientRegistryType, getRecipientRegistryType } from "./RecipientRegistryType";
import { Address } from '@graphprotocol/graph-ts'
import {
  OptimisticRecipientRegistry as OptimisticRecipientRegistryTemplate,
  SimpleRecipientRegistry as SimpleRecipientRegistryTemplate,
  KlerosRecipientRegistry as KlerosRecipientRegistryTemplate,
} from '../../generated/templates'


export class RecipientRegistryTemplate {
  static create(registryAddress: Address): void {
    let type = getRecipientRegistryType(registryAddress)
    switch( type ) {
      case RecipientRegistryType.Kleros:
        KlerosRecipientRegistryTemplate.create(registryAddress)
        break;
      case RecipientRegistryType.Optimistic:
        OptimisticRecipientRegistryTemplate.create(registryAddress)
        break;
      default:
        SimpleRecipientRegistryTemplate.create(registryAddress)
    }
  }
}