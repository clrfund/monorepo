import { BigNumber, Contract, Signer } from 'ethers'
import {
  TransactionResponse,
  TransactionReceipt,
} from '@ethersproject/abstract-provider'
import { DateTime } from 'luxon'
import { getEventArg } from '@/utils/contracts'

import { OptimisticRecipientRegistry } from './abi'
import { ipfsGatewayUrl } from './core'
import {
  RecipientRegistryRequestTypeCode as RequestTypeCode,
  RecipientRegistryRequestType as RequestType,
  RecipientRegistryRequestStatus as RequestStatus,
  RecipientRegistryInterface,
  RecipientRegistryRequest as Request,
  RegistryInfo,
} from './types'
import sdk from '@/graphql/sdk'
import { RecipientApplicationData } from './recipient'

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
  recipientApplicationData: RecipientApplicationData,
  deposit: BigNumber,
  signer: Signer
): Promise<TransactionResponse> {
  const registry = new Contract(
    registryAddress,
    OptimisticRecipientRegistry,
    signer
  )
  const recipientData = formToRecipientData(recipientApplicationData)
  const { address, ...metadata } = recipientData
  const transaction = await registry.addRecipient(
    address,
    JSON.stringify(metadata),
    { value: deposit }
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
