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
  const transactionReceipt = await transaction.wait()
  if (transactionReceipt.status !== 1) {
    throw new Error('failed')
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
