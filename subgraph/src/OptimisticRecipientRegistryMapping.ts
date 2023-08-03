import { BigInt, log } from '@graphprotocol/graph-ts'
import {
  OwnershipTransferred,
  RequestResolved,
  RequestSubmitted,
} from '../generated/OptimisticRecipientRegistry/OptimisticRecipientRegistry'

import { Recipient, RecipientRegistry } from '../generated/schema'

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
  log.info('handleRequestResolved', [])

  let recipientRegistryId = event.address.toHexString()
  let recipientRegistry = RecipientRegistry.load(recipientRegistryId)
  if (!recipientRegistry) {
    log.warning(
      'handleRequestResolved - ignore unknown recipient registry {} hash {}',
      [event.address.toHexString(), event.transaction.hash.toHex()]
    )
    return
  }

  let recipientId = event.params._recipientId.toHexString()
  let recipient = new Recipient(recipientId)

  recipient.recipientRegistry = recipientRegistryId
  recipient.requestResolvedHash = event.transaction.hash
  // verified means the request is resolved
  recipient.verified = true

  if (event.params._rejected) {
    // this is a challengeRequest
    if (event.params._type == 0) {
      // reject add request
      recipient.rejected = event.params._rejected
      recipient.recipientIndex = event.params._recipientIndex
      recipient.requester = event.transaction.from.toHexString()
      recipient.submissionTime = event.params._timestamp.toString()
    } else {
      // reject delete request - revert request type back to 'Add'
      // to clear the 'Pending removal' status
      recipient.requestType = '0'
    }
  } else {
    // this is a executeRequest
    recipient.requestType = BigInt.fromI32(event.params._type).toString()
    recipient.recipientIndex = event.params._recipientIndex
    // reject the recipient if it was a 'delete recipient request'
    recipient.rejected = event.params._rejected
    recipient.requester = event.transaction.from.toHexString()
    recipient.submissionTime = event.params._timestamp.toString()
  }

  recipient.save()
}

export function handleRequestSubmitted(event: RequestSubmitted): void {
  log.info('handleRequestSubmitted', [])
  let recipientRegistryId = event.address.toHexString()

  let recipientRegistery = RecipientRegistry.load(recipientRegistryId)
  if (!recipientRegistery) {
    log.warning(
      'handleRequestSubmitted - ignore unknown recipient registry {} hash {}',
      [event.address.toHexString(), event.transaction.hash.toHex()]
    )
    return
  }

  let recipientId = event.params._recipientId.toHexString()
  let recipient = new Recipient(recipientId)
  recipient.recipientRegistry = recipientRegistryId
  recipient.submissionTime = event.params._timestamp.toString()
  recipient.lastUpdatedAt = event.block.timestamp.toString()

  if (event.params._type == 0) {
    // add recipient request
    recipient.requestType = BigInt.fromI32(event.params._type).toString()
    recipient.recipientIndex = null
    recipient.recipientAddress = event.params._recipient
    recipient.requester = event.transaction.from.toHexString()
    recipient.deposit = event.transaction.value
    recipient.recipientMetadata = event.params._metadata
    recipient.requestSubmittedHash = event.transaction.hash

    // reset these fields in case the same recipient was added and removed
    // in which case these fields could hold values for previous record
    recipient.requestResolvedHash = null
    recipient.verified = false
    recipient.rejected = false
    recipient.createdAt = event.block.timestamp.toString()
  } else if (event.params._type == 1) {
    // mark the record as pending delete
    recipient.requestType = BigInt.fromI32(event.params._type).toString()
    recipient.verified = false
    log.info('handleRequestSubmitted - delete id {}', [recipientId])
  } else {
    // don't know how to process this request
    recipient.requestType = BigInt.fromI32(event.params._type).toString()
    log.warning(
      'handleRequestSubmitted - ignore unknown type {} from txHash {}',
      [
        BigInt.fromI32(event.params._type).toString(),
        event.transaction.hash.toString(),
      ]
    )
  }

  recipient.save()
}
