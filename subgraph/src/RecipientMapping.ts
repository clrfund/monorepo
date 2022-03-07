import { Recipient } from '../generated/schema'

export function removeRecipient(id: string, timestamp: string): void {
    let recipient = Recipient.load(id)
    if( recipient ) {
        // TODO: should we hard delete the recipient record?
        recipient.rejected = true
        recipient.lastUpdatedAt = timestamp
        recipient.save()
    }
}
