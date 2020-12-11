import { Contract, Event, Signer } from 'ethers'
import { TransactionResponse } from '@ethersproject/abstract-provider'
import { gtcrDecode } from '@kleros/gtcr-encoder'

import { KlerosGTCR, KlerosGTCRAdapter } from './abi'
import { provider, ipfsGatewayUrl } from './core'
import { Project } from './projects'

const KLEROS_CURATE_URL = 'https://curate.kleros.io/tcr/0x2E3B10aBf091cdc53cC892A50daBDb432e220398'
// TODO: only for xDai Round 02; we should remove them later
const INVALID_PROJECTS = [
  '0xd4b514b8a245c6d6aaa5fc9b97336cfa6607f92184f1ae36e0fb26b7c90faf62',
  '0xa13b920b4e1d910ac5af4a95d61af4a1272fedb39c86cdc747bbb734e990c6b6',
  '0xc9cc75acbd333a72719da5446fc1752406ae0922a3c8818f769d6156af04adeb',
]

export enum TcrItemStatus {
  Absent = 0,
  Registered = 1,
  RegistrationRequested = 2,
  ClearingRequested = 3,
}

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

function decodeTcrItemData(columns: TcrColumn[], data: any[]): {
  name: string;
  description: string;
  imageUrl: string;
} {
  // Disable console.error to ignore parser errors
  /* eslint-disable no-console */
  const consoleError = console.error
  console.error = function () {} // eslint-disable-line @typescript-eslint/no-empty-function
  const decodedMetadata = gtcrDecode({ columns, values: data })
  console.error = consoleError
  /* eslint-enable no-console */
  return {
    name: decodedMetadata[0] as string,
    description: decodedMetadata[3] as string,
    imageUrl: `${ipfsGatewayUrl}${decodedMetadata[2]}`,
  }
}

function decodeRecipientAdded(event: Event, columns: TcrColumn[]): Project {
  const args = event.args as any
  return {
    id: args._tcrItemId,
    ...decodeTcrItemData(columns, args._metadata),
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
  const recipientAddedEvents = await registry.queryFilter(recipientAddedFilter, 0)
  const recipientRemovedFilter = registry.filters.RecipientRemoved()
  const recipientRemovedEvents = await registry.queryFilter(recipientRemovedFilter, 0)
  const projects: Project[] = []
  for (const event of recipientAddedEvents) {
    if (endBlock && event.blockNumber >= endBlock) {
      // Skip recipients added after the end of round.
      // We can not do this with filter because on xDai node returns
      // "One of the blocks specified in filter ... cannot be found"
      continue
    }
    let project
    try {
      project = decodeRecipientAdded(event, tcrColumns)
    } catch {
      // Invalid metadata
      continue
    }
    if (INVALID_PROJECTS.includes(project.id)) {
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
  const [tcrItemData, tcrItemStatus] = await tcr.getItemInfo(recipientId)
  if (tcrItemData === '0x') {
    // Item is not in TCR
    return null
  }
  const project: Project = {
    id: recipientId,
    ...decodeTcrItemData(tcrColumns, tcrItemData),
    // Only unregistered project can have invalid index 0
    index: 0,
    isRemoved: false,
    extra: {
      tcrItemStatus: tcrItemStatus.toNumber(),
      tcrItemUrl: `${KLEROS_CURATE_URL}/${recipientId}`,
    },
  }
  const recipientAddedFilter = registry.filters.RecipientAdded(recipientId)
  const recipientAddedEvents = await registry.queryFilter(recipientAddedFilter, 0)
  if (recipientAddedEvents.length !== 0) {
    const recipientAddedEvent = recipientAddedEvents[0]
    project.index = (recipientAddedEvent.args as any)._index
  }
  const recipientRemovedFilter = registry.filters.RecipientRemoved(recipientId)
  const recipientRemovedEvents = await registry.queryFilter(recipientRemovedFilter, 0)
  if (recipientRemovedEvents.length !== 0) {
    project.isRemoved = true
  }
  return project
}

export async function registerProject(
  registryAddress: string,
  recipientId: string,
  signer: Signer,
): Promise<TransactionResponse> {
  const registry = new Contract(registryAddress, KlerosGTCRAdapter, signer)
  const transaction = await registry.addRecipient(recipientId)
  return transaction
}

export default { getProjects, getProject }
