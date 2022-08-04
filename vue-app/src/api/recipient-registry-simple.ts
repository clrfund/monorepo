import { BigNumber, Contract, Event, Signer } from 'ethers'
import { ContractTransaction } from '@ethersproject/contracts'

import { isHexString } from '@ethersproject/bytes'

import { SimpleRecipientRegistry } from './abi'
import { provider, ipfsGatewayUrl, chain } from './core'
import { RecipientRegistryInterface } from './types'
import { Project, toProjectInterface } from './projects'

function decodeRecipientAdded(event: Event): Project {
  const args = event.args as any
  const metadata = JSON.parse(args._metadata)
  return toProjectInterface({
    ...metadata,
    id: args._recipientId,
    address: args._recipient,
    imageUrl: `${ipfsGatewayUrl}/ipfs/${metadata.imageHash}`,
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

export function addRecipient(
  registryAddress: string,
  recipientData: any,
  _deposit: BigNumber,
  signer: Signer
): Promise<ContractTransaction> {
  const registry = new Contract(
    registryAddress,
    SimpleRecipientRegistry,
    signer
  )
  const { id, fund } = recipientData
  if (!id) {
    throw new Error('Missing metadata id')
  }

  const { currentChainReceivingAddress: address } = fund
  if (!address) {
    throw new Error(`Missing recipient address for the ${chain.name} network`)
  }

  const json = { id }
  return registry.addRecipient(address, JSON.stringify(json))
}

function removeProject(
  registryAddress: string,
  recipientId: string,
  signer: Signer
): Promise<ContractTransaction> {
  const registry = new Contract(
    registryAddress,
    SimpleRecipientRegistry,
    signer
  )
  return registry.removeRecipient(recipientId)
}

function rejectProject() {
  throw new Error('removeProject not implemented')
}

function registerProject() {
  throw new Error('removeProject not implemented')
}

export function create(): RecipientRegistryInterface {
  return {
    addRecipient,
    removeProject,
    registerProject,
    rejectProject,
    isSelfRegistration: false,
    requireRegistrationDeposit: false,
  }
}

export default { getProjects, getProject, create }
