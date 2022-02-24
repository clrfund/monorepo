import { Project } from './projects'
import { ipfsGatewayUrl } from './core'

export interface RecipientApplicationData {
  project: {
    name: string
    tagline: string
    description: string
    category: string
    problemSpace: string
  }
  fund: {
    addressName: string
    resolvedAddress: string
    plans: string
  }
  team: {
    name: string
    description: string
    email: string
  }
  links: {
    github: string
    radicle: string
    website: string
    twitter: string
    discord: string
  }
  image: {
    bannerHash: string
    thumbnailHash: string
  }
  furthestStep: number
  hasEns: boolean
  id?: string
}

export function formToProjectInterface(
  data: RecipientApplicationData
): Project {
  const { project, fund, team, links, image } = data
  return {
    id: fund.resolvedAddress,
    address: fund.resolvedAddress,
    name: project.name,
    tagline: project.tagline,
    description: project.description,
    category: project.category,
    problemSpace: project.problemSpace,
    plans: fund.plans,
    teamName: team.name,
    teamDescription: team.description,
    githubUrl: links.github,
    radicleUrl: links.radicle,
    websiteUrl: links.website,
    twitterUrl: links.twitter,
    discordUrl: links.discord,
    bannerImageUrl: `${ipfsGatewayUrl}/ipfs/${image.bannerHash}`,
    thumbnailImageUrl: `${ipfsGatewayUrl}/ipfs/${image.thumbnailHash}`,
    index: 0,
    isHidden: false,
    isLocked: true,
  }
}
