import { factory, recipientRegistryType } from './core'

import SimpleRegistry from './recipient-registry-simple'

export interface Project {
  id: string; // Address or another ID depending on registry implementation
  name: string;
  description: string;
  imageUrl: string;
  index: number;
  isRemoved: boolean;
}

export async function getProjects(
  startBlock?: number,
  endBlock?: number,
): Promise<Project[]> {
  const registryAddress = await factory.recipientRegistry()
  if (recipientRegistryType === 'simple') {
    return await SimpleRegistry.getProjects(registryAddress, startBlock, endBlock)
  } else {
    throw new Error('invalid recipient registry type')
  }
}

export async function getProject(id: string): Promise<Project | null> {
  const registryAddress = await factory.recipientRegistry()
  if (recipientRegistryType === 'simple') {
    return await SimpleRegistry.getProject(registryAddress, id)
  } else {
    throw new Error('invalid recipient registry type')
  }
}
