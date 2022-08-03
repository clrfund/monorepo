import { BigNumber, Contract, Signer } from 'ethers'
import sdk from '@/graphql/sdk'
import { BaseRecipientRegistry } from './abi'
import {
  provider,
  ipfsGatewayUrl,
  recipientRegistryPolicy,
  RecipientRegistryType,
  recipientRegistryType,
  chain,
  QUERY_BATCH_SIZE,
} from './core'
import {
  RegistryInfo,
  RecipientRegistryRequestTypeCode as RequestTypeCode,
  RecipientRegistryRequestStatus as RequestStatus,
  RecipientRegistryRequest as Request,
  RecipientRegistryRequestType as RequestType,
} from '@/api/types'
import OptimisticRegistry from './recipient-registry-optimistic'
import SimpleRegistry from './recipient-registry-simple'
import KlerosRegistry from './recipient-registry-kleros'
import { isHexString } from '@ethersproject/bytes'
import { Recipient } from '@/graphql/API'
import { Project } from './projects'
import { Metadata, MetadataFormData } from './metadata'
import { DateTime } from 'luxon'

const registryLookup: Record<RecipientRegistryType, Function> = {
  [RecipientRegistryType.OPTIMISTIC]: OptimisticRegistry.create,
  [RecipientRegistryType.SIMPLE]: SimpleRegistry.create,
  [RecipientRegistryType.KLEROS]: KlerosRegistry.create,
}

export class RecipientRegistry {
  static create(registryType: string) {
    const createRegistry = registryLookup[registryType]

    if (createRegistry) {
      return createRegistry()
    } else {
      throw new Error('Invalid registry type')
    }
  }
}

export async function getRegistryInfo(
  registryAddress: string
): Promise<RegistryInfo> {
  const data = await sdk.GetRecipientRegistry({
    registryAddress: registryAddress.toLowerCase(),
  })

  const recipientRegistry = data.recipientRegistry
  const baseDeposit = BigNumber.from(recipientRegistry?.baseDeposit || 0)
  const challengePeriodDuration = BigNumber.from(
    recipientRegistry?.challengePeriodDuration || 0
  )
  const owner = recipientRegistry?.owner || ''

  /* TODO: get recipient count from the subgraph */
  const registryContract = new Contract(
    registryAddress,
    BaseRecipientRegistry,
    provider
  )
  const recipientCount = await registryContract.getRecipientCount()

  const registry = RecipientRegistry.create(recipientRegistryType)
  return {
    deposit: baseDeposit,
    depositToken: chain.currency,
    challengePeriodDuration: challengePeriodDuration.toNumber(),
    listingPolicyUrl: `${ipfsGatewayUrl}/ipfs/${recipientRegistryPolicy}`,
    recipientCount: recipientCount.toNumber(),
    owner,
    isSelfRegistration: registry.isSelfRegistration,
    requireRegistrationDeposit: registry.requireRegistrationDeposit,
  }
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
    metadataId: recipient.recipientMetadataId || '',
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

/**
 * Build a map to lookup metadata by id
 * Retrieve metadata in batches to avoid hitting server too often
 * @param ids a list of metadata id
 * @returns a key value map of id and metadata
 */
async function buildMetadataMap(
  ids: string[]
): Promise<Record<string, string>> {
  const batches: string[][] = []
  const batchSize = QUERY_BATCH_SIZE
  for (let i = 0; i < ids.length; i += batchSize) {
    batches.push(ids.slice(i, batchSize + i))
  }

  const metadataBatches = await Promise.all(
    batches.map((aBatch) => Metadata.getBatch(aBatch))
  )

  const map = metadataBatches.reduce((res, batch) => {
    for (let i = 0; i < batch.length; i++) {
      const { id, metadata } = batch[i] || {}
      if (id) {
        res[id] = metadata
      }
    }
    return res
  }, {})

  return map
}

/**
 * Add metadata to recipients if it's missing;
 * @param recipients list of recipients to patch the metadata
 * @returns recipients with metadata
 */
async function normalizeRecipients(
  recipients: Partial<Recipient>[]
): Promise<Partial<Recipient>[]> {
  const metadataIds = recipients.map(({ recipientMetadata }) => {
    try {
      const json = JSON.parse(recipientMetadata || '')
      return json.id
    } catch {
      return null
    }
  })

  const metadataMap = await buildMetadataMap(metadataIds.filter(Boolean))

  return recipients.map((recipient, index) => {
    const metadata = metadataMap[metadataIds[index]]
    if (metadata) {
      recipient.recipientMetadata = metadata
    }
    return recipient
  })
}

export async function getProjects(
  registryAddress: string,
  startTime?: number,
  endTime?: number
): Promise<Project[]> {
  const data = await sdk.GetRecipients({
    registryAddress: registryAddress.toLowerCase(),
  })

  if (!data.recipients?.length) {
    return []
  }

  const recipients = await normalizeRecipients(data.recipients)
  const projects: Project[] = recipients
    .map((recipient) => {
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

export async function projectExists(recipientId: string): Promise<boolean> {
  if (!isHexString(recipientId, 32)) {
    return false
  }

  const data = await sdk.GetProject({
    recipientId,
  })

  if (!data.recipients?.length) {
    // Project does not exist
    return false
  }

  const [recipient] = data.recipients
  const requestType = Number(recipient.requestType)
  if (requestType === RequestTypeCode.Removal && recipient.verified) {
    return false
  }

  return true
}

export async function getProject(recipientId: string): Promise<Project | null> {
  if (!isHexString(recipientId, 32)) {
    return null
  }

  const data = await sdk.GetProject({
    recipientId,
  })

  if (!data.recipients?.length) {
    // Project does not exist
    return null
  }

  const [recipient] = await normalizeRecipients(data.recipients)
  let project: Project
  try {
    project = decodeProject(recipient)
  } catch {
    // Invalid metadata
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

  const recipients = await normalizeRecipients(data.recipients)

  const requests: Record<string, Request> = {}
  for (const recipient of recipients) {
    let metadata: any = {}
    try {
      metadata = JSON.parse(recipient.recipientMetadata || '{}')
    } catch {
      // instead of throwing error, let it flow through so
      // we can investigate the issue from the subgraph
      metadata.name = 'N/A'
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
      recipientId: recipient.id || '',
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

export async function addRecipient(
  registryAddress: string,
  recipientMetadata: MetadataFormData,
  deposit: BigNumber,
  signer: Signer
) {
  const registry = RecipientRegistry.create(recipientRegistryType)
  return registry.addRecipient(
    registryAddress,
    recipientMetadata,
    deposit,
    signer
  )
}

export default { addRecipient, getProject, getProjects, projectExists }
