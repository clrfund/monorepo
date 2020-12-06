import { Contract, Event } from 'ethers'
import { gtcrDecode } from '@kleros/gtcr-encoder'

import { KlerosGTCR, KlerosGTCRAdapter } from './abi'
import { provider, ipfsGatewayUrl } from './core'
import { Project } from './projects'

interface TcrColumn {
  label: string;
  type: string;
}

async function getTcrColumns(tcr: Contract): Promise<TcrColumn[]> {
  const metaEvidenceFilter = tcr.filters.MetaEvidence()
  const metaEvidenceEvents = await tcr.queryFilter(metaEvidenceFilter, 0)
  // Take last event with even index
  const regMetaEvidenceEvent = metaEvidenceEvents[metaEvidenceEvents.length - 2]
  const ipfsPath = (regMetaEvidenceEvent.args as any)._evidence
  const tcrDataResponse = await fetch(`${ipfsGatewayUrl}${ipfsPath}`)
  const tcrData = await tcrDataResponse.json()
  return tcrData.metadata.columns
}

function decodeRecipientAdded(event: Event, columns: TcrColumn[]): Project {
  const args = event.args as any
  const decodedMetadata = gtcrDecode({ columns, values: args._metadata })
  return {
    id: args._tcrItemId,
    name: decodedMetadata[0] as string,
    description: decodedMetadata[3] as string,
    imageUrl: `${ipfsGatewayUrl}${decodedMetadata[2]}`,
    index: args._index.toNumber(),
    isRemoved: false,
  }
}

export async function getProjects(
  registryAddress: string,
  startBlock?: number,
  endBlock?: number,
): Promise<Project[]> {
  const registry = new Contract(registryAddress, KlerosGTCRAdapter, provider)
  const tcrAddress = await registry.tcr()
  const tcr = new Contract(tcrAddress, KlerosGTCR, provider)
  const tcrColumns = await getTcrColumns(tcr)
  const recipientAddedFilter = registry.filters.RecipientAdded()
  const recipientAddedEvents = await registry.queryFilter(recipientAddedFilter, 0, endBlock)
  const recipientRemovedFilter = registry.filters.RecipientRemoved()
  const recipientRemovedEvents = await registry.queryFilter(recipientRemovedFilter, 0)
  const projects: Project[] = []
  for (const event of recipientAddedEvents) {
    let project
    try {
      project = decodeRecipientAdded(event, tcrColumns)
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
        continue
      } else {
        project.isRemoved = true
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
  const registry = new Contract(registryAddress, KlerosGTCRAdapter, provider)
  const tcrAddress = await registry.tcr()
  const tcr = new Contract(tcrAddress, KlerosGTCR, provider)
  const tcrColumns = await getTcrColumns(tcr)
  const recipientAddedFilter = registry.filters.RecipientAdded(recipientId)
  const recipientAddedEvents = await registry.queryFilter(recipientAddedFilter, 0)
  if (recipientAddedEvents.length !== 1) {
    return null
  }
  let project
  try {
    project = decodeRecipientAdded(recipientAddedEvents[0], tcrColumns)
  } catch {
    return null
  }
  const recipientRemovedFilter = registry.filters.RecipientRemoved(recipientId)
  const recipientRemovedEvents = await registry.queryFilter(recipientRemovedFilter, 0)
  if (recipientRemovedEvents.length !== 0) {
    project.isRemoved = true
  }
  return project
}

export default { getProjects, getProject }
