import { ipfsPinningUrl, ipfsPinningJwt } from './core'

export class IPFS {
  url: string
  jwt: string

  constructor() {
    this.url = ipfsPinningUrl || ''
    this.jwt = ipfsPinningJwt || ''
  }

  async add(file: File): Promise<string> {
    const data = new FormData()
    data.append('file', file)

    const options = {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.jwt}`,
      },
      body: data,
    }

    const result = await fetch(this.url, options)
    const json = await result.json()
    return json.IpfsHash
  }
}
