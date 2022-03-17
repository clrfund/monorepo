import { Contract, BigNumber, Signer } from 'ethers'
import { UniversalRecipientRegistry } from './abi'
import {
  TransactionResponse,
  TransactionReceipt,
} from '@ethersproject/abstract-provider'
import { RecipientRegistryInterface } from './types'
import { getEventArg } from '@/utils/contracts'

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
  const { address, id } = recipientData
  if (!id) {
    throw new Error('Missing metadata id')
  }

  if (!address) {
    throw new Error('Metadata missing recipient address')
  }

  const transaction = await registry.addRecipient(address, id, {
    value: deposit,
  })
  return transaction
}

export function create(): RecipientRegistryInterface {
  return {
    addRecipient,
    removeProject,
    registerProject,
    rejectProject,
    isRegistrationOpen: true,
    requireRegistrationDeposit: true,
  }
}

export function getRequestId(
  receipt: TransactionReceipt,
  registryAddress: string
): string {
  const registry = new Contract(registryAddress, UniversalRecipientRegistry)
  return getEventArg(receipt, registry, 'RequestSubmitted', '_recipientId')
}

export async function registerProject(
  registryAddress: string,
  recipientId: string,
  signer: Signer
): Promise<TransactionResponse> {
  const registry = new Contract(
    registryAddress,
    UniversalRecipientRegistry,
    signer
  )
  const transaction = await registry.executeRequest(recipientId)
  return transaction
}

export async function rejectProject(
  registryAddress: string,
  recipientId: string,
  requesterAddress: string,
  signer: Signer
) {
  const registry = new Contract(
    registryAddress,
    UniversalRecipientRegistry,
    signer
  )
  const transaction = await registry.challengeRequest(
    recipientId,
    requesterAddress
  )
  return transaction
}

export async function removeProject(
  registryAddress: string,
  recipientId: string,
  signer: Signer
) {
  const registry = new Contract(
    registryAddress,
    UniversalRecipientRegistry,
    signer
  )

  await registry.removeRecipient(recipientId)
  const transaction = await registry.executeRequest(recipientId)

  return transaction
}

export default { create }
