import { BigNumber, Contract, Event, Signer } from 'ethers'
import {
  TransactionResponse,
  TransactionReceipt,
} from '@ethersproject/abstract-provider'
import { isHexString } from '@ethersproject/bytes'
import { DateTime } from 'luxon'
import { getEventArg } from '@/utils/contracts'
import { getNetworkToken } from '@/utils/networks'

import { OptimisticRecipientRegistry } from './abi'
import { provider, ipfsGatewayUrl, recipientRegistryPolicy } from './core'
import { Project } from './projects'

export interface RegistryInfo {
  deposit: BigNumber
  depositToken: string
  challengePeriodDuration: number
  listingPolicyUrl: string
  recipientCount: number
  owner: string
}

export async function getRegistryInfo(
  registryAddress: string
): Promise<RegistryInfo> {
  const registry = new Contract(
    registryAddress,
    OptimisticRecipientRegistry,
    provider
  )
  const deposit = await registry.baseDeposit()
  const challengePeriodDuration = await registry.challengePeriodDuration()
  const network = await provider.getNetwork()
  const recipientCount = await registry.getRecipientCount()
  const owner = await registry.owner()
  return {
    deposit,
    depositToken: getNetworkToken(network),
    challengePeriodDuration: challengePeriodDuration.toNumber(),
    listingPolicyUrl: `${ipfsGatewayUrl}/ipfs/${recipientRegistryPolicy}`,
    recipientCount: recipientCount.toNumber(),
    owner,
  }
}

export enum RequestType {
  Registration = 'Registration',
  Removal = 'Removal',
}

enum RequestTypeCode {
  Registration = 0,
  Removal = 1,
}

export enum RequestStatus {
  Submitted = 'Needs review',
  Rejected = 'Rejected',
  Accepted = 'Needs adding',
  Executed = 'Live',
  Removed = 'Removed',
}

export interface RecipientApplicationData {
  project: {
    name: string
    tagline: string
    description: string
    category: string
    problemSpace: string
  }
  fund: {
    address: string
    plans: string
  }
  team: {
    name: string
    description: string
    email: string
  }
  links: {
    github: string
    radicle: string
    website: string
    twitter: string
    discord: string
  }
  image: {
    bannerHash: string
    thumbnailHash: string
  }
  furthestStep: number
}

