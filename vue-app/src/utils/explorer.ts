import { chain } from '@/api/core'
import { getAssetsUrl } from '@/utils/url'

export function getBlockExplorer(hash: string): { label: string; url: string; logo: string; logoUrl: string } {
  return {
    label: chain.explorerLabel as string,
    url: `${chain.explorer}/tx/${hash}`,
    logo: chain.explorerLogo as string,
    logoUrl: getAssetsUrl(chain.explorerLogo),
  }
}
