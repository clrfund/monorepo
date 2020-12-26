import { factory, recipientRegistryType } from './core'

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

export async function getRecipientRegistryAddress(): Promise<string> {
  return await factory.recipientRegistry()
}

export async function getProjects(
  startBlock?: number,
  endBlock?: number,
): Promise<Project[]> {
  const registryAddress = await getRecipientRegistryAddress()
  if (recipientRegistryType === 'simple') {
    return await SimpleRegistry.getProjects(registryAddress, startBlock, endBlock)
  } else if (recipientRegistryType === 'kleros') {
    return await KlerosRegistry.getProjects(registryAddress, startBlock, endBlock)
  } else {
    throw new Error('invalid recipient registry type')
  }
}

export async function getProject(id: string): Promise<Project | null> {
  const registryAddress = await getRecipientRegistryAddress()
  if (recipientRegistryType === 'simple') {
    return await SimpleRegistry.getProject(registryAddress, id)
  } else if (recipientRegistryType === 'kleros') {
    return await KlerosRegistry.getProject(registryAddress, id)
  } else {
    throw new Error('invalid recipient registry type')
  }
}
