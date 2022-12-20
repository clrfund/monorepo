export enum recipientRegistryType {
  simple = 0,
  kleros = 1,
  optimistic = 2,
}

export interface Project {
  id: string
  recipientIndex?: number
  address?: string
  name?: string
  state: string
  createdAt?: Date
  removedAt?: Date
  tallyIndex?: number
  tallyResult?: string
  spentVoiceCredits?: string
  tallyRecipientAddress?: string
  formattedDonationAmount?: string
  formattedAllocatedAmount?: string
  metadata?: any
  rawMetadata?: string
}

export interface Token {
  symbol: string
  decimals: number
}

export interface Round {
  address: string
  recipientRegistryAddress: string
  maciAddress: string
  contributorCount: string
  totalSpent: string
  matchingPoolSize: string
  voiceCreditFactor: string
  isFinalized: boolean
  isCancelled: boolean
  tallyHash: string
  nativeToken: Token
  startTime: number
  endTime: number
}

export type EventType =
  | 'RequestSubmitted'
  | 'RequestResolved'
  | 'KlerosRecipientAdded'
  | 'KlerosRecipientRemoved'
  | 'RecipientRemoved'
  | 'RecipientAdded'
  | 'RecipientRemovedV1'
  | 'RecipientAddedV1'

export type AbiInfo = {
  type: EventType
  abi: string
}
