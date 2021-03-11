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
  const requestRejectedFilter = registry.filters.RequestRejected()
  const requestRejectedEvents = await registry.queryFilter(requestRejectedFilter, 0)
  const recipientAddedFilter = registry.filters.RecipientAdded()
  const recipientAddedEvents = await registry.queryFilter(recipientAddedFilter, 0)
  const recipientRemovedFilter = registry.filters.RecipientRemoved()
  const recipientRemovedEvents = await registry.queryFilter(recipientRemovedFilter, 0)
  const requests: Request[] = []
  for (const event of requestSubmittedEvents) {
    const args = event.args as any
    let type: RequestType
    let metadata: RecipientMetadata
    if (args._recipient === '0x0000000000000000000000000000000000000000') {
      // Removal request
      type = RequestType.Removal
      // Find corresponding registration request and update metadata
      const registrationRequest = requests.find((item) => {
        return item.recipientId === args._recipientId
      })
      if (!registrationRequest) {
        throw new Error('registration request not found')
      }
      metadata = registrationRequest.metadata
    } else {
      // Registration request
      type = RequestType.Registration
      const { name, description, imageHash } = JSON.parse(args._metadata)
      metadata = {
        name,
        description,
        imageUrl: `${ipfsGatewayUrl}/ipfs/${imageHash}`,
      }
    }
    const request: Request = {
      type,
      timestamp: args._timestamp.toNumber(),
      status: RequestStatus.Submitted,
      recipientId: args._recipientId,
      recipient: args._recipient,
      metadata,
    }
    const now = DateTime.now().toSeconds()
    if (request.timestamp + registryInfo.challengePeriodDuration < now) {
      request.status = RequestStatus.Accepted
    }
    const rejected = requestRejectedEvents.find((event) => {
      return (event.args as any)._recipientId === request.recipientId
    })
    if (rejected) {
      request.status = RequestStatus.Rejected
    } else {
      if (request.type === RequestType.Removal) {
        const removed = recipientRemovedEvents.find((event) => {
          return (event.args as any)._recipientId === request.recipientId
        })
        if (removed) {
          request.status = RequestStatus.Executed
        }
      } else {
        const added = recipientAddedEvents.find((event) => {
          return (event.args as any)._recipientId === request.recipientId
        })
        if (added) {
          request.status = RequestStatus.Executed
        }
      }
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
  if (args._recipient === '0x0000000000000000000000000000000000000000') {
    // Removal request
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
  const requestRejectedFilter = registry.filters.RequestRejected()
  const requestRejectedEvents = await registry.queryFilter(requestRejectedFilter, 0)
  const recipientAddedFilter = registry.filters.RecipientAdded()
  const recipientAddedEvents = await registry.queryFilter(recipientAddedFilter, 0, endBlock)
  const recipientRemovedFilter = registry.filters.RecipientRemoved()
  const recipientRemovedEvents = await registry.queryFilter(recipientRemovedFilter, 0)
  const projects: Project[] = []
  for (const event of requestSubmittedEvents) {
    let project: Project
    try {
      project = decodeProject(event)
    } catch {
      // Invalid metadata
      continue
    }
    if (project.extra.submissionTime + challengePeriodDuration >= now) {
      // Challenge period is not over yet
      continue
    }
    const rejected = requestRejectedEvents.find((event) => {
      return (event.args as any)._recipientId === project.id
    })
    if (rejected) {
      continue
    }
    const added = recipientAddedEvents.find((event) => {
      return (event.args as any)._recipientId === project.id
    })
    if (added) {
      project.index = (added.args as any)._index.toNumber()
    }
    const removed = recipientRemovedEvents.find((event) => {
      return (event.args as any)._recipientId === project.id
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
  const requestSubmittedEvent = requestSubmittedEvents.find((event) => {
    // Find registration request
    return (event.args as any)._recipient !== '0x0000000000000000000000000000000000000000'
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
  const requestRejectedFilter = registry.filters.RequestRejected(recipientId)
  const requestRejectedEvents = await registry.queryFilter(requestRejectedFilter, 0)
  if (requestRejectedEvents.length !== 0) {
    return null
  }
  const recipientAddedFilter = registry.filters.RecipientAdded(recipientId)
  const recipientAddedEvents = await registry.queryFilter(recipientAddedFilter, 0)
  if (recipientAddedEvents.length !== 0) {
    const recipientAddedEvent = recipientAddedEvents[0]
    project.index = (recipientAddedEvent.args as any)._index.toNumber()
  }
  const recipientRemovedFilter = registry.filters.RecipientRemoved(recipientId)
  const recipientRemovedEvents = await registry.queryFilter(recipientRemovedFilter, 0)
  if (recipientRemovedEvents.length !== 0) {
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