export function formToProjectInterface(
  data: RecipientApplicationData
): Project {
  const { project, fund, team, links, image } = data
  return {
    id: fund.address,
    address: fund.address,
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

interface RecipientMetadata {
  name: string
  description: string
  imageUrl: string
}

export interface Request {
  transactionHash: string
  type: RequestType
  status: RequestStatus
  acceptanceDate: DateTime
  recipientId: string
  recipient: string
  metadata: RecipientMetadata
}

export async function getRequests(
  registryAddress: string,
  registryInfo: RegistryInfo
): Promise<Request[]> {
  const registry = new Contract(
    registryAddress,
    OptimisticRecipientRegistry,
    provider
  )
  const requestSubmittedFilter = registry.filters.RequestSubmitted()
  const requestSubmittedEvents = await registry.queryFilter(
    requestSubmittedFilter,
    0
  )
  const requestResolvedFilter = registry.filters.RequestResolved()
  const requestResolvedEvents = await registry.queryFilter(
    requestResolvedFilter,
    0
  )
  const requests: Request[] = []
  for (const event of requestSubmittedEvents) {
    const eventArgs = event.args as any
    let type: RequestType
    let metadata: RecipientMetadata
    if (eventArgs._type === RequestTypeCode.Removal) {
      // Removal request
      type = RequestType.Removal
      // Find corresponding registration request and update metadata
      const registrationRequest = requests.find((item) => {
        return item.recipientId === eventArgs._recipientId
      })
      if (!registrationRequest) {
        throw new Error('registration request not found')
      }
      metadata = registrationRequest.metadata
    } else {
      // Registration request
      type = RequestType.Registration
      const { name, description, imageHash } = JSON.parse(eventArgs._metadata)
      metadata = {
        name,
        description,
        imageUrl: `${ipfsGatewayUrl}/ipfs/${imageHash}`,
      }
    }
    const acceptanceDate = DateTime.fromSeconds(
      eventArgs._timestamp.toNumber() + registryInfo.challengePeriodDuration
    )
    const request: Request = {
      transactionHash: event.transactionHash,
      type,
      status: RequestStatus.Submitted,
      acceptanceDate,
      recipientId: eventArgs._recipientId,
      recipient: eventArgs._recipient,
      metadata,
    }
    if (acceptanceDate < DateTime.now()) {
      request.status = RequestStatus.Accepted
    }
    // Find corresponding RequestResolved event
    const resolved = requestResolvedEvents.find((event) => {
      const args = event.args as any
      if (request.type === RequestType.Registration) {
        return (
          args._recipientId === request.recipientId &&
          args._type === RequestTypeCode.Registration
        )
      } else {
        return (
          args._recipientId === request.recipientId &&
          args._type === RequestTypeCode.Removal
        )
      }
    })
    if (resolved) {
      const isRejected = (resolved.args as any)._rejected
      request.status = isRejected
        ? RequestStatus.Rejected
        : RequestStatus.Executed
    }
    requests.push(request)
  }
  return requests
}

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

function formToRecipientData(data: RecipientApplicationData): RecipientData {
  const { project, fund, team, links, image } = data
  return {
    address: fund.address,
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

function decodeProject(requestSubmittedEvent: Event): Project {
  const args = requestSubmittedEvent.args as any
  if (args._type !== RequestTypeCode.Registration) {
    throw new Error('not a registration request')
  }
  const metadata = JSON.parse(args._metadata)

  // imageUrl is the legacy form property - fall back to this if bannerImageHash or thumbnailImageHash don't exist
  const imageUrl = `${ipfsGatewayUrl}/ipfs/${metadata.imageHash}`

  return {
    id: args._recipientId,
    address: args._recipient,
    name: metadata.name,
    description: metadata.description,
    imageUrl,
    // Only unregistered project can have invalid index 0
    index: 0,
    isHidden: false,
    isLocked: false,
    extra: {
      submissionTime: args._timestamp.toNumber(),
    },
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
    bannerImageUrl: metadata.bannerImageHash
      ? `${ipfsGatewayUrl}/ipfs/${metadata.bannerImageHash}`
      : imageUrl,
    thumbnailImageUrl: metadata.thumbnailImageHash
      ? `${ipfsGatewayUrl}/ipfs/${metadata.thumbnailImageHash}`
      : imageUrl,
  }
}

export async function getProjects(
  registryAddress: string,
  startTime?: number,
  endTime?: number
): Promise<Project[]> {
  const registry = new Contract(
    registryAddress,
    OptimisticRecipientRegistry,
    provider
  )
  const now = DateTime.now().toSeconds()
  const challengePeriodDuration = (
    await registry.challengePeriodDuration()
  ).toNumber()
  const requestSubmittedFilter = registry.filters.RequestSubmitted()
  const requestSubmittedEvents = await registry.queryFilter(
    requestSubmittedFilter,
    0
  )
  const requestResolvedFilter = registry.filters.RequestResolved()
  const requestResolvedEvents = await registry.queryFilter(
    requestResolvedFilter,
    0
  )
  const projects: Project[] = []
  for (const event of requestSubmittedEvents) {
    let project: Project
    try {
      project = decodeProject(event)
    } catch {
      // Invalid metadata or not a registration request
      continue
    }
    if (project.extra.submissionTime + challengePeriodDuration >= now) {
      // Challenge period is not over yet
      continue
    }
    // Find corresponding registration event
    const registration = requestResolvedEvents.find((event) => {
      const args = event.args as any
      return (
        args._recipientId === project.id &&
        args._type === RequestTypeCode.Registration
      )
    })
    // Unregistered recipients are always visible,
    // even if request is submitted after the end of round.
    if (registration) {
      const isRejected = (registration.args as any)._rejected
      if (isRejected) {
        continue
      } else {
        const addedAt = (registration.args as any)._timestamp.toNumber()
        if (endTime && addedAt >= endTime) {
          // Hide recipient if it is added after the end of round
          project.isHidden = true
        }
        project.index = (registration.args as any)._recipientIndex.toNumber()
      }
    }
    // Find corresponding removal event
    const removed = requestResolvedEvents.find((event) => {
      const args = event.args as any
      return (
        args._recipientId === project.id &&
        args._type === RequestTypeCode.Removal &&
        args._rejected === false
      )
    })
    if (removed) {
      const removedAt = (removed.args as any)._timestamp.toNumber()
      if (!startTime || removedAt <= startTime) {
        // Start time not specified
        // or recipient had been removed before start time
        project.isHidden = true
      } else {
        // Disallow contributions to removed recipient, but don't hide it
        project.isLocked = true
      }
    }
    projects.push(project)
  }
  return projects
}

export async function getProject(
  registryAddress: string,
  recipientId: string
): Promise<Project | null> {
  if (!isHexString(recipientId, 32)) {
    return null
  }
  const registry = new Contract(
    registryAddress,
    OptimisticRecipientRegistry,
    provider
  )
  const now = DateTime.now().toSeconds()
  const challengePeriodDuration = (
    await registry.challengePeriodDuration()
  ).toNumber()
  const requestSubmittedFilter = registry.filters.RequestSubmitted(recipientId)
  const requestSubmittedEvents = await registry.queryFilter(
    requestSubmittedFilter,
    0
  )
  // Find registration request
  const requestSubmittedEvent = requestSubmittedEvents.find((event) => {
    return (event.args as any)._type === RequestTypeCode.Registration
  })
  if (!requestSubmittedEvent) {
    // Project does not exist
    return null
  }
  let project: Project
  try {
    project = decodeProject(requestSubmittedEvent)
  } catch {
    // Invalid metadata
    return null
  }
  if (project.extra.submissionTime + challengePeriodDuration >= now) {
    // Challenge period is not over yet
    return null
  }
  // Find corresponding RequestResolved event
  const requestResolvedFilter = registry.filters.RequestResolved(recipientId)
  const requestResolvedEvents = await registry.queryFilter(
    requestResolvedFilter,
    0
  )
  const registration = requestResolvedEvents.find((event) => {
    return (event.args as any)._type === RequestTypeCode.Registration
  })
  if (registration) {
    const isRejected = (registration.args as any)._rejected
    if (isRejected) {
      return null
    } else {
      project.index = (registration.args as any)._recipientIndex.toNumber()
    }
  }
  // Find corresponding removal event
  const removed = requestResolvedEvents.find((event) => {
    const args = event.args as any
    return args._type === RequestTypeCode.Removal && args._rejected === false
  })
  if (removed) {
    // Disallow contributions to removed recipient
    project.isLocked = true
  }
  return project
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

export default { getProjects, getProject, registerProject }
