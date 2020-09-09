import { Event } from 'ethers'
import { isAddress } from '@ethersproject/address'

import { factory, ipfsGatewayUrl } from './core'

export interface Project {
  address: string;
  name: string;
  description: string;
  imageUrl: string;
  index: number;
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
  }
}

export async function getProjects(): Promise<Project[]> {
  const recipientFilter = factory.filters.RecipientAdded()
  const events = await factory.queryFilter(recipientFilter, 0)
  const projects: Project[] = []
  for (const event of events) {
    projects.push(decodeRecipientAdded(event))
  }
  return projects
}

export async function getProject(address: string): Promise<Project | null> {
  if (!isAddress(address)) {
    return null
  }
  const recipientFilter = factory.filters.RecipientAdded(address)
  const events = await factory.queryFilter(recipientFilter, 0)
  if (events.length === 1) {
    return decodeRecipientAdded(events[0])
  }
  return null
}
