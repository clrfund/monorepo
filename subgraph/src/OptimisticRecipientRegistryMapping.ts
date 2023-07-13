import { BigInt, log } from '@graphprotocol/graph-ts'
import {
  OwnershipTransferred,
  RequestResolved,
  RequestSubmitted,
} from '../generated/OptimisticRecipientRegistry/OptimisticRecipientRegistry'

import { Recipient } from '../generated/schema'

// It is also possible to access smart contracts from mappings. For
// example, the contract that has emitted the event can be connected to
// with:
//
// let contract = Contract.bind(event.address)
//
// The following functions can then be called on this contract to access
// state variables and other data:
//
// - contract.baseDeposit(...)
// - contract.challengePeriodDuration(...)
// - contract.challengeRequest(...)
// - contract.controller(...)
// - contract.executeRequest(...)
// - contract.getRecipientAddress(...)
// - contract.maxRecipients(...)
// - contract.owner(...)
// - contract.setMaxRecipients(...)

export function handleOwnershipTransferred(event: OwnershipTransferred): void {
  log.info('handleOwnershipTransferred - recipient registry', [])
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
  // verified means the request is resolved
  recipient.verified = true
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

  if (event.params._type == 0) {
    // add recipient request
    let recipient = new Recipient(recipientId)
    recipient.recipientRegistry = recipientRegistryId
    recipient.recipientAddress = event.params._recipient
    recipient.requester = event.transaction.from.toHexString()
    recipient.deposit = event.transaction.value
    recipient.recipientMetadata = event.params._metadata

    // requestSubmittedHash stores the transaction hash for add recipient request
    // the UI uses it to look up the newly added recipient record
    recipient.requestSubmittedHash = event.transaction.hash
    recipient.requestType = BigInt.fromI32(event.params._type).toString()
    recipient.submissionTime = event.params._timestamp.toString()
    recipient.verified = false
    recipient.save()
  } else {
    // deleteRecipient request
    // no need to update metadata and recipient address as they are not available for delete requests
    let recipient = Recipient.load(recipientId)
    if (recipient == null) {
      // this should not happen, record the transaction hash for troubleshooting
      recipient = new Recipient(recipientId)
      recipient.requestSubmittedHash = event.transaction.hash
    }
    recipient.recipientRegistry = recipientRegistryId
    recipient.requestType = BigInt.fromI32(event.params._type).toString()
    recipient.submissionTime = event.params._timestamp.toString()
    recipient.verified = false
    recipient.save()
  }
}
