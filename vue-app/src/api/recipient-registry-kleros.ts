import { BigNumber, Contract, Event, Signer } from 'ethers'
import { TransactionResponse } from '@ethersproject/abstract-provider'
import { gtcrDecode } from '@kleros/gtcr-encoder'

import { KlerosGTCR, KlerosGTCRAdapter } from './abi'
import { provider, ipfsGatewayUrl } from './core'
import { RecipientRegistryInterface } from './types'
import { Project, toProjectInterface } from './projects'

const KLEROS_CURATE_URL =
  'https://curate.kleros.io/tcr/0x2E3B10aBf091cdc53cC892A50daBDb432e220398'

export enum TcrItemStatus {
  Absent = 0,
  Registered = 1,
  RegistrationRequested = 2,
  ClearingRequested = 3,
}

interface TcrColumn {
  label: string
  type: string
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

function decodeTcrItemData(
  columns: TcrColumn[],
  data: any[]
): {
  address: string
  name: string
  description: string
  imageUrl: string
} {
  // Disable console.error to ignore parser errors
  /* eslint-disable no-console */
  const consoleError = console.error
  console.error = function () {} // eslint-disable-line @typescript-eslint/no-empty-function
  const decodedMetadata = gtcrDecode({ columns, values: data })
  console.error = consoleError
  /* eslint-enable no-console */
  return {
    address: decodedMetadata[1] as string,
    name: decodedMetadata[0] as string,
    description: decodedMetadata[3] as string,
    imageUrl: `${ipfsGatewayUrl}${decodedMetadata[2]}`,
  }
}

function decodeRecipientAdded(event: Event, columns: TcrColumn[]): Project {
  const args = event.args as any
  return toProjectInterface({
    id: args._tcrItemId,
    ...decodeTcrItemData(columns, args._metadata),
    index: args._index.toNumber(),
    isHidden: false,
    isLocked: false,
  })
}

export async function getProjects(
  registryAddress: string,
  startTime?: number,
  endTime?: number
): Promise<Project[]> {
  const registry = new Contract(registryAddress, KlerosGTCRAdapter, provider)
  const tcrAddress = await registry.tcr()
  const tcr = new Contract(tcrAddress, KlerosGTCR, provider)
  const tcrColumns = await getTcrColumns(tcr)
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
    const project = decodeRecipientAdded(event, tcrColumns)
    const addedAt = (event.args as any)._timestamp.toNumber()
    if (endTime && addedAt >= endTime) {
      // Hide recipient if it is added after the end of round.
      project.isHidden = true
    }
    const removed = recipientRemovedEvents.find((event) => {
      return (event.args as any)._tcrItemId === project.id
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
    projects.push(project)
  }
  // Search for unregistered recipients.
  // Unregistered recipients are always visible,
  // even if item is submitted after the end of round.
  const tcrItemSubmittedFilter = tcr.filters.ItemSubmitted()
  const tcrItemSubmittedEvents = await tcr.queryFilter(
    tcrItemSubmittedFilter,
    0
  )
  for (const event of tcrItemSubmittedEvents) {
    const tcrItemId = (event.args as any)._itemID
    const registered = projects.find((item) => item.id === tcrItemId)
    if (registered) {
      // Already registered (or registered and removed)
      continue
    }
    const [tcrItemData, tcrItemStatus] = await tcr.getItemInfo(tcrItemId)
    if (tcrItemStatus.toNumber() !== TcrItemStatus.Registered) {
      continue
    }
    const project: Project = toProjectInterface({
      id: tcrItemId,
      ...decodeTcrItemData(tcrColumns, tcrItemData),
      // Only unregistered project can have invalid index 0
      index: 0,
      isHidden: false,
      isLocked: false,
      extra: {
        tcrItemStatus: TcrItemStatus.Registered,
        tcrItemUrl: `${KLEROS_CURATE_URL}/${tcrItemId}`,
      },
    })
    projects.push(project)
  }
  return projects
}

export async function getProject(
  registryAddress: string,
  recipientId: string
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
  const project: Project = toProjectInterface({
    id: recipientId,
    ...decodeTcrItemData(tcrColumns, tcrItemData),
    // Only unregistered project can have invalid index 0
    index: 0,
    isHidden: false,
    isLocked: false,
    extra: {
      tcrItemStatus: tcrItemStatus.toNumber(),
      tcrItemUrl: `${KLEROS_CURATE_URL}/${recipientId}`,
    },
  })
  const recipientAddedFilter = registry.filters.RecipientAdded(recipientId)
  const recipientAddedEvents = await registry.queryFilter(
    recipientAddedFilter,
    0
  )
  if (recipientAddedEvents.length !== 0) {
    const recipientAddedEvent = recipientAddedEvents[0]
    project.index = (recipientAddedEvent.args as any)._index.toNumber()
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
  return project
}

export async function registerProject(
  registryAddress: string,
  recipientId: string,
  signer: Signer
): Promise<TransactionResponse> {
  const registry = new Contract(registryAddress, KlerosGTCRAdapter, signer)
  const transaction = await registry.addRecipient(recipientId)
  return transaction
}

export function addRecipient(
  registryAddress: string,
  recipientData: any,
  _deposit: BigNumber,
  signer: Signer
): Promise<TransactionResponse> {
  return registerProject(registryAddress, recipientData.id, signer)
}

function removeProject() {
  throw new Error('removeProject Not implemented')
}

function rejectProject() {
  throw new Error('rejectProject Not implemented')
}

export function create(): RecipientRegistryInterface {
  return {
    addRecipient,
    removeProject,
    registerProject,
    rejectProject,
    isSelfRegistration: false, //TODO: add support for self registration
    requireRegistrationDeposit: false,
  }
}

export default { getProjects, getProject, registerProject, create }
