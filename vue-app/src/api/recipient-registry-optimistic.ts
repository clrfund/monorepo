import { BigNumber, Contract, Event, Signer } from 'ethers'
import {
  TransactionResponse,
  TransactionReceipt,
} from '@ethersproject/abstract-provider'
import { isHexString } from '@ethersproject/bytes'
import request, { gql } from 'graphql-request'
import { DateTime } from 'luxon'
import { getEventArg } from '@/utils/contracts'
import { getNetworkToken } from '@/utils/networks'

import { OptimisticRecipientRegistry } from './abi'
import {
  provider,
  ipfsGatewayUrl,
  recipientRegistryPolicy,
  SUBGRAPH_ENDPOINT,
} from './core'
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
  requester: string
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
  const requests: Record<string, Request> = {}
  for (const event of requestSubmittedEvents) {
    const eventArgs = event.args as any
    let type: RequestType
    let metadata: RecipientMetadata
    if (eventArgs._type === RequestTypeCode.Removal) {
      // Removal request
      type = RequestType.Removal
      // Find corresponding registration request and update metadata
      const registrationRequest = requests[eventArgs._recipientId]
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
      requester: eventArgs._requester,
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
      const type = (resolved.args as any)._type

      if (isRejected) {
        request.status = RequestStatus.Rejected
      } else {
        request.status =
          type === RequestTypeCode.Removal
            ? RequestStatus.Removed
            : RequestStatus.Executed
      }
    }

    // In case there are two requests submissions events, we always prioritize
    // the last one since you can only have one request per recipient
    requests[request.recipientId] = request
  }
  return Object.keys(requests).map((recipientId) => requests[recipientId])
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

export function formToRecipientData(
  data: RecipientApplicationData
): RecipientData {
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

interface Recipient {
  id: string
  requestType: '0' | '1'
  requester: string
  submissionTime: string
  deposit: number
  recipientMetadata: string
  recipientAddress: string
  rejected: boolean
  verified: boolean
  createdAt: string
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

function decodeProject(recipient: Recipient): Project {
  const metadata = JSON.parse(recipient.recipientMetadata)

  // imageUrl is the legacy form property - fall back to this if bannerImageHash or thumbnailImageHash don't exist
  const imageUrl = `${ipfsGatewayUrl}/ipfs/${metadata.imageHash}`

  return {
    id: recipient.id,
    address: recipient.recipientAddress || '',
    name: metadata.name,
    description: metadata.description,
    imageUrl,
    // Only unregistered project can have invalid index 0
    index: 0,
    isHidden: false,
    isLocked: false,
    extra: {
      submissionTime: +recipient.submissionTime,
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
  const query = gql`
    query {
      recipientRegistry(id: "${registryAddress.toLowerCase()}") {
        recipients {
          id
          requestType
          recipientAddress
          recipientMetadata
          submissionTime
          rejected
          verified
        }
      }
    }
  `

  const data = await request(SUBGRAPH_ENDPOINT, query)
  const recipients: Array<Recipient> = data.recipientRegistry.recipients

  const registry = new Contract(
    registryAddress,
    OptimisticRecipientRegistry,
    provider
  )
  const now = DateTime.now().toSeconds()
  const challengePeriodDuration = (
    await registry.challengePeriodDuration()
  ).toNumber()

  const projects: Project[] = recipients
    .map((recipient) => {
      let project
      try {
        project = decodeProject(recipient)
      } catch (err) {
        return
      }

      if (+recipient.submissionTime + challengePeriodDuration >= now) {
        // Challenge period is not over yet
        return
      }

      if (recipient.rejected) {
        return
      }

      if (+recipient.requestType === RequestTypeCode.Registration) {
        if (recipient.verified) {
          const addedAt = +recipient.submissionTime
          if (endTime && addedAt >= endTime) {
            // Hide recipient if it is added after the end of round
            project.isHidden = true
          }
          // project.index = recipient._recipientIndex.toNumber()
          project.index = recipients.indexOf(recipient)
          return project
        } else {
          return
        }
      }

      if (+recipient.requestType === RequestTypeCode.Removal) {
        const removedAt = +recipient.submissionTime
        if (!startTime || removedAt <= startTime) {
          // Start time not specified
          // or recipient had been removed before start time
          project.isHidden = true
        } else {
          // Disallow contributions to removed recipient, but don't hide it
          project.isLocked = true
        }
      }

      return project
    })
    .filter(Boolean)

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

  const query = gql`
    query {
      recipientRegistry(id: "${registryAddress.toLowerCase()}") {
        recipients(where: { id: "${recipientId}" }) {
          id
          requestType
          recipientAddress
          recipientMetadata
          submissionTime
          rejected
          verified
        }
      }
    }
  `

  const data = await request(SUBGRAPH_ENDPOINT, query)
  const recipient: Recipient = data.recipientRegistry.recipients[0]

  if (!recipient) {
    // Project does not exist
    return null
  }

  let project: Project
  try {
    project = decodeProject(recipient)
  } catch {
    // Invalid metadata
    return null
  }
  if (project.extra.submissionTime + challengePeriodDuration >= now) {
    // Challenge period is not over yet
    return null
  }

  if (+recipient.requestType === RequestTypeCode.Registration) {
    if (recipient.verified) {
      // TODO: subgraph is not storing the recipient index
      project.index = 0
    } else {
      return null
    }
  }

  if (
    +recipient.requestType === RequestTypeCode.Removal &&
    recipient.verified
  ) {
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

export default { getProjects, getProject, registerProject }
