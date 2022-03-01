import { Recipient } from './types'
import { Contract } from 'ethers'
import { getEventArg } from '../contracts'

export class OptimisticRecipientRegistryLoader {
  static async load(registry: Contract, recipients: Recipient[]) {
    for (const recipient of recipients) {
      if (!recipient.metadata) {
        throw new Error('missing metadata')
      }

      const deposit = await registry.baseDeposit()
      const recipientAdded = await registry.addRecipient(
        recipient.address,
        JSON.stringify(recipient.metadata),
        { value: deposit }
      )
      await recipientAdded.wait()

      if (!recipient.skipExecution) {
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
