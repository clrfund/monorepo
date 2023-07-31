// eslint-disable-next-line @typescript-eslint/no-var-requires
const Hash = require('ipfs-only-hash')
import { utils } from 'ethers'

const IPFS_BASE_URL = 'https://ipfs.io'

export async function getIpfsHash(object: any): Promise<string> {
  const data = Buffer.from(JSON.stringify(object, null, 4))
  return await Hash.of(data)
}

export class Ipfs {
  static async fetchJson(hash: string, gatewayUrl?: string): Promise<any> {
    const url = `${gatewayUrl || IPFS_BASE_URL}/ipfs/${hash}`
    const result = utils.fetchJson(url)
    return result
  }
}
