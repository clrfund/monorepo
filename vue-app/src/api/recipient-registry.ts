import type { RegistryInfo, RecipientApplicationData } from './types'
import { recipientRegistryType } from './core'
import SimpleRegistry from './recipient-registry-simple'
import OptimisticRegistry from './recipient-registry-optimistic'
import KlerosRegistry from './recipient-registry-kleros'
import type { BigNumber, Signer } from 'ethers'
import type { TransactionResponse } from '@ethersproject/abstract-provider'

export async function getRegistryInfo(registryAddress: string): Promise<RegistryInfo> {
  if (recipientRegistryType === 'simple') {
    return await SimpleRegistry.getRegistryInfo(registryAddress)
  } else if (recipientRegistryType === 'optimistic') {
    return await OptimisticRegistry.getRegistryInfo(registryAddress)
  } else if (recipientRegistryType === 'kleros') {
    return await KlerosRegistry.getRegistryInfo(registryAddress)
  } else {
    throw new Error('Invalid recipient registry type: ' + recipientRegistryType)
  }
}

export async function addRecipient(
  registryAddress: string,
  recipientApplicationData: RecipientApplicationData,
  deposit: BigNumber,
  signer: Signer,
): Promise<TransactionResponse> {
  if (recipientRegistryType === 'simple') {
    return await SimpleRegistry.addRecipient(registryAddress, recipientApplicationData, signer)
  } else if (recipientRegistryType === 'optimistic') {
    return await OptimisticRegistry.addRecipient(registryAddress, recipientApplicationData, deposit, signer)
  } else if (recipientRegistryType === 'kleros') {
    throw new Error('Kleros recipient registry is not supported')
  } else {
    throw new Error('Invalid recipient registry type: ' + recipientRegistryType)
  }
}
