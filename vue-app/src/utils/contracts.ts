import type { TransactionResponse, TransactionReceipt, Signer } from 'ethers'
import { Contract } from 'ethers'
import { FundingRound, Poll } from '@/api/abi'
import { provider, MAX_WAIT_DEPTH } from '@/api/core'
import { getEventArg } from '@clrfund/common'

/**
 * Return the handle to the Poll contract
 * @param fundingRoundAddress The funding round contract address
 * @param signer The signer handle
 * @returns The Poll contract handle
 */
export async function getPollContract(fundingRoundAddress: string, signer: Signer): Promise<Contract> {
  const fundingRound = new Contract(fundingRoundAddress, FundingRound, signer)
  const pollAddress = await fundingRound.poll()
  return new Contract(pollAddress, Poll, signer)
}

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

export async function isTransactionMined(hash: string): Promise<boolean> {
  const receipt = await provider.getTransactionReceipt(hash)
  return !!receipt
}

export { getEventArg }
