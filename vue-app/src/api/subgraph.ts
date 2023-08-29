import type { TransactionReceipt } from '@ethersproject/abstract-provider'
import sdk from '@/graphql/sdk'

/**
 * Check if the transaction in the receipt exists in the subgraph
 * @param receipt transaction receipt
 * @returns true if the latest block number in subgraph is greater than the transaction block number
 */
export async function isTransactionInSubgraph(receipt: TransactionReceipt): Promise<boolean> {
  const data = await sdk.GetLatestBlockNumber()

  if (!data._meta?.block.number) {
    return false
  }

  return data._meta.block.number > receipt.blockNumber
}
