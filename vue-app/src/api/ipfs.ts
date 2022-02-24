import { ipfsGatewayUrl } from './core'

export class Ipfs {
  static toUrl(hash: string | undefined): string | undefined {
    if (!hash) {
      return
    }

    const base = ipfsGatewayUrl || ''
    return new URL(`/ipfs/${hash}`, base).toString()
  }
}
