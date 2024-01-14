import { Contract, TransactionResponse } from 'ethers'

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

export async function getEventArg(
  transaction: TransactionResponse,
  contract: Contract,
  eventName: string,
  argumentName: string
): Promise<any> {
  const contractAddress = await contract.getAddress()
  // eslint-disable-line @typescript-eslint/no-explicit-any
  const receipt = await transaction.wait()
  for (const log of receipt?.logs || []) {
    if (log.address != contractAddress) {
      continue
    }

    const event = contract.interface.parseLog({
      data: log.data,
      topics: [...log.topics],
    })
    if (event && event.name === eventName) {
      return event.args[argumentName]
    }
  }
  throw new Error('Event not found')
}
