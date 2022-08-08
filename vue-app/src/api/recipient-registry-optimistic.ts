import { BigNumber, Contract, Signer } from 'ethers'
import {
  TransactionResponse,
  TransactionReceipt,
} from '@ethersproject/abstract-provider'
import { getEventArg } from '@/utils/contracts'

import { OptimisticRecipientRegistry } from './abi'
import { RecipientRegistryInterface } from './types'
import { MetadataFormData } from './metadata'
import { chain } from './core'

// TODO merge this with `Project` inteface
export interface RecipientData {
  name: string
  description: string
  imageHash?: string // TODO remove - old flow
  address: string
  tagline?: string
  category?: string
  problemSpace?: string
  plans?: string
  teamName?: string
  teamDescription?: string
  githubUrl?: string
  radicleUrl?: string
  websiteUrl?: string
  twitterUrl?: string
  discordUrl?: string
  // fields different vs. Project
  bannerImageHash?: string
  thumbnailImageHash?: string
}

export async function addRecipient(
  registryAddress: string,
  recipientMetadata: MetadataFormData,
  deposit: BigNumber,
  signer: Signer
): Promise<TransactionResponse> {
  const registry = new Contract(
    registryAddress,
    OptimisticRecipientRegistry,
    signer
  )
  const { id, fund } = recipientMetadata
  if (!id) {
    throw new Error('Missing metadata id')
  }

  const { currentChainReceivingAddress: address } = fund
  if (!address) {
    throw new Error(`Missing recipient address for the ${chain.name} network`)
  }

  const json = { id }
  const transaction = await registry.addRecipient(
    address,
    JSON.stringify(json),
    {
      value: deposit,
    }
  )
  return transaction
}

export function getRequestId(
  receipt: TransactionReceipt,
  registryAddress: string
): string {
  const registry = new Contract(registryAddress, OptimisticRecipientRegistry)
  return getEventArg(receipt, registry, 'RequestSubmitted', '_recipientId')
}

export async function registerProject(
  registryAddress: string,
  recipientId: string,
  signer: Signer
): Promise<TransactionResponse> {
  const registry = new Contract(
    registryAddress,
    OptimisticRecipientRegistry,
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
    OptimisticRecipientRegistry,
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
    OptimisticRecipientRegistry,
    signer
  )

  await registry.removeRecipient(recipientId)
  const transaction = await registry.executeRequest(recipientId)

  return transaction
}

export function create(): RecipientRegistryInterface {
  return {
    addRecipient,
    registerProject,
    removeProject,
    rejectProject,
    isSelfRegistration: true,
    requireRegistrationDeposit: true,
  }
}

export default { create }
