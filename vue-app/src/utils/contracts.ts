import type { Contract } from 'ethers'
import type { TransactionResponse, TransactionReceipt } from '@ethersproject/abstract-provider'
import { provider, MAX_WAIT_DEPTH } from '@/api/core'
import { isSameAddress } from '@/utils/accounts'

export async function waitForTransaction(
  pendingTransaction: Promise<TransactionResponse>,
  onTransactionHash?: (hash: string) => void,
): Promise<TransactionReceipt> {
  let transaction
  try {
    transaction = await pendingTransaction
  } catch (error: any) {
    throw new Error(error.message)
  }
  onTransactionHash?.(transaction.hash)
  let transactionReceipt
  while (!transactionReceipt) {
    try {
      transactionReceipt = await transaction.wait()
    } catch (receiptError: any) {
      const errorMessage = receiptError.data?.message || ''
      if (errorMessage.includes('Block information is incomplete')) {
        /* eslint-disable-next-line no-console */
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

/**
 * Wait for transaction to be mined and available on the subgraph
 * @param pendingTransaction transaction to wait and check for
 * @param checkFn the check function
 * @param onTransactionHash callback function with the transaction hash
 * @returns transaction receipt
 */
export async function waitForTransactionAndCheck(
  pendingTransaction: Promise<TransactionResponse>,
  checkFn: (receipt: TransactionReceipt) => Promise<boolean>,
  onTransactionHash?: (hash: string) => void,
): Promise<TransactionReceipt> {
  const receipt = await waitForTransaction(pendingTransaction, onTransactionHash)

  return new Promise(resolve => {
    async function checkAndWait(depth = 0) {
      if (await checkFn(receipt)) {
        resolve(receipt)
      } else {
        if (depth > MAX_WAIT_DEPTH) {
          throw new Error('Time out waiting for transaction ' + receipt.transactionHash)
        }

        const timeoutMs = 2 ** depth * 10
        await new Promise(res => setTimeout(res, timeoutMs))
        checkAndWait(depth + 1)
      }
    }

    checkAndWait()
  })
}

export function getEventArg(
  transactionReceipt: TransactionReceipt,
  contract: Contract,
  eventName: string,
  argumentName: string,
): any {
  // eslint-disable-next-line
  for (const log of transactionReceipt.logs || []) {
    if (!isSameAddress(log.address, contract.address)) {
      continue
    }
    const event = contract.interface.parseLog(log)
    // eslint-disable-next-line
    if (event && event.name === eventName) {
      return event.args[argumentName]
    }
  }
  throw new Error(
    `Event ${eventName} from contract ${contract.address} not found in transaction ${transactionReceipt.transactionHash}`,
  )
}

export async function isTransactionMined(hash: string): Promise<boolean> {
  const receipt = await provider.getTransactionReceipt(hash)
  return !!receipt
}
