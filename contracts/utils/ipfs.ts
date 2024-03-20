// eslint-disable-next-line @typescript-eslint/no-var-requires
const Hash = require('ipfs-only-hash')
import { FetchRequest } from 'ethers'
import { DEFAULT_IPFS_GATEWAY } from './constants'

/**
 * Get the ipfs hash for the input object
 * @param object a json object to get the ipfs hash for
 * @returns the ipfs hash
 */
export async function getIpfsHash(object: any): Promise<string> {
  const data = Buffer.from(JSON.stringify(object, null, 4))
  return await Hash.of(data)
}

export class Ipfs {
  /**
   * Get the content of the ipfs hash
   * @param hash ipfs hash
   * @param gatewayUrl ipfs gateway url
   * @returns the content
   */
  static async fetchJson(hash: string, gatewayUrl?: string): Promise<any> {
    const url = `${gatewayUrl || DEFAULT_IPFS_GATEWAY}/ipfs/${hash}`
    const req = new FetchRequest(url)
    const resp = await req.send()
    return resp.bodyJson
  }
}
