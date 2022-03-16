import { Address, TypedMap, log } from '@graphprotocol/graph-ts'
import { OptimisticRecipientRegistry as OptimisticRecipientRegistryContract } from '../../generated/FundingRoundFactory/OptimisticRecipientRegistry'
import { KlerosRecipientRegistry as KlerosRecipientRegistryContract } from '../../generated/FundingRoundFactory/KlerosRecipientRegistry'
import { UniversalRecipientRegistry as UniversalRecipientRegistryContract } from '../../generated/FundingRoundFactory/UniversalRecipientRegistry'

export enum RecipientRegistryType {
  Unknown,
  Simple,
  Kleros,
  Optimistic,
  Universal,
}

let registryTypeMap = new TypedMap<string, RecipientRegistryType>()
registryTypeMap.set('simple', RecipientRegistryType.Simple)
registryTypeMap.set('klerso', RecipientRegistryType.Kleros)
registryTypeMap.set('optimistic', RecipientRegistryType.Optimistic)
registryTypeMap.set('universal', RecipientRegistryType.Universal)

/**
 * Determine the type of the registry given the registry address
 *
 * For newer contracts, use the registryType method.
 *
 * For legacy contracts, check the availability of a method to
 * determine the type
 *
 * @param registryAddress the recipient registry address
 * @returns RecipientRegistryType of Simple, Kleros, Optimistic
 */
export function getRecipientRegistryType(
  registryAddress: Address
): RecipientRegistryType {
  let universalRegistry =
    UniversalRecipientRegistryContract.bind(registryAddress)
  let registryType = universalRegistry.try_registryType()
  if (!registryType.reverted) {
    let entry = registryTypeMap.getEntry(registryType.value)
    if (entry) {
      return entry.value
    } else {
      log.error('Error: unknown registry type {}', [registryType.value])
      return RecipientRegistryType.Unknown
    }
  }

  let klerosRegistry = KlerosRecipientRegistryContract.bind(registryAddress)
  let tcr = klerosRegistry.try_tcr()
  if (!tcr.reverted) {
    return RecipientRegistryType.Kleros
  }

  let optimisticRegistry =
    OptimisticRecipientRegistryContract.bind(registryAddress)
  let challengePeriodDuration = optimisticRegistry.try_challengePeriodDuration()
  if (!challengePeriodDuration.reverted) {
    return RecipientRegistryType.Optimistic
  }

  return RecipientRegistryType.Simple
}
