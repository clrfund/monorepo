import { BigInt, log } from '@graphprotocol/graph-ts'
import {
  OwnershipTransferred,
  RequestResolved,
  RequestSubmitted,
} from '../generated/UniversalRecipientRegistry/UniversalRecipientRegistry'

import { Recipient } from '../generated/schema'

export function handleOwnershipTransferred(event: OwnershipTransferred): void {
  log.info('handleOwnershipTransferred - universal recipient registry', [])
}

export function handleRequestResolved(event: RequestResolved): void {
  let recipientRegistryId = event.address.toHexString()

  log.info('handleRequestResolved', [])
  let recipientId = event.params._recipientId.toHexString()
  let recipient = new Recipient(recipientId)

  recipient.requestType = BigInt.fromI32(event.params._type).toString()
  recipient.requester = event.transaction.from.toHexString()
  recipient.submissionTime = event.params._timestamp.toString()
  recipient.rejected = event.params._rejected
  recipient.verified = !event.params._rejected
  recipient.recipientRegistry = recipientRegistryId
  recipient.recipientIndex = event.params._recipientIndex
  recipient.requestResolvedHash = event.transaction.hash

  recipient.save()
}

export function handleRequestSubmitted(event: RequestSubmitted): void {
  log.info('handleRequestSubmitted', [])
  let recipientRegistryId = event.address.toHexString()

  //TODO: create RecipientRegistry entity here if it does not exist.

  let recipientId = event.params._recipientId.toHexString()
  let recipient = new Recipient(recipientId)

  recipient.recipientRegistry = recipientRegistryId
  recipient.recipientAddress = event.params._recipient
  recipient.recipientMetadataId = event.params._metadataId
  recipient.requestType = BigInt.fromI32(event.params._type).toString()
  recipient.requester = event.transaction.from.toHexString()
  recipient.submissionTime = event.params._timestamp.toString()
  recipient.deposit = event.transaction.value
  recipient.verified = false
  recipient.requestSubmittedHash = event.transaction.hash

  recipient.save()
}
