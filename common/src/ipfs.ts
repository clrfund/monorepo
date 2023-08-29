import { utils } from 'ethers'

const IPFS_BASE_URL = 'https://ipfs.io'

/**
 * Get the IPFS content given the IPFS hash
 * @param hash The IPFS hash
 * @param gatewayUrl The IPFS gateway url
 * @returns The IPFS content
 */
export async function getIpfsContent(
  hash: string,
  gatewayUrl = IPFS_BASE_URL
): Promise<any> {
  const url = `${gatewayUrl}/ipfs/${hash}`
  const result = utils.fetchJson(url)
  return result
}
