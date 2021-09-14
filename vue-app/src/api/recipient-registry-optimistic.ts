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
import sdk from '@/graphql/sdk'
import { Recipient } from '@/graphql/API'

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
    addressName: string
    resolvedAddress: string
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
  hasEns: boolean
}

export function formToProjectInterface(
  data: RecipientApplicationData
): Project {
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
  const data = await sdk.GetRecipients({
    registryAddress: registryAddress.toLowerCase(),
  })

  if (!data.recipientRegistry?.recipients?.length) {
    return []
  }

  const recipients = data.recipientRegistry?.recipients

  const requests: Record<string, Request> = {}
  for (const recipient of recipients) {
    let metadata = JSON.parse(recipient.recipientMetadata || '{}')

    const requestType = Number(recipient.requestType)
    if (requestType === RequestTypeCode.Registration) {
      // Registration request
      const { name, description, imageHash } = metadata
      metadata = {
        name,
        description,
        imageUrl: `${ipfsGatewayUrl}/ipfs/${imageHash}`,
      }
    }

    const submissionTime = Number(recipient.submissionTime)
    const acceptanceDate = DateTime.fromSeconds(
      submissionTime + registryInfo.challengePeriodDuration
    )
    const request: Request = {
      transactionHash:
        recipient.requestResolvedHash || recipient.requestSubmittedHash,
      type: RequestType[requestType],
      status: RequestStatus.Submitted,
      acceptanceDate,
      recipientId: recipient.id,
      recipient: recipient.recipientAddress,
      metadata,
      requester: recipient.requester!,
    }

    if (recipient.rejected) {
      request.status = RequestStatus.Rejected
    }

    if (recipient.verified) {
      request.status =
        requestType === RequestTypeCode.Removal
          ? RequestStatus.Removed
          : RequestStatus.Executed
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

function decodeProject(recipient: Partial<Recipient>): Project {
  const metadata = JSON.parse(recipient.recipientMetadata!)

  // imageUrl is the legacy form property - fall back to this if bannerImageHash or thumbnailImageHash don't exist
  const imageUrl = `${ipfsGatewayUrl}/ipfs/${metadata.imageHash}`

  let requester
  if (recipient.requester) {
    requester = recipient.requester
  }

  return {
    id: recipient.id!,
    address: recipient.recipientAddress || '',
    requester,
    name: metadata.name,
    description: metadata.description,
    imageUrl,
    // Only unregistered project can have invalid index 0
    index: 0,
    isHidden: false,
    isLocked: false,
    extra: {
      submissionTime: Number(recipient.submissionTime),
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
  const data = await sdk.GetRecipients({
    registryAddress: registryAddress.toLowerCase(),
  })

  if (!data.recipientRegistry?.recipients?.length) {
    return []
  }

  const recipients = data.recipientRegistry?.recipients

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

      const submissionTime = Number(recipient.submissionTime)
      if (submissionTime + challengePeriodDuration >= now) {
        // Challenge period is not over yet
        return
      }

      if (recipient.rejected) {
        return
      }

      const requestType = Number(recipient.requestType)
      if (requestType === RequestTypeCode.Registration) {
        if (recipient.verified) {
          const addedAt = submissionTime
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

      if (requestType === RequestTypeCode.Removal) {
        const removedAt = submissionTime
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

  const data = await sdk.GetProject({
    registryAddress: registryAddress.toLowerCase(),
    recipientId,
  })

  if (!data.recipientRegistry?.recipients?.length) {
    // Project does not exist
    return null
  }

  const recipient = data.recipientRegistry?.recipients?.[0]

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

  const requestType = Number(recipient.requestType)
  if (requestType === RequestTypeCode.Registration) {
    if (recipient.verified) {
      project.index = recipient.recipientIndex
    } else {
      return null
    }
  }

  if (requestType === RequestTypeCode.Removal && recipient.verified) {
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
