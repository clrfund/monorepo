import { Contract, Interface, getNumber } from 'ethers'
import type { TransactionResponse, Signer } from 'ethers'
import { FundingRound, OptimisticRecipientRegistry } from './abi'
import { clrFundContract, provider, recipientRegistryType, ipfsGatewayUrl } from './core'

import SimpleRegistry from './recipient-registry-simple'
import OptimisticRegistry from './recipient-registry-optimistic'
import KlerosRegistry from './recipient-registry-kleros'
import sdk from '@/graphql/sdk'
import { findStaticRound } from '@/api/round'
import type { RecipientApplicationData } from '@/api/types'
import type { GetRecipientByIndexQuery } from '@/graphql/API'

export interface LeaderboardProject {
  id: string // Address or another ID depending on registry implementation
  name: string
  index: number
  bannerImageHash?: string
  thumbnailImageHash?: string
  allocatedAmount: bigint
  votes: bigint
  donation: bigint
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
  bannerImageHash?: string
  thumbnailImageHash?: string
  index: number
  isHidden: boolean // Hidden from the list (does not participate in round)
  isLocked: boolean // Visible, but contributions are not allowed
  extra?: any // Registry-specific data
}

//TODO: update anywhere this is called to take ClrFund address as a parameter
//NOTE: why isn't this included in the vuex state schema?
export async function getRecipientRegistryAddress(roundAddress: string | null): Promise<string> {
  if (roundAddress !== null) {
    const fundingRound = new Contract(roundAddress, FundingRound, provider)
    return await fundingRound.recipientRegistry().catch(() => null)
  } else {
    return await clrFundContract.recipientRegistry().catch(() => null)
  }
}

/**
 * Get all the projects added between the start and end time
 * @returns List of projects
 */
export async function getProjects({
  registryAddress,
  fundingRoundAddress,
  network,
  startTime,
  endTime,
}: {
  registryAddress: string
  fundingRoundAddress?: string
  network?: string
  startTime?: number
  endTime?: number
}): Promise<Project[]> {
  if (recipientRegistryType === 'simple') {
    return await SimpleRegistry.getProjects(registryAddress, startTime, endTime)
  } else if (recipientRegistryType === 'optimistic') {
    return await OptimisticRegistry.getProjects({ registryAddress, fundingRoundAddress, network, startTime, endTime })
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
export async function getProject({
  registryAddress,
  fundingRoundAddress,
  recipientId,
  filter = true,
}: {
  registryAddress: string
  fundingRoundAddress?: string
  recipientId: string
  filter: boolean
}): Promise<Project | null> {
  if (recipientRegistryType === 'simple') {
    return await SimpleRegistry.getProject(registryAddress, recipientId)
  } else if (recipientRegistryType === 'optimistic') {
    return await OptimisticRegistry.getProject({ fundingRoundAddress, recipientId, filter })
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
  let result: GetRecipientByIndexQuery
  try {
    result = await sdk.GetRecipientByIndex({
      registryAddress: registryAddress.toLowerCase(),
      recipientIndex,
    })
  } catch {
    return null
  }

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

  return {
    id: recipient.id,
    address: recipient.recipientAddress || '',
    name: metadata.name,
    description: metadata.description,
    tagline: metadata.tagline,
    thumbnailImageHash: metadata.thumbnailImageHash || metadata.imageHash,
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
    if (!receipt) {
      return null
    }

    const eventName = 'RequestSubmitted'
    const argumentName = '_recipientId'
    const registryInterface = new Interface(OptimisticRecipientRegistry)
    // should only have 1 event, just in case, return the first matching event
    for (const log of receipt.logs) {
      const event = registryInterface.parseLog({
        data: log.data,
        topics: [...log.topics],
      })
      // eslint-disable-next-line
      if (event && event.name === eventName) {
        return event.args[argumentName]
      }
    }
  } catch {
    return null
  }
  return null
}

export function toLeaderboardProject(project: any): LeaderboardProject {
  return {
    id: project.id,
    name: project.name,
    index: getNumber(project.recipientIndex || 0),
    thumbnailImageHash: project.metadata.thumbnailImageHash || project.metadata.imageHash,
    bannerImageHash: project.metadata.bannerImageHash,
    allocatedAmount: BigInt(project.allocatedAmount || '0'),
    votes: BigInt(project.tallyResult || '0'),
    donation: BigInt(project.spentVoiceCredits || '0'),
  }
}

export async function getLeaderboardProject(
  roundAddress: string,
  projectId: string,
  network: string,
): Promise<Project | null> {
  const data = await findStaticRound(roundAddress, network)
  if (!data) {
    return null
  }

  const project = data.projects.find(project => project.id === projectId)

  const metadata = project.metadata
  const thumbnailImageHash = metadata.thumbnailImageHash || metadata.imageHash
  const bannerImageHash = metadata.bannerImageHash || metadata.imageHash

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
    thumbnailImageHash,
    bannerImageHash,
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
    bannerImageHash: image.bannerHash,
    thumbnailImageHash: image.thumbnailHash,
    index: 0,
    isHidden: false,
    isLocked: true,
  }
}

/**
 * Format the project data from the static round data to project interface
 * @param project project data from the static round file
 * @returns formatted project data
 */
export function staticDataToProjectInterface(project: any): Project {
  return {
    id: project.id,
    address: project.recipientAddress,
    name: project.metadata.name || project.name,
    tagline: project.metadata.tagline,
    description: project.metadata.description,
    category: project.metadata.category,
    problemSpace: project.metadata.problemSpace,
    plans: project.metadata.plans,
    teamName: project.metadata.teamName,
    teamDescription: project.metadata.teamDescription,
    githubUrl: project.metadata.githubUrl,
    radicleUrl: project.metadata.radicleUrl,
    websiteUrl: project.metadata.websiteUrl,
    twitterUrl: project.metadata.twitterUrl,
    discordUrl: project.discordUrl,
    bannerImageHash: project.metadata.bannerImageHash || project.metadata.imageHash,
    thumbnailImageHash: project.metadata.thumbnailImageHash || project.metadata.imageHash,
    index: project.recipientIndex,
    isHidden: project.state !== 'Accepted',
    isLocked: false,
  }
}
