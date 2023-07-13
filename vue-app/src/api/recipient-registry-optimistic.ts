import { BigNumber, Contract, Signer } from 'ethers'
import type { TransactionResponse, TransactionReceipt } from '@ethersproject/abstract-provider'
import { isHexString } from '@ethersproject/bytes'
import { DateTime } from 'luxon'
import { getEventArg } from '@/utils/contracts'
import { chain } from '@/api/core'

import { OptimisticRecipientRegistry } from './abi'
import { provider, ipfsGatewayUrl } from './core'
import type { Project } from './projects'
import sdk from '@/graphql/sdk'
import type { Recipient } from '@/graphql/API'
import { hasDateElapsed } from '@/utils/dates'
import type { RegistryInfo, RecipientApplicationData } from './types'
import { formToRecipientData } from './recipient'

async function getRegistryInfo(registryAddress: string): Promise<RegistryInfo> {
  const registry = new Contract(registryAddress, OptimisticRecipientRegistry, provider)
  const deposit = await registry.baseDeposit()
  const challengePeriodDuration = await registry.challengePeriodDuration()
  let recipientCount
  try {
    recipientCount = await registry.getRecipientCount()
  } catch {
    // older BaseRecipientRegistry contract did not have recipientCount
    // set it to zero as this information is only
    // used during current round for space calculation
    recipientCount = BigNumber.from(0)
  }
  const owner = await registry.owner()
  return {
    deposit,
    depositToken: chain.currency,
    challengePeriodDuration: challengePeriodDuration.toNumber(),
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
  Accepted = 'Accepted',
  Rejected = 'Rejected',
  Executed = 'Live',
  PendingRemoval = 'Pending removal',
  Removed = 'Removed',
}

interface RecipientMetadata {
  name: string
  description: string
  imageUrl: string
  thumbnailImageUrl: string
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

export async function getRequests(registryInfo: RegistryInfo, registryAddress: string): Promise<Request[]> {
  const data = await sdk.GetRecipients({
    registryAddress: registryAddress.toLowerCase(),
  })

  if (!data.recipients.length) {
    return []
  }

  const recipients = data.recipients

  const requests: Record<string, Request> = {}
  for (const recipient of recipients) {
    let metadata: any
    try {
      metadata = JSON.parse(recipient.recipientMetadata || '{}')
    } catch {
      metadata = {}
    }
    const requestType = Number(recipient.requestType)
    if (requestType === RequestTypeCode.Registration) {
      // Registration request
      const { name, description, imageHash, thumbnailImageHash } = metadata
      metadata = {
        name,
        description,
        imageUrl: `${ipfsGatewayUrl}/ipfs/${imageHash}`,
        thumbnailImageUrl: thumbnailImageHash
          ? `${ipfsGatewayUrl}/ipfs/${thumbnailImageHash}`
          : `${ipfsGatewayUrl}/ipfs/${imageHash}`,
      }
    }

    const submissionTime = Number(recipient.submissionTime)
    const acceptanceDate = DateTime.fromSeconds(submissionTime + registryInfo.challengePeriodDuration)

    let requester
    if (recipient.requester) {
      requester = recipient.requester
    }

    const request: Request = {
      transactionHash: recipient.requestResolvedHash || recipient.requestSubmittedHash,
      type: RequestType[RequestTypeCode[requestType]],
      status: hasDateElapsed(acceptanceDate) ? RequestStatus.Accepted : RequestStatus.Submitted,
      acceptanceDate,
      recipientId: recipient.id,
      recipient: recipient.recipientAddress,
      metadata,
      requester,
    }

    if (recipient.rejected) {
      request.status = RequestStatus.Rejected
    }

    if (recipient.verified) {
      request.status = requestType === RequestTypeCode.Removal ? RequestStatus.Removed : RequestStatus.Executed
    } else {
      if (requestType === RequestTypeCode.Removal) {
        request.status = RequestStatus.PendingRemoval
      }
    }

    // In case there are two requests submissions events, we always prioritize
    // the last one since you can only have one request per recipient
    requests[request.recipientId] = request
  }
  return Object.keys(requests).map(recipientId => requests[recipientId])
}

async function addRecipient(
  registryAddress: string,
  recipientApplicationData: RecipientApplicationData,
  deposit: BigNumber,
  signer: Signer,
): Promise<TransactionResponse> {
  const registry = new Contract(registryAddress, OptimisticRecipientRegistry, signer)
  const recipientData = formToRecipientData(recipientApplicationData)
  const { address, ...metadata } = recipientData
  const transaction = await registry.addRecipient(address, JSON.stringify(metadata), { value: deposit })
  return transaction
}

export function getRequestId(receipt: TransactionReceipt, registryAddress: string): string {
  const registry = new Contract(registryAddress, OptimisticRecipientRegistry)
  return getEventArg(receipt, registry, 'RequestSubmitted', '_recipientId')
}

function decodeProject(recipient: Partial<Recipient>): Project {
  if (!recipient.id) {
    throw new Error('Incorrect recipient data')
  }

  const metadata = JSON.parse(recipient.recipientMetadata || '')

  // imageUrl is the legacy form property - fall back to this if bannerImageHash or thumbnailImageHash don't exist
  const imageUrl = `${ipfsGatewayUrl}/ipfs/${metadata.imageHash}`

  let requester
  if (recipient.requester) {
    requester = recipient.requester
  }

  return {
    id: recipient.id,
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
    bannerImageUrl: metadata.bannerImageHash ? `${ipfsGatewayUrl}/ipfs/${metadata.bannerImageHash}` : imageUrl,
    thumbnailImageUrl: metadata.thumbnailImageHash ? `${ipfsGatewayUrl}/ipfs/${metadata.thumbnailImageHash}` : imageUrl,
  }
}

export async function getProjects(registryAddress: string, startTime?: number, endTime?: number): Promise<Project[]> {
  const data = await sdk.GetRecipients({
    registryAddress: registryAddress.toLowerCase(),
  })

  if (!data.recipients.length) {
    return []
  }

  const recipients = data.recipients

  const projects: Project[] = recipients
    .map(recipient => {
      let project
      try {
        project = decodeProject(recipient)
      } catch (err) {
        return
      }

      const submissionTime = Number(recipient.submissionTime)

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
          project.index = recipient.recipientIndex
          return project
        } else {
          return
        }
      }

      if (requestType === RequestTypeCode.Removal) {
        if (recipient.verified) {
          const removedAt = submissionTime
          if (!startTime || removedAt <= startTime) {
            // Start time not specified
            // or recipient had been removed before start time
            project.isHidden = true
          } else {
            // Disallow contributions to removed recipient, but don't hide it
            project.isLocked = true
          }
        } else {
          // project is not removed yet, keep the index so that it can still receive contributions
          project.index = recipient.recipientIndex
        }
      }

      return project
    })
    .filter(Boolean)

  return projects
}

