import type { BigNumber } from 'ethers'

// Recipient registry info
export interface RegistryInfo {
  deposit: BigNumber
  depositToken: string
  challengePeriodDuration: number
  recipientCount: number
  owner: string
}

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
}
