import { Contract, Event } from 'ethers'
import { isAddress } from '@ethersproject/address'

import { RecipientRegistry } from './abi'
import { factory, provider, ipfsGatewayUrl } from './core'

export interface Project {
  address: string;
  name: string;
  description: string;
  imageUrl: string;
  index: number;
  isRemoved: boolean;
}

function decodeRecipientAdded(event: Event): Project {
  const args = event.args as any // eslint-disable-line @typescript-eslint/no-explicit-any
  const metadata = JSON.parse(args._metadata)
  return {
    address: args._recipient,
    name: metadata.name,
    description: metadata.description,
    imageUrl: `${ipfsGatewayUrl}${metadata.imageHash}`,
    index: args._index.toNumber(),
    isRemoved: false,
  }
}

export async function getProjects(atBlock?: number): Promise<Project[]> {
  const registryAddress = await factory.recipientRegistry()
  const registry = new Contract(registryAddress, RecipientRegistry, provider)
  const recipientAddedFilter = registry.filters.RecipientAdded()
  const recipientAddedEvents = await registry.queryFilter(recipientAddedFilter, 0, atBlock)
  const recipientRemovedFilter = registry.filters.RecipientRemoved()
  const recipientRemovedEvents = await registry.queryFilter(recipientRemovedFilter, 0)
  const projects: Project[] = []
  for (const event of recipientAddedEvents) {
    let project
    try {
      project = decodeRecipientAdded(event)
    } catch {
      // Invalid metadata
      continue
    }
    const removed = recipientRemovedEvents.find((event) => {
      return (event.args as any)._recipient === project.address
    })
    if (removed) {
      if (!atBlock || atBlock && removed.blockNumber <= atBlock) {
        // Start block not specified
        // or recipient had been removed before start block
        continue
      } else {
        project.isRemoved = true
      }
    }
    projects.push(project)
  }
  return projects
}

export async function getProject(address: string): Promise<Project | null> {
  if (!isAddress(address)) {
    return null
  }
  const registryAddress = await factory.recipientRegistry()
  const registry = new Contract(registryAddress, RecipientRegistry, provider)
  const recipientAddedFilter = registry.filters.RecipientAdded(address)
  const recipientAddedEvents = await registry.queryFilter(recipientAddedFilter, 0)
  if (recipientAddedEvents.length !== 1) {
    return null
  }
  let project
  try {
    project = decodeRecipientAdded(recipientAddedEvents[0])
  } catch {
    return null
  }
  const recipientRemovedFilter = registry.filters.RecipientRemoved(address)
  const recipientRemovedEvents = await registry.queryFilter(recipientRemovedFilter, 0)
  if (recipientRemovedEvents.length !== 0) {
    project.isRemoved = true
  }
  return project
}
