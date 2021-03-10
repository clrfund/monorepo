import { Contract } from 'ethers'
import { FundingRound } from './abi'
import { factory, provider, recipientRegistryType } from './core'

import SimpleRegistry from './recipient-registry-simple'
import KlerosRegistry from './recipient-registry-kleros'

export interface Project {
  id: string; // Address or another ID depending on registry implementation
  address: string;
  name: string;
  description: string;
  imageUrl: string;
  index: number;
  isHidden: boolean; // Hidden from the list
  isLocked: boolean; // Visible, but contributions are not allowed
  extra?: any; // Registry-specific data
}

export async function getRecipientRegistryAddress(roundAddress: string | null): Promise<string> {
  if (roundAddress !== null) {
    const fundingRound = new Contract(roundAddress, FundingRound, provider)
    return await fundingRound.recipientRegistry()
  } else {
    return await factory.recipientRegistry()
  }
}

export async function getProjects(
  registryAddress: string,
  startBlock?: number,
  endBlock?: number,
): Promise<Project[]> {
  if (recipientRegistryType === 'simple' || recipientRegistryType === 'optimistic') {
    return await SimpleRegistry.getProjects(registryAddress, startBlock, endBlock)
  } else if (recipientRegistryType === 'kleros') {
    return await KlerosRegistry.getProjects(registryAddress, startBlock, endBlock)
  } else {
    throw new Error('invalid recipient registry type')
  }
}

export async function getProject(
  registryAddress: string,
  recipientId: string,
): Promise<Project | null> {
  if (recipientRegistryType === 'simple' || recipientRegistryType === 'optimistic') {
    return await SimpleRegistry.getProject(registryAddress, recipientId)
  } else if (recipientRegistryType === 'kleros') {
    return await KlerosRegistry.getProject(registryAddress, recipientId)
  } else {
    throw new Error('invalid recipient registry type')
  }
}
