import { Contract } from 'ethers'
import { TransactionResponse, TransactionReceipt } from '@ethersproject/abstract-provider'

export async function waitForTransaction(
  pendingTransaction: Promise<TransactionResponse>,
  onTransactionHash: (hash: string) => void,
): Promise<TransactionReceipt> {
  let transaction
  try {
    transaction = await pendingTransaction
  } catch (error) {
    throw new Error(error.message)
  }
  onTransactionHash(transaction.hash)
  let transactionReceipt
  while (!transactionReceipt) {
    try {
      transactionReceipt = await transaction.wait()
    } catch (receiptError) {
      const errorMessage = receiptError.data?.message || ''
      if (errorMessage.includes('Block information is incomplete')) {
        console.warn('Failed to get receipt, retrying...')
      } else {
        throw receiptError
      }
    }
  }
  if (transactionReceipt.status !== 1) {
    throw new Error('Transaction failed')
  }
  return transactionReceipt
}

export function getEventArg(
  transactionReceipt: TransactionReceipt,
  contract: Contract,
  eventName: string,
  argumentName: string,
): any {
  for (const log of transactionReceipt.logs || []) {
    if (log.address != contract.address) {
      continue
    }
    const event = contract.interface.parseLog(log)
    if (event && event.name === eventName) {
      return event.args[argumentName]
    }
  }
  throw new Error('Event not found')
}
