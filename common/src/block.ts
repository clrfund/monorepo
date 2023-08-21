import { providers } from 'ethers'

export interface Block {
  blockNumber: number
  hash: string
  stateRoot: string
}

/*
 * get the block stateRoot using eth_getBlockByHash
 */
export async function getBlock(
  blockNumber: number,
  provider: providers.JsonRpcProvider
): Promise<Block> {
  const block = await provider.getBlock(blockNumber)
  const blockParams = [block.hash, false]
  const rawBlock = await provider.send('eth_getBlockByHash', blockParams)
  return { blockNumber, hash: block.hash, stateRoot: rawBlock.stateRoot }
}
