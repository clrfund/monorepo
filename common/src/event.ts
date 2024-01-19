import { TransactionReceipt, Contract } from 'ethers'

/**
 * Get event log argument value
 * @param transactionReceipt transaction receipt
 * @param contract Contract handle
 * @param eventName event name
 * @param argumentName argument name
 * @returns event argument value
 */
export async function getEventArg(
  transactionReceipt: TransactionReceipt,
  contract: Contract,
  eventName: string,
  argumentName: string
): Promise<any> {
  const contractAddress = await contract.getAddress()
  // eslint-disable-next-line
  for (const log of transactionReceipt.logs || []) {
    if (log.address !== contractAddress) {
      continue
    }
    const event = contract.interface.parseLog({
      data: log.data,
      topics: [...log.topics],
    })
    // eslint-disable-next-line
    if (event && event.name === eventName) {
      return event.args[argumentName]
    }
  }
  throw new Error(
    `Event ${eventName} from contract ${contractAddress} not found in transaction ${transactionReceipt.hash}`
  )
}
