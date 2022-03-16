import {
  RecipientAdded,
  RecipientRemoved,
} from '../../generated/templates/KlerosRecipientRegistry/KlerosRecipientRegistry'

import { Recipient } from '../../generated/schema'
import { removeRecipient } from '../RecipientMapping'

export function handleRecipientAdded(event: RecipientAdded): void {
  let recipientRegistryId = event.address.toHexString()

  let recipientId = event.params._tcrItemId.toHexString()
  let recipient = new Recipient(recipientId)
  recipient.recipientRegistry = recipientRegistryId
  recipient.createdAt = event.block.timestamp.toString()
  recipient.recipientIndex = event.params._index
  recipient.recipientMetadata = event.params._metadata.toHexString()

  // TODO map recipient address from event.params._metadata
  // recipient.recipientAddress = event.params._metadata

  recipient.save()
}

export function handleRecipientRemoved(event: RecipientRemoved): void {
  let id = event.params._tcrItemId.toHexString()
  let timestamp = event.block.timestamp.toString()
  removeRecipient(id, timestamp)
}
