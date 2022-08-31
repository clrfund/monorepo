import { Recipient } from './types'
import { Contract } from 'ethers'

export class SimpleRecipientRegistryLoader {
  static async load(registry: Contract, recipients: Recipient[]) {
    for (const recipient of recipients) {
      const tx = await registry.addRecipient(
        recipient.address,
        JSON.stringify(recipient.metadata)
      )
      await tx.wait()
    }
  }
}
