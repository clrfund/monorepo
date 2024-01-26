import { TransactionResponse } from 'ethers'
import { getEventArg } from '@clrfund/common'

export async function getGasUsage(
  transaction: TransactionResponse
): Promise<number> {
  const receipt = await transaction.wait()
  return receipt ? Number(receipt.gasUsed) : 0
}

export async function getTxFee(
  transaction: TransactionResponse
): Promise<bigint> {
  const receipt = await transaction.wait()
  // effectiveGasPrice was introduced by EIP1559
  return receipt ? BigInt(receipt.gasUsed) * BigInt(receipt.gasPrice) : 0n
}

export { getEventArg }
