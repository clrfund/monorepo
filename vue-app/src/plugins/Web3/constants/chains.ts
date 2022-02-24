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
    label: string
    currency: string
    logo: string
    isLayer2: boolean
    explorer: string
    explorerLogo: string
    explorerLabel: string
    rpcUrl?: string
    bridge?: string
    shortName: string
    subgraphNetwork: string
  }
}

export const CHAIN_INFO: ChainInfo = {
  [ChainId.MAINNET]: {
    label: 'Mainnet',
    currency: 'ETH',
    logo: 'eth.svg',
    isLayer2: false,
    explorer: 'https://etherscan.io',
    explorerLogo: 'etherscan.svg',
    explorerLabel: 'Etherscan',
    shortName: 'eth',
    subgraphNetwork: 'mainnet',
  },
  [ChainId.RINKEBY]: {
    label: 'Rinkeby',
    currency: 'ETH',
    logo: 'eth.svg',
    isLayer2: false,
    explorer: 'https://rinkeby.etherscan.io',
    explorerLogo: 'etherscan.svg',
    explorerLabel: 'Etherscan',
    shortName: 'rin',
    subgraphNetwork: 'rinkeby',
  },
  [ChainId.HARDHAT]: {
    label: 'Arbitrum Hardhat',
    currency: 'ETH',
    logo: 'arbitrum.svg',
    isLayer2: true,
    explorer: 'https://testnet.arbiscan.io',
    explorerLogo: 'arbitrum.svg',
    explorerLabel: 'Arbiscan',
    rpcUrl: 'https://rinkeby.arbitrum.io/rpc',
    bridge: 'https://bridge.arbitrum.io',
    shortName: 'got',
    subgraphNetwork: 'arbitrum-rinkeby',
  },
  [ChainId.ARBITRUM_ONE]: {
    label: 'Arbitrum',
    currency: 'ETH',
    logo: 'arbitrum.svg',
    isLayer2: true,
    explorer: 'https://arbiscan.io',
    explorerLogo: 'arbitrum.svg',
    explorerLabel: 'Arbiscan',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    bridge: 'https://bridge.arbitrum.io',
    shortName: 'arb1',
    subgraphNetwork: 'arbitrum-one',
  },
  [ChainId.ARBITRUM_RINKEBY]: {
    label: 'Arbitrum Rinkeby',
    currency: 'ETH',
    logo: 'arbitrum.svg',
    isLayer2: true,
    explorer: 'https://testnet.arbiscan.io',
    explorerLogo: 'arbitrum.svg',
    explorerLabel: 'Arbiscan',
    rpcUrl: 'https://rinkeby.arbitrum.io/rpc',
    bridge: 'https://bridge.arbitrum.io',
    shortName: 'arb-rinkeby',
    subgraphNetwork: 'arbitrum-rinkeby',
  },
  [ChainId.OPTIMISM]: {
    label: 'Optimism',
    currency: 'ETH',
    logo: 'optimism.svg',
    isLayer2: true,
    explorer: 'https://optimistic.etherscan.io',
    explorerLogo: 'optimism.svg',
    explorerLabel: 'Etherscan',
    rpcUrl: 'https://mainnet.optimism.io',
    bridge: 'https://gateway.optimism.io',
    shortName: 'oeth',
    subgraphNetwork: 'optimism',
  },
  [ChainId.XDAI]: {
    label: 'xDai',
    currency: 'xDai',
    logo: 'xdai.svg',
    isLayer2: false,
    explorer: 'https://blockscout.com/poa/xdai',
    explorerLogo: 'xdai-explorer.svg',
    explorerLabel: 'Blockscout',
    rpcUrl: 'https://rpc.xdaichain.com/',
    bridge: 'https://bridge.xdaichain.com',
    shortName: 'gno',
    subgraphNetwork: 'xdai',
  },
  [ChainId.POLYGON]: {
    label: 'Polygon',
    currency: 'MATIC',
    logo: 'polygon.svg',
    isLayer2: false,
    explorer: 'https://polygonscan.com/',
    explorerLogo: 'polygon.svg',
    explorerLabel: 'Polygonscan',
    rpcUrl: 'https://rpc-mainnet.matic.network',
    bridge: 'https://wallet.polygon.technology',
    shortName: 'MATIC',
    subgraphNetwork: 'matic',
  },
}