/**
 * Get project information
 *
 * @param recipientId recipient id
 * @param filter default to always filter result by locked or verified status
 * @returns project
 */
export async function getProject(recipientId: string, filter = true): Promise<Project | null> {
  if (!isHexString(recipientId, 32)) {
    return null
  }

  const data = await sdk.GetProject({
    recipientId,
  })

  if (!data.recipients.length) {
    // Project does not exist
    return null
  }

  const recipient = data.recipients[0]

  let project: Project
  try {
    project = decodeProject(recipient)
  } catch {
    // Invalid metadata
    return null
  }

  if (!filter) {
    return project
  }

  const requestType = Number(recipient.requestType)
  if (requestType === RequestTypeCode.Registration) {
    if (recipient.verified) {
      project.index = recipient.recipientIndex
    } else {
      return null
    }
  }

  if (requestType === RequestTypeCode.Removal) {
    if (recipient.verified) {
      // Disallow contributions to removed recipient
      project.isLocked = true
    } else {
      // project is not removed yet, keep the index so that it can still receive contributions
      project.index = recipient.recipientIndex
    }
  }
  return project
}

export async function registerProject(
  registryAddress: string,
  recipientId: string,
  signer: Signer,
): Promise<TransactionResponse> {
  const registry = new Contract(registryAddress, OptimisticRecipientRegistry, signer)
  const transaction = await registry.executeRequest(recipientId)
  return transaction
}

export async function rejectProject(
  registryAddress: string,
  recipientId: string,
  requesterAddress: string,
  signer: Signer,
) {
  const registry = new Contract(registryAddress, OptimisticRecipientRegistry, signer)
  const transaction = await registry.challengeRequest(recipientId, requesterAddress)
  return transaction
}

export async function removeProject(registryAddress: string, recipientId: string, signer: Signer) {
  const registry = new Contract(registryAddress, OptimisticRecipientRegistry, signer)

  await registry.removeRecipient(recipientId)
  const transaction = await registry.executeRequest(recipientId)

  return transaction
}

export default { getProjects, getProject, registerProject, decodeProject, getRegistryInfo, addRecipient }
