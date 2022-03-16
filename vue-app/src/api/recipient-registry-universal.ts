import { Contract, BigNumber, Signer } from 'ethers'
import { UniversalRecipientRegistry } from './abi'
import { TransactionResponse } from '@ethersproject/abstract-provider'
import { RecipientRegistryInterface } from './core'

export async function addRecipient(
  registryAddress: string,
  recipientData: any,
  deposit: BigNumber,
  signer: Signer
): Promise<TransactionResponse> {
  const registry = new Contract(
    registryAddress,
    UniversalRecipientRegistry,
    signer
  )
  const { address, ...metadata } = recipientData
  const transaction = await registry.addRecipient(
    address,
    JSON.stringify(metadata),
    { value: deposit }
  )
  return transaction
}

export function create(): RecipientRegistryInterface {
  return {
    addRecipient,
    isRegistrationOpen: true,
    requireRegistrationDeposit: true,
  }
}

export default { addRecipient, create }
