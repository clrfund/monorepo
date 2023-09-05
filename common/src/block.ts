import { providers, utils } from 'ethers'

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
  const blockNumberHex = utils.hexValue(blockNumber)
  const blockParams = [blockNumberHex, false]
  const rawBlock = await provider.send('eth_getBlockByNumber', blockParams)
  return { blockNumber, hash: rawBlock.hash, stateRoot: rawBlock.stateRoot }
}
