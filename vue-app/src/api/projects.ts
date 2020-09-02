import { factory, ipfsGatewayUrl } from './core'

export interface Project {
  address: string;
  name: string;
  description: string;
  imageUrl: string;
  index: number;
}

export async function getProjects(): Promise<Project[]> {
  const recipientFilter = factory.filters.RecipientAdded()
  const events = await factory.queryFilter(recipientFilter, 0)
  const projects: Project[] = []
  events.forEach(event => {
    if (!event.args) {
      return
    }
    const metadata = JSON.parse(event.args._metadata)
    projects.push({
      address: event.args._fundingAddress,
      name: metadata.name,
      description: metadata.description,
      imageUrl: `${ipfsGatewayUrl}${metadata.imageHash}`,
      index: event.args._index,
    })
  })
  return projects
}
