import { Event } from 'ethers'
import { isAddress } from '@ethersproject/address'

import { factory, ipfsGatewayUrl } from './core'

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
  const recipientAddedFilter = factory.filters.RecipientAdded()
  const recipientAddedEvents = await factory.queryFilter(recipientAddedFilter, 0, atBlock)
  const recipientRemovedFilter = factory.filters.RecipientRemoved()
  const recipientRemovedEvents = await factory.queryFilter(recipientRemovedFilter, 0)
  const projects: Project[] = []
  for (const event of recipientAddedEvents) {
    const project = decodeRecipientAdded(event)
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
  const recipientAddedFilter = factory.filters.RecipientAdded(address)
  const recipientAddedEvents = await factory.queryFilter(recipientAddedFilter, 0)
  if (recipientAddedEvents.length !== 1) {
    return null
  }
  const project = decodeRecipientAdded(recipientAddedEvents[0])
  const recipientRemovedFilter = factory.filters.RecipientRemoved(address)
  const recipientRemovedEvents = await factory.queryFilter(recipientRemovedFilter, 0)
  if (recipientRemovedEvents.length !== 0) {
    project.isRemoved = true
  }
  return project
}
