import { DateTime } from 'luxon'
import { BigNumber } from 'ethers'

export interface RegistryInfo {
  deposit: BigNumber
  depositToken: string
  challengePeriodDuration: number
  listingPolicyUrl: string
  recipientCount: number
  owner: string
  isSelfRegistration: boolean
  requireRegistrationDeposit: boolean
}

export interface RecipientRegistryInterface {
  addRecipient: Function
  registerProject: Function
  rejectProject: Function
  removeProject: Function
  isSelfRegistration?: boolean
  requireRegistrationDeposit?: boolean
}

// recipient registration request type
export enum RecipientRegistryRequestTypeCode {
  Registration = 0,
  Removal = 1,
}

export enum RecipientRegistryRequestType {
  Registration = 'Registration',
  Removal = 'Removal',
}

export enum RecipientRegistryRequestStatus {
  Submitted = 'Needs review',
  Accepted = 'Accepted',
  Rejected = 'Rejected',
  Executed = 'Live',
  Removed = 'Removed',
}

interface RecipientMetadata {
  name: string
  description: string
  imageUrl: string
  thumbnailImageUrl: string
}

export interface RecipientRegistryRequest {
  transactionHash: string
  type: RecipientRegistryRequestType
  status: RecipientRegistryRequestStatus
  acceptanceDate: DateTime
  recipientId: string
  recipient: string
  metadata: RecipientMetadata
  requester: string
}

export interface LinkInfo {
  url: string
  text: string
}
