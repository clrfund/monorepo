import { Contract, toNumber, isHexString, ContractTransactionResponse } from 'ethers'
import type { TransactionResponse, Signer } from 'ethers'
import { DateTime } from 'luxon'
import { chain, clrFundContract } from '@/api/core'

import { OptimisticRecipientRegistry } from './abi'
import { provider, ipfsGatewayUrl } from './core'
import { staticDataToProjectInterface, type Project } from './projects'
import sdk from '@/graphql/sdk'
import type { GetProjectQuery, GetRecipientsQuery, Recipient } from '@/graphql/API'
import { hasDateElapsed } from '@/utils/dates'
import type { RegistryInfo, RecipientApplicationData } from './types'
import { formToRecipientData } from './recipient'
import { isSameAddress } from '@/utils/accounts'
import { findStaticRound, getStaticRoundInfo } from './round'

async function getRegistryInfo(registryAddress: string): Promise<RegistryInfo> {
  const registry = new Contract(registryAddress, OptimisticRecipientRegistry, provider)
  let deposit = BigInt(0)
  try {
    deposit = await registry.baseDeposit()
  } catch (err) {
    console.error('Failed to get base deposit from', registryAddress, err)
  }

  let challengePeriodDuration = BigInt(0)
  try {
    challengePeriodDuration = await registry.challengePeriodDuration()
  } catch (err) {
    console.error('Failed to get challenge period from', registryAddress, err)
  }

  let recipientCount
  try {
    recipientCount = await registry.getRecipientCount()
  } catch {
    // older BaseRecipientRegistry contract did not have recipientCount
    // set it to zero as this information is only
    // used during current round for space calculation
    recipientCount = BigInt(0)
  }
  const owner = await registry.owner()
  return {
    deposit,
    depositToken: chain.currency,
    challengePeriodDuration: toNumber(challengePeriodDuration),
    recipientCount: toNumber(recipientCount),
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
  RemovalAccepted = 'Removal accepted',
  Removed = 'Removed',
}

interface RecipientMetadata {
  name: string
  description: string
  imageHash: string
  thumbnailImageHash: string
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

interface RecipientRequestData {
  requestType: RequestTypeCode
  verified: boolean
  rejected: boolean
  acceptanceDate: DateTime
}

/**
 * Map a recipient submission request to a status
 * @param request `request type`, `verified`, `rejected` mapped
 *  by the subgraph, OptimisticRecipientRegistryMapping.ts,
 *  will be used to map the request status.
 *
 *  Action            | request type | verified | rejected
 * ========================================================
 *  Add Requested     |  0           | false    | false
 *  Remove Requested  |  1           | false    | false
 *  Add Challenged    |  0           | true     | true
 *  Remove Challenged |  0           | true     | false
 *  Add Resolved      |  0           | true     | false
 *  Remove Resolved   |  1           | true     | false
 *
 * @returns RequestStatus
 */
function mapRequestStatus(request: RecipientRequestData): RequestStatus {
  let status: RequestStatus

  if (request.rejected) {
    status = RequestStatus.Rejected
  } else {
    if (request.verified) {
      status = request.requestType === RequestTypeCode.Removal ? RequestStatus.Removed : RequestStatus.Executed
    } else {
      if (request.requestType === RequestTypeCode.Removal) {
        status = hasDateElapsed(request.acceptanceDate) ? RequestStatus.RemovalAccepted : RequestStatus.PendingRemoval
      } else {
        status = hasDateElapsed(request.acceptanceDate) ? RequestStatus.Accepted : RequestStatus.Submitted
      }
    }
  }

  return status
}

/**
 * Map the recipient state from static round data to request status
 * @param state Recipient state: Active, Rejected, Removed
 * @returns Request status
 */
function staticStateToRequestStatus(state: string): RequestStatus {
  switch (state) {
    case 'Accepted':
      return RequestStatus.Executed
    case 'Rejected':
      return RequestStatus.Rejected
    default:
      return RequestStatus.Removed
  }
}

/**
 * Try to get the recipients from the static round data
 * @param registryAddress The recipient registry address
 * @returns The recipient application requests
 */
async function tryGetRecipientsStatically(registryAddress: string): Promise<Request[]> {
  let requests: Request[] = []

  try {
    const fundingRoundAddress = await clrFundContract.getCurrentRound()
    const fundingRoundInfo = await findStaticRound(fundingRoundAddress)
    if (isSameAddress(fundingRoundInfo?.round?.recipientRegistryAddress, registryAddress)) {
      if (fundingRoundInfo?.projects) {
        requests = fundingRoundInfo.projects.map(project => {
          let metadata = project.metadata
          try {
            if (typeof metadata === 'string') {
              metadata = JSON.parse(project.metadata || '{}')
            }
          } catch (e) {
            metadata = { name: project.name }
          }
          return {
            transactionHash: '', // transaction hash not available in the static data
            type: RequestType.Registration,
            status: staticStateToRequestStatus(project.state),
            acceptanceDate: DateTime.fromISO(project.createdAt),
            recipientId: project.id,
            recipient: project.recipientAddress,
            metadata,
            requester: project.requester,
          }
        })
      }
    }
  } catch {
    requests = []
  }

  return requests
}

export async function getRequests(registryInfo: RegistryInfo, registryAddress: string): Promise<Request[]> {
  let data: GetRecipientsQuery
  try {
    data = await sdk.GetRecipients({
      registryAddress: registryAddress.toLowerCase(),
    })
  } catch {
    return tryGetRecipientsStatically(registryAddress)
  }

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
        imageHash: imageHash,
        thumbnailImageHash: thumbnailImageHash,
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
      status: mapRequestStatus({
        requestType,
        rejected: Boolean(recipient.rejected),
        acceptanceDate,
        verified: Boolean(recipient.verified),
      }),
      acceptanceDate,
      recipientId: recipient.id,
      recipient: recipient.recipientAddress,
      metadata,
      requester,
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
  deposit: bigint,
  signer: Signer,
): Promise<ContractTransactionResponse> {
  const registry = new Contract(registryAddress, OptimisticRecipientRegistry, signer)
  const recipientData = formToRecipientData(recipientApplicationData)
  const { address, ...metadata } = recipientData
  const transaction = await registry.addRecipient(address, JSON.stringify(metadata), { value: deposit })
  return transaction
}

function decodeProject(recipient: Partial<Recipient>): Project {
  if (!recipient.id) {
    throw new Error('Incorrect recipient data')
  }

  const metadata = JSON.parse(recipient.recipientMetadata || '')

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
    bannerImageHash: metadata.bannerImageHash || metadata.imageHash,
    thumbnailImageHash: metadata.thumbnailImageHash || metadata.imageHash,
  }
}

/**
 * Get a list of projects created between the start time and end time
 * @param registryAddress The recipient registry address
 * @param fundingRoundAddress The funding round address to search in the static rounds
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
  let data: GetRecipientsQuery
  try {
    data = await sdk.GetRecipients({
      registryAddress: registryAddress.toLowerCase(),
    })
  } catch {
    if (!fundingRoundAddress) {
      return []
    }
    const _round = await getStaticRoundInfo(fundingRoundAddress, network)
    return _round?.projects || []
  }

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
 * Find the project from the static round file
 * @param projectId The project id
 * @param fundingRoundAddress The funding round address
 * @param filter Filter the project if it's deleted
 */
async function findStaticProject({
  projectId,
  fundingRoundAddress,
  filter,
}: {
  fundingRoundAddress?: string
  projectId: string
  filter: boolean
}): Promise<Project | null> {
  let project: Project | null = null
  try {
    const roundAddress = fundingRoundAddress ?? (await clrFundContract.getCurrentRound())
    const round = await findStaticRound(roundAddress)
    if (round?.projects) {
      const staticProject = round.projects.find(project => project.id === projectId)
      if (staticProject) {
        project = staticDataToProjectInterface(staticProject)
        if (filter && project.isHidden) {
          project = null
        }
      }
    }
  } catch {
    // return not found on error
    return null
  }

  return project
}

/**
 * Get project information
 *
 * @param recipientId recipient id
 * @param fundingRoundAddress The funding round address
 * @param filter default to always filter result by locked or verified status
 * @returns project
 */
export async function getProject({
  recipientId,
  fundingRoundAddress,
  filter = true,
}: {
  recipientId: string
  fundingRoundAddress?: string
  filter: boolean
}): Promise<Project | null> {
  if (!isHexString(recipientId, 32)) {
    return null
  }

  let data: GetProjectQuery
  try {
    data = await sdk.GetProject({
      recipientId,
    })
  } catch {
    return findStaticProject({ projectId: recipientId, fundingRoundAddress, filter })
  }

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
