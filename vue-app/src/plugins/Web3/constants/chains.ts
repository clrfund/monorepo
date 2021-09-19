export enum ChainId {
  MAINNET = 1,
  RINKEBY = 4,
  HARDHAT = 31337,
  ARBITRUM_ONE = 42161,
  ARBITRUM_RINKEBY = 421611,
}

export interface ChainInfo {
  [chainId: number]: {
    explorer: string
    label: string
    rpcUrl?: string
    logo?: string
  }
}

export const CHAIN_INFO: ChainInfo = {
  [ChainId.MAINNET]: {
    explorer: 'https://etherscan.io/',
    label: 'Mainnet',
    logo: 'eth.svg',
  },
  [ChainId.RINKEBY]: {
    explorer: 'https://rinkeby.etherscan.io/',
    label: 'Rinkeby',
    logo: 'eth.svg',
  },
  [ChainId.HARDHAT]: {
    explorer: 'https://rinkeby.etherscan.io/',
    label: 'Hardhat',
    logo: 'eth.svg',
  },
  [ChainId.ARBITRUM_ONE]: {
    explorer: 'https://explorer.arbitrum.io/',
    label: 'Arbitrum',
    logo: 'arbitrum.png',
  },
  [ChainId.ARBITRUM_RINKEBY]: {
    explorer: 'https://rinkeby-explorer.arbitrum.io/#/',
    rpcUrl: 'https://rinkeby.arbitrum.io/rpc',
    label: 'Arbitrum Rinkeby',
    logo: 'arbitrum.png',
  },
}
