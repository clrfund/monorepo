import { ipfsPinningUrl, ipfsPinningJwt, ipfsApiKey, ipfsSecretApiKey } from './core'
import { CID } from 'multiformats/cid'

export class IPFS {
  url: string
  jwt: string
  apiKey: string
  secretApiKey: string

  constructor() {
    this.url = ipfsPinningUrl || ''
    this.jwt = ipfsPinningJwt || ''
    this.apiKey = ipfsApiKey || ''
    this.secretApiKey = ipfsSecretApiKey || ''
  }

  async add(file: File): Promise<string> {
    const data = new FormData()
    data.append('file', file)

    const headers: Record<string, string> = {}

    if (this.jwt) {
      headers['Authorization'] = `Bearer ${this.jwt}`
    }

    if (this.apiKey) {
      headers['pinata_api_key'] = this.apiKey
    }

    if (this.secretApiKey) {
      headers['pinata_secret_api_key'] = this.secretApiKey
    }

    const options = {
      method: 'POST',
      headers,
      body: data,
    }

    const result = await fetch(this.url, options)
    const json = await result.json()
    return json.IpfsHash
  }

  /**
   * Check if a CID hash has valid format
   *
   * @param hash CID string
   * @returns true if the hash is a valid CID format
   */
  static isValidCid(hash: string): boolean {
    try {
      return Boolean(hash) && Boolean(CID.parse(hash))
    } catch {
      return false
    }
  }
}
