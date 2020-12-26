import { Contract, Event } from 'ethers'
import { isAddress } from '@ethersproject/address'

import { SimpleRecipientRegistry } from './abi'
import { provider, ipfsGatewayUrl } from './core'
import { Project } from './projects'

function decodeRecipientAdded(event: Event): Project {
  const args = event.args as any
  const metadata = JSON.parse(args._metadata)
  return {
    id: args._recipient,
    address: args._recipient,
    name: metadata.name,
    description: metadata.description,
    imageUrl: `${ipfsGatewayUrl}/ipfs/${metadata.imageHash}`,
    index: args._index.toNumber(),
    isHidden: false,
    isLocked: false,
  }
}

export async function getProjects(
  registryAddress: string,
  startBlock?: number,
  endBlock?: number,
): Promise<Project[]> {
  const registry = new Contract(registryAddress, SimpleRecipientRegistry, provider)
  const recipientAddedFilter = registry.filters.RecipientAdded()
  const recipientAddedEvents = await registry.queryFilter(recipientAddedFilter, 0, endBlock)
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
      return (event.args as any)._recipient === project.id
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
  recipientAddress: string,
): Promise<Project | null> {
  if (!isAddress(recipientAddress)) {
    return null
  }
  const registry = new Contract(registryAddress, SimpleRecipientRegistry, provider)
  const recipientAddedFilter = registry.filters.RecipientAdded(recipientAddress)
  const recipientAddedEvents = await registry.queryFilter(recipientAddedFilter, 0)
  if (recipientAddedEvents.length !== 1) {
    return null
  }
  let project
  try {
    project = decodeRecipientAdded(recipientAddedEvents[0])
  } catch {
    // Invalid metadata
    return null
  }
  const recipientRemovedFilter = registry.filters.RecipientRemoved(recipientAddress)
  const recipientRemovedEvents = await registry.queryFilter(recipientRemovedFilter, 0)
  if (recipientRemovedEvents.length !== 0) {
    project.isLocked = true
  }
  return project
}

export default { getProjects, getProject }
