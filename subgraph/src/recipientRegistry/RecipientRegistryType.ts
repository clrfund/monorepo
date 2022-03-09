import { Address } from '@graphprotocol/graph-ts'
import { OptimisticRecipientRegistry as OptimisticRecipientRegistryContract} from '../../generated/FundingRoundFactory/OptimisticRecipientRegistry'
import { KlerosRecipientRegistry as KlerosRecipientRegistryContract } from '../../generated/FundingRoundFactory/KlerosRecipientRegistry'

export enum RecipientRegistryType {
  Simple = 0,
  Kleros,
  Optimistic,
}

/**
 * Determine the type of the registry given the registry address
 * Currently, we check for availability of a method to determine the type
 *
 * TODO: future recipient registry contract should have a type property
 * 
 * @param registryAddress the recipient registry address
 * @returns RecipientRegistryType of Simple, Kleros, Optimistic
 */
export function getRecipientRegistryType(registryAddress: Address): RecipientRegistryType {
  let klerosRegistry = KlerosRecipientRegistryContract.bind(registryAddress)
  let tcr = klerosRegistry.try_tcr()
  if( !tcr.reverted ) {
    return RecipientRegistryType.Kleros
  }

  let optimisticRegistry = OptimisticRecipientRegistryContract.bind(registryAddress)
  let challengePeriodDuration = optimisticRegistry.try_challengePeriodDuration()
  if( !challengePeriodDuration.reverted ) {
    return RecipientRegistryType.Optimistic
  }

  return RecipientRegistryType.Simple
}