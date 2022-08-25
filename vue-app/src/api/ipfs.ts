import { ipfsPinningUrl, ipfsPinningJwt } from './core'
import axios from 'axios'

export class IPFS {
  url: string
  jwt: string

  constructor() {
    this.url = ipfsPinningUrl || ''
    this.jwt = ipfsPinningJwt || ''
  }

  async add(file: Blob): Promise<string> {
    const data = new FormData()
    data.append('file', file)

    const options = {
      method: 'POST',
      url: this.url,
      headers: {
        Authorization: `Bearer ${this.jwt}`,
      },
      data,
    }
    const response = await axios(options)
    return response.data.IpfsHash
  }
}
