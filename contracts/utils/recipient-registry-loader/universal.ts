import { Recipient } from './types'
import { Contract } from 'ethers'
import { getEventArg } from '../contracts'

export class UniversalRecipientRegistryLoader {
  static async load(registry: Contract, recipients: Recipient[]) {
    for (const recipient of recipients) {
      if (!recipient.metadataId) {
        throw new Error('missing metadata id')
      }
      const deposit = await registry.baseDeposit()
      const recipientAdded = await registry.addRecipient(
        recipient.address,
        recipient.metadataId,
        { value: deposit }
      )
      await recipientAdded.wait()

      if (!!recipient.skipExecution) {
        const recipientId = await getEventArg(
          recipientAdded,
          registry,
          'RequestSubmitted',
          '_recipientId'
        )
        const executeRequest = await registry.executeRequest(recipientId)
        await executeRequest.wait()
      }
    }
  }
}
