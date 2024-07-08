import { ipfsGatewayUrl } from '@/api/core'

export function getAssetsUrl(path) {
  return new URL(`/src/assets/${path}`, import.meta.url).href
}

export function getStaticUrlByIpfsHash(hash): string | null {
  return hash ? `/ipfs/${hash}` : null
}

export function getIpfsUrl(hash): string | null {
  return ipfsGatewayUrl ? `${ipfsGatewayUrl}/ipfs/${hash}` : null
}
