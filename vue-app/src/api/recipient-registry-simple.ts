import { Contract, Event } from 'ethers'
import { isHexString } from '@ethersproject/bytes'

import { SimpleRecipientRegistry } from './abi'
import { provider, ipfsGatewayUrl } from './core'
import { Project } from './projects'

function decodeRecipientAdded(event: Event): Project {
  const args = event.args as any
  const metadata = JSON.parse(args._metadata)
  return {
    id: args._recipientId,
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
  startTime?: number,
  endTime?: number
): Promise<Project[]> {
  const registry = new Contract(
    registryAddress,
    SimpleRecipientRegistry,
    provider
  )
  const recipientAddedFilter = registry.filters.RecipientAdded()
  const recipientAddedEvents = await registry.queryFilter(
    recipientAddedFilter,
    0
  )
  const recipientRemovedFilter = registry.filters.RecipientRemoved()
  const recipientRemovedEvents = await registry.queryFilter(
    recipientRemovedFilter,
    0
  )
  const projects: Project[] = []
  for (const event of recipientAddedEvents) {
    let project
    try {
      project = decodeRecipientAdded(event)
    } catch {
      // Invalid metadata
      continue
    }
    const addedAt = (event.args as any)._timestamp.toNumber()
    if (endTime && addedAt >= endTime) {
      // Hide recipient if it is added after the end of round
      project.isHidden = true
    }
    const removed = recipientRemovedEvents.find((event) => {
      return (event.args as any)._recipientId === project.id
    })
    if (removed) {
      const removedAt = (removed.args as any)._timestamp.toNumber()
      if (!startTime || removedAt <= startTime) {
        // Start time not specified
        // or recipient had been removed before start time
        project.isHidden = true
      } else {
        // Disallow contributions to removed recipient, but don't hide it
        project.isLocked = true
      }
    }
    // TODO: set isHidden to 'true' if project replaces removed project during the round
    projects.push(project)
  }
  return projects
}

export async function getProject(
  registryAddress: string,
  recipientId: string
): Promise<Project | null> {
  if (!isHexString(recipientId, 32)) {
    return null
  }
  const registry = new Contract(
    registryAddress,
    SimpleRecipientRegistry,
    provider
  )
  const recipientAddedFilter = registry.filters.RecipientAdded(recipientId)
  const recipientAddedEvents = await registry.queryFilter(
    recipientAddedFilter,
    0
  )
  if (recipientAddedEvents.length !== 1) {
    // Project does not exist
    return null
  }
  let project
  try {
    project = decodeRecipientAdded(recipientAddedEvents[0])
  } catch {
    // Invalid metadata
    return null
  }
  const recipientRemovedFilter = registry.filters.RecipientRemoved(recipientId)
  const recipientRemovedEvents = await registry.queryFilter(
    recipientRemovedFilter,
    0
  )
  if (recipientRemovedEvents.length !== 0) {
    // Disallow contributions to removed recipient
    project.isLocked = true
  }
  // TODO: set isHidden to 'true' if project was removed before the beginning of the round
  // TODO: set isHidden to 'true' if project was added after the end of round
  return project
}

export default { getProjects, getProject }
