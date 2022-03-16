import { BigNumber, Contract, Signer } from 'ethers'
import {
  TransactionResponse,
  TransactionReceipt,
} from '@ethersproject/abstract-provider'
import { DateTime } from 'luxon'
import { getEventArg } from '@/utils/contracts'

import { OptimisticRecipientRegistry } from './abi'
import {
  ipfsGatewayUrl,
  RequestTypeCode,
  RecipientRegistryInterface,
} from './core'
import sdk from '@/graphql/sdk'
import { RegistryInfo } from './recipient-registry'
import { RecipientApplicationData } from './recipient'

export enum RequestType {
  Registration = 'Registration',
  Removal = 'Removal',
}

export enum RequestStatus {
  Submitted = 'Needs review',
  Rejected = 'Rejected',
  Executed = 'Live',
  Removed = 'Removed',
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
  registryInfo: RegistryInfo,
  registryAddress: string
): Promise<Request[]> {
  const data = await sdk.GetRecipients({
    registryAddress: registryAddress.toLowerCase(),
  })

  if (!data.recipients?.length) {
    return []
  }

  const recipients = data.recipients

  const requests: Record<string, Request> = {}
  for (const recipient of recipients) {
    let metadata = JSON.parse(recipient.recipientMetadata || '{}')

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
    const acceptanceDate = DateTime.fromSeconds(
      submissionTime + registryInfo.challengePeriodDuration
    )

    let requester
    if (recipient.requester) {
      requester = recipient.requester
    }

    const request: Request = {
      transactionHash:
        recipient.requestResolvedHash || recipient.requestSubmittedHash,
      type: RequestType[RequestTypeCode[requestType]],
      status: RequestStatus.Submitted,
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
    isRegistrationOpen: true,
    requireRegistrationDeposit: true,
  }
}

export default {
  registerProject,
  addRecipient,
  create,
}
