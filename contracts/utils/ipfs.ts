const Hash = require('ipfs-only-hash')
import { utils } from 'ethers'

const IPFS_BASE_URL = 'https://ipfs.io'

export async function getIpfsHash(object: any): Promise<string> {
  const data = Buffer.from(JSON.stringify(object, null, 4))
  return await Hash.of(data)
}

export class Ipfs {
  static async fetchJson(hash: string): Promise<any> {
    const url = `${IPFS_BASE_URL}/ipfs/${hash}`
    const result = utils.fetchJson(url)
    return result
  }
}
