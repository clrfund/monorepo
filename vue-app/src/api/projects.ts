import { Signer, BigNumber } from 'ethers'
import { TransactionResponse } from '@ethersproject/abstract-provider'
import { recipientRegistryType, ipfsGatewayUrl } from './core'

import SimpleRegistry from './recipient-registry-simple'
import OptimisticRegistry from './recipient-registry-optimistic'
import KlerosRegistry from './recipient-registry-kleros'
import sdk from '@/graphql/sdk'

export interface LeaderboardProject {
  id: string // Address or another ID depending on registry implementation
  name: string
  index: number
  bannerImageUrl?: string
  thumbnailImageUrl?: string
  imageUrl?: string
  allocatedAmount: BigNumber
  votes: BigNumber
  donation: BigNumber
}

export interface Project {
  id: string // Address or another ID depending on registry implementation
  address: string
  requester?: string
  name: string
  tagline?: string
  description: string
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
  bannerImageUrl?: string
  thumbnailImageUrl?: string
  imageUrl?: string // TODO remove
  index: number
  isHidden: boolean // Hidden from the list (does not participate in round)
  isLocked: boolean // Visible, but contributions are not allowed
  extra?: any // Registry-specific data
}

export async function getProjects(
  registryAddress: string,
  startTime?: number,
  endTime?: number
): Promise<Project[]> {
  if (recipientRegistryType === 'simple') {
    return await SimpleRegistry.getProjects(registryAddress, startTime, endTime)
  } else if (recipientRegistryType === 'optimistic') {
    return await OptimisticRegistry.getProjects(
      registryAddress,
      startTime,
      endTime
    )
  } else if (recipientRegistryType === 'kleros') {
    return await KlerosRegistry.getProjects(registryAddress, startTime, endTime)
  } else {
    throw new Error('invalid recipient registry type')
  }
}

export async function getProject(
  registryAddress: string,
  recipientId: string
): Promise<Project | null> {
  if (recipientRegistryType === 'simple') {
    return await SimpleRegistry.getProject(registryAddress, recipientId)
  } else if (recipientRegistryType === 'optimistic') {
    return await OptimisticRegistry.getProject(recipientId)
  } else if (recipientRegistryType === 'kleros') {
    return await KlerosRegistry.getProject(registryAddress, recipientId)
  } else {
    throw new Error('invalid recipient registry type')
  }
}

export async function registerProject(
  registryAddress: string,
  recipientId: string,
  signer: Signer
): Promise<TransactionResponse> {
  if (recipientRegistryType === 'optimistic') {
    return await OptimisticRegistry.registerProject(
      registryAddress,
      recipientId,
      signer
    )
  } else if (recipientRegistryType === 'kleros') {
    return await KlerosRegistry.registerProject(
      registryAddress,
      recipientId,
      signer
    )
  } else {
    throw new Error('invalid recipient registry type')
  }
}

/**
 * Get project information by recipient index
 * @param registryAddress recipient registry contract address
 * @param recipientIndex recipient index
 * @returns Project | null
 */
export async function getProjectByIndex(
  registryAddress: string,
  recipientIndex: number
): Promise<Partial<Project> | null> {
  const result = await sdk.GetRecipientByIndex({
    registryAddress: registryAddress.toLowerCase(),
    recipientIndex,
  })

  if (!result.recipients?.length) {
    return null
  }

  const [recipient] = result.recipients
  let metadata
  try {
    metadata = JSON.parse(recipient.recipientMetadata || '')
  } catch {
    metadata = {}
  }

  const thumbnailImageUrl = metadata.thumbnailImageHash
    ? `${ipfsGatewayUrl}/ipfs/${metadata.thumbnailImageHash}`
    : `${ipfsGatewayUrl}/ipfs/${metadata.imageUrl}`

  return {
    id: recipient.id,
    address: recipient.recipientAddress || '',
    name: metadata.name,
    description: metadata.description,
    tagline: metadata.tagline,
    thumbnailImageUrl,
  }
}
