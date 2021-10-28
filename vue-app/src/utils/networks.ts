import { Network } from '@ethersproject/networks'

export function getNetworkToken(network: Network): string {
  if (network.name === 'unknown' && network.chainId === 100) {
    return 'XDAI'
  } else {
    return 'ETH'
  }
}
