import { Contract } from 'ethers'
import { FundingRound } from './abi'
import { factory, provider, recipientRegistryType } from './core'
import { ipfsGatewayUrl } from './core'

import SimpleRegistry from './recipient-registry-simple'
import KlerosRegistry from './recipient-registry-kleros'
import RecipientRegistry from './recipient-registry'

export interface Project {
  id: string // Address or another ID depending on registry implementation
  address: string
  requester?: string
  name: string
  metadataId?: string
  tagline?: string
  description: string
  category?: string
  problemSpace?: string
  plans?: string
  teamName?: string
  teamDescription?: string
  githubUrl?: string
  radicleUrl?: string
  websiteUrl?: string
  twitterUrl?: string
  discordUrl?: string
  bannerImageUrl?: string
  thumbnailImageUrl?: string
  imageUrl?: string // TODO remove
  index: number
  isHidden: boolean // Hidden from the list (does not participate in round)
  isLocked: boolean // Visible, but contributions are not allowed
  extra?: any // Registry-specific data
}

//TODO: update anywhere this is called to take factory address as a parameter
//NOTE: why isn't this included in the vuex state schema?
export async function getRecipientRegistryAddress(
  roundAddress: string | null
): Promise<string> {
  if (roundAddress !== null) {
    const fundingRound = new Contract(roundAddress, FundingRound, provider)
    return await fundingRound.recipientRegistry()
  } else {
    //TODO: upgrade factory to take it's address as a parameter
    return await factory.recipientRegistry()
  }
}

export async function getProjects(
  registryAddress: string,
  startTime?: number,
  endTime?: number
): Promise<Project[]> {
  if (recipientRegistryType === 'simple') {
    return await SimpleRegistry.getProjects(registryAddress, startTime, endTime)
  } else if (recipientRegistryType === 'kleros') {
    return await KlerosRegistry.getProjects(registryAddress, startTime, endTime)
  } else {
    return await RecipientRegistry.getProjects(
      registryAddress,
      startTime,
      endTime
    )
  }
}

export async function getProject(
  registryAddress: string,
  recipientId: string
): Promise<Project | null> {
  if (recipientRegistryType === 'simple') {
    return await SimpleRegistry.getProject(registryAddress, recipientId)
  } else if (recipientRegistryType === 'kleros') {
    return await KlerosRegistry.getProject(registryAddress, recipientId)
  } else {
    return await RecipientRegistry.getProject(recipientId)
  }
}

export function toProjectInterface(metadata: any): Project {
  const imageUrl = metadata.imageUrl
  const bannerImageUrl = metadata.bannerImageHash
    ? `${ipfsGatewayUrl}/ipfs/${metadata.bannerImageHash}`
    : imageUrl

  const thumbnailImageUrl = metadata.thumbnailImageHash
    ? `${ipfsGatewayUrl}/ipfs/${metadata.thumbnailImageHash}`
    : imageUrl

  return {
    ...metadata,
    bannerImageUrl,
    thumbnailImageUrl,
  }
}
