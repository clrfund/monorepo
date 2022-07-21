import { BigNumber, Contract, Signer } from 'ethers'
import {
  TransactionResponse,
  TransactionReceipt,
} from '@ethersproject/abstract-provider'
import { getEventArg } from '@/utils/contracts'

import { OptimisticRecipientRegistry } from './abi'
import { RecipientApplicationData } from './recipient'
import { RecipientRegistryInterface } from './types'
import { Metadata } from './metadata'
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

export function formToRecipientData(
  data: RecipientApplicationData
): RecipientData {
  const { project, fund, team, links, image } = data
  return {
    address: fund.resolvedAddress,
    name: project.name,
    tagline: project.tagline,
    description: project.description,
    category: project.category,
    problemSpace: project.problemSpace,
    plans: fund.plans,
    teamName: team.name,
    teamDescription: team.description,
    githubUrl: links.github,
    radicleUrl: links.radicle,
    websiteUrl: links.website,
    twitterUrl: links.twitter,
    discordUrl: links.discord,
    bannerImageHash: image.bannerHash,
    thumbnailImageHash: image.thumbnailHash,
  }
}

export async function addRecipient(
  registryAddress: string,
  recipientMetadata: Metadata,
  deposit: BigNumber,
  signer: Signer
): Promise<TransactionResponse> {
  const registry = new Contract(
    registryAddress,
    OptimisticRecipientRegistry,
    signer
  )
  const { id, address } = recipientMetadata.toProject()
  if (!id) {
    throw new Error('Missing metadata id')
  }

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
    isRegistrationOpen: true,
    requireRegistrationDeposit: true,
  }
}

export default { create }
