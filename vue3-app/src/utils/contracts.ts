import type { Contract } from 'ethers'
import type { TransactionResponse, TransactionReceipt } from '@ethersproject/abstract-provider'
import { provider } from '@/api/core'

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

export function getEventArg(
	transactionReceipt: TransactionReceipt,
	contract: Contract,
	eventName: string,
	argumentName: string,
): any {
	// eslint-disable-next-line
	for (const log of transactionReceipt.logs || []) {
		if (log.address != contract.address) {
			continue
		}
		const event = contract.interface.parseLog(log)
		// eslint-disable-next-line
		if (event && event.name === eventName) {
			return event.args[argumentName]
		}
	}
	throw new Error('Event not found')
}

export async function isTransactionMined(hash: string): Promise<boolean> {
	const receipt = await provider.getTransactionReceipt(hash)
	return !!receipt
}
