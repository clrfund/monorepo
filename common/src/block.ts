import { type JsonRpcProvider, toQuantity } from 'ethers'

export interface Block {
  blockNumber: number
  hash: string
  stateRoot: string
}

/**
 * get the block stateRoot using eth_getBlockByHash
 * @param blockNumber The block number
 * @param provider the JSON rpc provider
 * @returns the block information with block number, block hash and state root
 */
export async function getBlock(
  blockNumber: number,
  provider: JsonRpcProvider
): Promise<Block> {
  const blockNumberHex = toQuantity(blockNumber)
  const blockParams = [blockNumberHex, false]
  const rawBlock = await provider.send('eth_getBlockByNumber', blockParams)
  return { blockNumber, hash: rawBlock.hash, stateRoot: rawBlock.stateRoot }
}
