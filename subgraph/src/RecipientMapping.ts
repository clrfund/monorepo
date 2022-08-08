import { Recipient } from '../generated/schema'

export const RECIPIENT_REQUEST_TYPE_REGISTRATION = '0'
export const RECIPIENT_REQUEST_TYPE_REMOVAL = '1'

export function removeRecipient(id: string, timestamp: string): void {
  let recipient = Recipient.load(id)
  if (recipient) {
    recipient.requestType = RECIPIENT_REQUEST_TYPE_REMOVAL
    recipient.lastUpdatedAt = timestamp
    recipient.save()
  }
}
