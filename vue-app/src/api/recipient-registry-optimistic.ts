import { BigNumber, Contract, Event, Signer } from 'ethers'
import { TransactionResponse, TransactionReceipt } from '@ethersproject/abstract-provider'
import { isHexString } from '@ethersproject/bytes'
import { DateTime } from 'luxon'
import { getEventArg } from '@/utils/contracts'

import { OptimisticRecipientRegistry } from './abi'
import { provider, ipfsGatewayUrl, recipientRegistryPolicy } from './core'
import { Project } from './projects'

export interface RegistryInfo {
  deposit: BigNumber;
  depositToken: string;
  challengePeriodDuration: number;
  listingPolicyUrl: string;
}

export async function getRegistryInfo(registryAddress: string): Promise<RegistryInfo> {
  const registry = new Contract(registryAddress, OptimisticRecipientRegistry, provider)
  const deposit = await registry.baseDeposit()
  const challengePeriodDuration = await registry.challengePeriodDuration()
  return {
    deposit,
    depositToken: 'ETH',
    challengePeriodDuration: challengePeriodDuration.toNumber(),
    listingPolicyUrl: `${ipfsGatewayUrl}/ipfs/${recipientRegistryPolicy}`,
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
  Submitted = 'Submitted',
  Rejected = 'Rejected',
  Accepted = 'Accepted',
  Executed = 'Executed',
}

interface RecipientMetadata {
  name: string;
  description: string;
  imageUrl: string;
}

export interface Request {
  type: RequestType;
  timestamp: number;
  status: RequestStatus;
  recipientId: string;
  recipient: string;
  metadata: RecipientMetadata;
}

export async function getRequests(
  registryAddress: string,
  registryInfo: RegistryInfo,
): Promise<Request[]> {
  const registry = new Contract(registryAddress, OptimisticRecipientRegistry, provider)
  const requestSubmittedFilter = registry.filters.RequestSubmitted()
  const requestSubmittedEvents = await registry.queryFilter(requestSubmittedFilter, 0)
  const requestResolvedFilter = registry.filters.RequestResolved()
  const requestResolvedEvents = await registry.queryFilter(requestResolvedFilter, 0)
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
    const request: Request = {
      type,
      timestamp: eventArgs._timestamp.toNumber(),
      status: RequestStatus.Submitted,
      recipientId: eventArgs._recipientId,
      recipient: eventArgs._recipient,
      metadata,
    }
    const now = DateTime.now().toSeconds()
    if (request.timestamp + registryInfo.challengePeriodDuration < now) {
      request.status = RequestStatus.Accepted
    }
    // Find corresponding RequestResolved event
    const resolved = requestResolvedEvents.find((event) => {
      const args = event.args as any
      if (request.type === RequestType.Registration) {
        return args._recipientId === request.recipientId && args._type === RequestTypeCode.Registration
      } else {
        return args._recipientId === request.recipientId && args._type === RequestTypeCode.Removal
      }
    })
    if (resolved) {
      const isRejected = (resolved.args as any)._rejected
      request.status = isRejected ? RequestStatus.Rejected : RequestStatus.Executed
    }
    requests.push(request)
  }
  return requests
}

export interface RecipientData {
  name: string;
  description: string;
  imageHash: string;
  address: string;
}

export async function addRecipient(
  registryAddress: string,
  recipientData: RecipientData,
  deposit: BigNumber,
  signer: Signer,
): Promise<TransactionResponse> {
  const registry = new Contract(registryAddress, OptimisticRecipientRegistry, signer)
  const { address, ...metadata } = recipientData
  const transaction = await registry.addRecipient(address, JSON.stringify(metadata), { value: deposit })
  return transaction
}

export function getRequestId(
  receipt: TransactionReceipt,
  registryAddress: string,
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
  return {
    id: args._recipientId,
    address: args._recipient,
    name: metadata.name,
    description: metadata.description,
    imageUrl: `${ipfsGatewayUrl}/ipfs/${metadata.imageHash}`,
    // Only unregistered project can have invalid index 0
    index: 0,
    isHidden: false,
    isLocked: false,
    extra: {
      submissionTime: args._timestamp.toNumber(),
    },
  }
}

export async function getProjects(
  registryAddress: string,
  startBlock?: number,
  endBlock?: number,
): Promise<Project[]> {
  const registry = new Contract(registryAddress, OptimisticRecipientRegistry, provider)
  const now = DateTime.now().toSeconds()
  const challengePeriodDuration = (await registry.challengePeriodDuration()).toNumber()
  const requestSubmittedFilter = registry.filters.RequestSubmitted()
  const requestSubmittedEvents = await registry.queryFilter(requestSubmittedFilter, 0, endBlock)
  const requestResolvedFilter = registry.filters.RequestResolved()
  const requestResolvedEvents = await registry.queryFilter(requestResolvedFilter, 0)
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
    // Find corresponding RequestResolved event
    const registration = requestResolvedEvents.find((event) => {
      const args = event.args as any
      return args._recipientId === project.id && args._type === RequestTypeCode.Registration
    })
    if (registration) {
      const isRejected = (registration.args as any)._rejected
      if (isRejected) {
        continue
      } else {
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
      if (!startBlock || startBlock && removed.blockNumber <= startBlock) {
        // Start block not specified
        // or recipient had been removed before start block
        project.isHidden = true
      } else {
        project.isLocked = true
      }
    }
    projects.push(project)
  }
  return projects
}

export async function getProject(
  registryAddress: string,
  recipientId: string,
): Promise<Project | null> {
  if (!isHexString(recipientId, 32)) {
    return null
  }
  const registry = new Contract(registryAddress, OptimisticRecipientRegistry, provider)
  const now = DateTime.now().toSeconds()
  const challengePeriodDuration = (await registry.challengePeriodDuration()).toNumber()
  const requestSubmittedFilter = registry.filters.RequestSubmitted(recipientId)
  const requestSubmittedEvents = await registry.queryFilter(requestSubmittedFilter, 0)
  // Find registration request
  const requestSubmittedEvent = requestSubmittedEvents.find((event) => {
    return (event.args as any)._type === RequestTypeCode.Registration
  })
  if (!requestSubmittedEvent) {
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
  const requestResolvedEvents = await registry.queryFilter(requestResolvedFilter, 0)
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
    project.isLocked = true
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

export default { getProjects, getProject, registerProject }
