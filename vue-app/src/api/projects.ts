import { BigNumber, Contract, Signer } from 'ethers'
import type { TransactionResponse } from '@ethersproject/abstract-provider'
import { FundingRound, OptimisticRecipientRegistry } from './abi'
import { factory, provider, recipientRegistryType, ipfsGatewayUrl } from './core'

import SimpleRegistry from './recipient-registry-simple'
import OptimisticRegistry from './recipient-registry-optimistic'
import KlerosRegistry from './recipient-registry-kleros'
import sdk from '@/graphql/sdk'
import { getLeaderboardData } from '@/api/leaderboard'
import type { RecipientApplicationData } from '@/api/types'
import { getEventArg } from '@/utils/contracts'

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

//TODO: update anywhere this is called to take factory address as a parameter
//NOTE: why isn't this included in the vuex state schema?
export async function getRecipientRegistryAddress(roundAddress: string | null): Promise<string> {
  if (roundAddress !== null) {
    const fundingRound = new Contract(roundAddress, FundingRound, provider)
    return await fundingRound.recipientRegistry()
  } else {
    //TODO: upgrade factory to take it's address as a parameter
    return await factory.recipientRegistry()
  }
}

export async function getCurrentRecipientRegistryAddress(): Promise<string> {
  const data = await sdk.GetRecipientRegistryInfo({
    factoryAddress: factory.address.toLowerCase(),
  })

  const registryAddress =
    data.fundingRoundFactory?.currentRound?.recipientRegistry?.id ||
    data.fundingRoundFactory?.recipientRegistry?.id ||
    ''

  return registryAddress
}

export async function getProjects(registryAddress: string, startTime?: number, endTime?: number): Promise<Project[]> {
  if (recipientRegistryType === 'simple') {
    return await SimpleRegistry.getProjects(registryAddress, startTime, endTime)
  } else if (recipientRegistryType === 'optimistic') {
    return await OptimisticRegistry.getProjects(registryAddress, startTime, endTime)
  } else if (recipientRegistryType === 'kleros') {
    return await KlerosRegistry.getProjects(registryAddress, startTime, endTime)
  } else {
    throw new Error('invalid recipient registry type')
  }
}

/**
 * Get project information
 *
 * TODO: add subgraph event listener to track recipients from simple and kleros registries
 *
 * @param registryAddress recipient registry address
 * @param recipientId  recipient id
 * @param filter filter result by locked or verified status
 * @returns project information
 */
export async function getProject(registryAddress: string, recipientId: string, filter = true): Promise<Project | null> {
  if (recipientRegistryType === 'simple') {
    return await SimpleRegistry.getProject(registryAddress, recipientId)
  } else if (recipientRegistryType === 'optimistic') {
    return await OptimisticRegistry.getProject(recipientId, filter)
  } else if (recipientRegistryType === 'kleros') {
    return await KlerosRegistry.getProject(registryAddress, recipientId)
  } else {
    throw new Error('invalid recipient registry type')
  }
}

export async function registerProject(
  registryAddress: string,
  recipientId: string,
  signer: Signer,
): Promise<TransactionResponse> {
  if (recipientRegistryType === 'optimistic') {
    return await OptimisticRegistry.registerProject(registryAddress, recipientId, signer)
  } else if (recipientRegistryType === 'kleros') {
    return await KlerosRegistry.registerProject(registryAddress, recipientId, signer)
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
  recipientIndex: number,
): Promise<Partial<Project> | null> {
  const result = await sdk.GetRecipientByIndex({
    registryAddress: registryAddress.toLowerCase(),
    recipientIndex,
  })

  if (!result.recipients.length) {
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
    index: recipient.recipientIndex,
  }
}

/**
 * Return the recipientId for the given transaction hash
 * @param transactionHash recipient submission hash
 * @returns recipientId or null for not found
 */
export async function getRecipientIdByHash(transactionHash: string): Promise<string | null> {
  try {
    const receipt = await provider.getTransactionReceipt(transactionHash)

    // should only have 1 event, just in case, return the first matching event
    for (const log of receipt.logs) {
      const registry = new Contract(log.address, OptimisticRecipientRegistry, provider)
      try {
        const recipientId = getEventArg(receipt, registry, 'RequestSubmitted', '_recipientId')
        return recipientId
      } catch {
        // try next log
      }
    }
  } catch {
    return null
  }
  return null
}

export function toLeaderboardProject(project: any): LeaderboardProject {
  const imageUrl = `${ipfsGatewayUrl}/ipfs/${project.metadata.imageHash || project.metadata.thumbnailImageHash}`
  return {
    id: project.id,
    name: project.name,
    index: project.recipientIndex,
    imageUrl,
    allocatedAmount: BigNumber.from(project.allocatedAmount || '0'),
    votes: BigNumber.from(project.tallyResult || '0'),
    donation: BigNumber.from(project.spentVoiceCredits || '0'),
  }
}

export async function getLeaderboardProject(
  roundAddress: string,
  projectId: string,
  network: string,
): Promise<Project | null> {
  const data = await getLeaderboardData(roundAddress, network)
  if (!data) {
    return null
  }

  const project = data.projects.find(project => project.id === projectId)

  const metadata = project.metadata
  const thumbnailHash = metadata.thumbnailImageHash || metadata.imageHash
  const thumbnailImageUrl = thumbnailHash ? `${ipfsGatewayUrl}/ipfs/${thumbnailHash}` : undefined
  const bannerHash = metadata.bannerImageHash || metadata.imageHash
  const bannerImageUrl = bannerHash ? `${ipfsGatewayUrl}/ipfs/${bannerHash}` : undefined

  return {
    id: project.id,
    address: project.recipientAddress || '',
    name: project.name,
    description: metadata.description,
    tagline: metadata.tagline,
    category: metadata.category,
    problemSpace: metadata.problemSpace,
    plans: metadata.plans,
    teamName: metadata.teamName,
    teamDescription: metadata.teamDescription,
    githubUrl: metadata.githubUrl,
    radicleUrl: metadata.radicleUrl,
    websiteUrl: metadata.websiteUrl,
    twitterUrl: metadata.twitterUrl,
    discordUrl: metadata.discordUrl,
    thumbnailImageUrl,
    bannerImageUrl,
    index: project.recipientIndex,
    isHidden: false, // always show leaderboard project
    isLocked: true, // Visible, but contributions are not allowed
  }
}

export function formToProjectInterface(data: RecipientApplicationData): Project {
  const { project, fund, team, links, image } = data
  return {
    id: fund.resolvedAddress,
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
    bannerImageUrl: `${ipfsGatewayUrl}/ipfs/${image.bannerHash}`,
    thumbnailImageUrl: `${ipfsGatewayUrl}/ipfs/${image.thumbnailHash}`,
    index: 0,
    isHidden: false,
    isLocked: true,
  }
}
