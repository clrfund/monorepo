// eslint-disable-next-line @typescript-eslint/no-var-requires
const Hash = require('ipfs-only-hash')
import { utils } from 'ethers'
import { DEFAULT_IPFS_GATEWAY } from './constants'

export async function getIpfsHash(object: any): Promise<string> {
  const data = Buffer.from(JSON.stringify(object, null, 4))
  return await Hash.of(data)
}

export class Ipfs {
  static async fetchJson(hash: string, gatewayUrl?: string): Promise<any> {
    const url = `${gatewayUrl || DEFAULT_IPFS_GATEWAY}/ipfs/${hash}`
    const result = utils.fetchJson(url)
    return result
  }
}
