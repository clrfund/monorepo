export enum ChainId {
  MAINNET = 1,
  RINKEBY = 4,
  HARDHAT = 31337,
  ARBITRUM_ONE = 42161,
  ARBITRUM_RINKEBY = 421611,
  OPTIMISM = 10,
  XDAI = 100,
  POLYGON = 137,
}

export interface ChainInfo {
  [chainId: number]: {
    explorer: string
    label: string
    currency: string
    isLayer2: boolean
    rpcUrl?: string
    logo?: string
    bridge?: string
  }
}

export const CHAIN_INFO: ChainInfo = {
  [ChainId.MAINNET]: {
    explorer: 'https://etherscan.io',
    label: 'Mainnet',
    currency: 'ETH',
    isLayer2: false,
    logo: 'eth.svg',
  },
  [ChainId.RINKEBY]: {
    explorer: 'https://rinkeby.etherscan.io',
    label: 'Rinkeby',
    currency: 'ETH',
    isLayer2: false,
    logo: 'eth.svg',
  },
  [ChainId.HARDHAT]: {
    explorer: 'https://rinkeby.etherscan.io',
    label: 'Hardhat',
    currency: 'ETH',
    isLayer2: false,
    logo: 'eth.svg',
  },
  [ChainId.ARBITRUM_ONE]: {
    explorer: 'https://arbiscan.io/',
    label: 'Arbitrum',
    currency: 'ETH',
    isLayer2: true,
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    logo: 'arbitrum.png',
    bridge: 'https://bridge.arbitrum.io',
  },
  [ChainId.ARBITRUM_RINKEBY]: {
    explorer: 'https://testnet.arbiscan.io/',
    label: 'Arbitrum Rinkeby',
    currency: 'ETH',
    isLayer2: true,
    rpcUrl: 'https://rinkeby.arbitrum.io/rpc',
    logo: 'arbitrum.png',
    bridge: 'https://bridge.arbitrum.io',
  },
  [ChainId.OPTIMISM]: {
    explorer: 'https://optimistic.etherscan.io',
    label: 'Optimism',
    currency: 'ETH',
    isLayer2: true,
    rpcUrl: 'https://mainnet.optimism.io',
    logo: 'optimism.png',
    bridge: 'https://gateway.optimism.io/',
  },
  [ChainId.XDAI]: {
    explorer: 'https://blockscout.com/poa/xdai/',
    label: 'xDai',
    currency: 'xDai',
    isLayer2: false,
    rpcUrl: 'https://rpc.xdaichain.com/',
    logo: 'xdai.svg',
    bridge: 'https://bridge.xdaichain.com/',
  },
  [ChainId.POLYGON]: {
    explorer: 'https://polygonscan.com/',
    label: 'Polygon',
    currency: 'MATIC',
    isLayer2: false,
    rpcUrl: 'https://rpc-mainnet.matic.network',
    logo: 'polygon.svg',
    bridge: 'https://wallet.polygon.technology/',
  },
}
