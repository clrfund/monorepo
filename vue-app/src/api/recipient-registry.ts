import { BigNumber, Contract } from 'ethers'
import sdk from '@/graphql/sdk'
import { BaseRecipientRegistry } from './abi'
import {
  provider,
  ipfsGatewayUrl,
  recipientRegistryPolicy,
  RecipientRegistryType,
  recipientRegistryType,
} from './core'
import { chain, RequestTypeCode } from '@/api/core'
import OptimisticRegistry from './recipient-registry-optimistic'
import SimpleRegistry from './recipient-registry-simple'
import UniversalRegistry from './recipient-registry-universal'
import KlerosRegistry from './recipient-registry-kleros'
import { isHexString } from '@ethersproject/bytes'
import { Recipient } from '@/graphql/API'
import { Project } from './projects'

export interface RegistryInfo {
  deposit: BigNumber
  depositToken: string
  challengePeriodDuration: number
  listingPolicyUrl: string
  recipientCount: number
  owner: string
  isRegistrationOpen: boolean
  requireRegistrationDeposit: boolean
}

const registryLookup: Record<RecipientRegistryType, Function> = {
  [RecipientRegistryType.OPTIMISTIC]: OptimisticRegistry.create,
  [RecipientRegistryType.UNIVERSAL]: UniversalRegistry.create,
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
    isRegistrationOpen: registry.isRegistrationOpen,
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

  if (!data.recipients?.length) {
    return []
  }

  const recipients = data.recipients

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

  const recipient = data.recipients?.[0]

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

export default { getProject, getProjects }
