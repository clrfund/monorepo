import { BigNumber, Contract, Event, Signer } from 'ethers'
import { TransactionResponse, TransactionReceipt } from '@ethersproject/abstract-provider'
import { DateTime } from 'luxon'
import { getEventArg } from '@/utils/contracts'

import { OptimisticRecipientRegistry } from './abi'
import { provider, ipfsGatewayUrl, recipientRegistryPolicy } from './core'

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

export interface Request {
  id: string;
  type: RequestType;
  timestamp: number;
  status: RequestStatus;
  name: string;
  description: string;
  imageUrl: string;
  address: string;
}

function decodeRequest(requestSubmittedEvent: Event): Request {
  const args = requestSubmittedEvent.args as any
  const metadata = JSON.parse(args._metadata)
  return {
    id: args._recipientId,
    type: args._recipient === '0x0000000000000000000000000000000000000000' ? RequestType.Removal : RequestType.Registration,
    timestamp: args._timestamp.toNumber(),
    status: RequestStatus.Submitted,
    name: metadata.name,
    description: metadata.description,
    imageUrl: `${ipfsGatewayUrl}/ipfs/${metadata.imageHash}`,
    address: args._recipient,
  }
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
    let request: Request
    try {
      request = decodeRequest(event)
    } catch (error) {
      // Invalid metadata
      continue
    }
    const now = DateTime.now().toSeconds()
    if (request.timestamp + registryInfo.challengePeriodDuration < now) {
      request.status = RequestStatus.Accepted
    }
    const rejected = requestRejectedEvents.find((event) => {
      return (event.args as any)._recipientId === request.id
    })
    if (rejected) {
      request.status = RequestStatus.Rejected
    } else {
      if (request.type === RequestType.Removal) {
        const removed = recipientRemovedEvents.find((event) => {
          return (event.args as any)._recipientId === request.id
        })
        if (removed) {
          request.status = RequestStatus.Executed
        }
      } else {
        const added = recipientAddedEvents.find((event) => {
          return (event.args as any)._recipientId === request.id
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
