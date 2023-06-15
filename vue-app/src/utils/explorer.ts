import { chain } from '@/api/core'
import { getAssetsUrl } from '@/utils/url'

export function getBlockExplorerByHash(hash: string): { label: string; url: string; logo: string; logoUrl: string } {
  return {
    label: chain.explorerLabel as string,
    url: `${chain.explorer}/tx/${hash}`,
    logo: chain.explorerLogo as string,
    logoUrl: getAssetsUrl(chain.explorerLogo),
  }
}

export function getBlockExplorerByAddress(address: string): {
  label: string
  url: string
  logo: string
  logoUrl: string
} | null {
  if (!address) {
    return null
  }

  return {
    label: chain.explorerLabel as string,
    url: `${chain.explorer}/address/${address}`,
    logo: chain.explorerLogo as string,
    logoUrl: getAssetsUrl(chain.explorerLogo),
  }
}
