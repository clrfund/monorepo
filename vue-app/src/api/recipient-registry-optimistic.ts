import { BigNumber, Contract, Event, Signer } from 'ethers'
import { TransactionResponse, TransactionReceipt } from '@ethersproject/abstract-provider'
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

enum RequestType {
  Registration = 'Registration',
  Removal = 'Removal',
}

export interface Request {
  id: string;
  type: RequestType;
  timestamp: number;
  isRejected: boolean;
  isExecuted: boolean;
  name: string;
  description: string;
  imageUrl: string;
  address: string;
}

function decodeRequestSubmitted(event: Event): Request {
  const args = event.args as any
  const metadata = JSON.parse(args._metadata)
  return {
    id: args._recipientId,
    type: args._recipient === '0x0000000000000000000000000000000000000000' ? RequestType.Removal : RequestType.Registration,
    timestamp: args._timestamp.toNumber(),
    isRejected: false,
    isExecuted: false,
    name: metadata.name,
    description: metadata.description,
    imageUrl: `${ipfsGatewayUrl}/ipfs/${metadata.imageHash}`,
    address: args._recipient,
  }
}

export async function getRequests(registryAddress: string): Promise<Request[]> {
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
      request = decodeRequestSubmitted(event)
    } catch (error) {
      // Invalid metadata
      continue
    }
    const rejected = requestRejectedEvents.find((event) => {
      return (event.args as any)._recipientId === request.id
    })
    if (rejected) {
      request.isRejected = true
    } else {
      if (request.type === RequestType.Removal) {
        const removed = recipientRemovedEvents.find((event) => {
          return (event.args as any)._recipientId === request.id
        })
        if (removed) {
          request.isExecuted = true
        }
      } else {
        const added = recipientAddedEvents.find((event) => {
          return (event.args as any)._recipientId === request.id
        })
        if (added) {
          request.isExecuted = true
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
