export enum ChainId {
  MAINNET = 1,
  GOERLI = 5,
  HARDHAT = 31337,
  ARBITRUM_ONE = 42161,
  ARBITRUM_RINKEBY = 421611,
  ARBITRUM_GOERLI = 421613,
  ARBITRUM_SEPOLIA = 421614,
  SCROLL_SEPOLIA = 534351,
  SCROLL = 534352,
  OPTIMISM = 10,
  XDAI = 100,
  POLYGON = 137,
}

export type ChainInfo = {
  [chainId in ChainId]: {
    label: string
    currency: string
    logo: string
    isLayer2: boolean
    explorer: string
    explorerLogo: string
    explorerLabel: string
    rpcUrl?: string
    bridge?: string
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
  },
  [ChainId.GOERLI]: {
    label: 'Goerli',
    currency: 'ETH',
    logo: 'eth.svg',
    isLayer2: false,
    explorer: 'https://goerli.etherscan.io',
    explorerLogo: 'etherscan.svg',
    explorerLabel: 'Etherscan',
  },
  [ChainId.HARDHAT]: {
    label: 'Arbitrum Hardhat',
    currency: 'AETH',
    logo: 'arbitrum.svg',
    isLayer2: true,
    explorer: 'https://testnet.arbiscan.io',
    explorerLogo: 'arbitrum.svg',
    explorerLabel: 'Arbiscan',
    rpcUrl: 'https://rinkeby.arbitrum.io/rpc',
    bridge: 'https://bridge.arbitrum.io',
  },
  [ChainId.ARBITRUM_ONE]: {
    label: 'Arbitrum',
    currency: 'AETH',
    logo: 'arbitrum.svg',
    isLayer2: true,
    explorer: 'https://arbiscan.io',
    explorerLogo: 'arbitrum.svg',
    explorerLabel: 'Arbiscan',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    bridge: 'https://bridge.arbitrum.io',
  },
  [ChainId.ARBITRUM_RINKEBY]: {
    label: 'Arbitrum Rinkeby',
    currency: 'AETH',
    logo: 'arbitrum.svg',
    isLayer2: true,
    explorer: 'https://testnet.arbiscan.io',
    explorerLogo: 'arbitrum.svg',
    explorerLabel: 'Arbiscan',
    rpcUrl: 'https://rinkeby.arbitrum.io/rpc',
    bridge: 'https://bridge.arbitrum.io',
  },
  [ChainId.ARBITRUM_GOERLI]: {
    label: 'Arbitrum Goerli',
    currency: 'AETH',
    logo: 'arbitrum.svg',
    isLayer2: true,
    explorer: 'https://goerli.arbiscan.io/',
    explorerLogo: 'arbitrum.svg',
    explorerLabel: 'Arbiscan',
    rpcUrl: 'https://goerli-rollup.arbitrum.io/rpc',
    bridge: 'https://bridge.arbitrum.io',
  },
  [ChainId.ARBITRUM_SEPOLIA]: {
    label: 'Arbitrum Sepolia',
    currency: 'AETH',
    logo: 'arbitrum.svg',
    isLayer2: true,
    explorer: 'https://sepolia.arbiscan.io/',
    explorerLogo: 'arbitrum.svg',
    explorerLabel: 'Arbiscan',
    rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
    bridge: 'https://bridge.arbitrum.io',
  },
  [ChainId.SCROLL_SEPOLIA]: {
    label: 'Scroll Sepolia',
    currency: 'ETH',
    logo: 'eth.svg',
    isLayer2: true,
    explorer: 'https://sepolia.scrollscan.com',
    explorerLogo: 'arbitrum.svg',
    explorerLabel: 'Scrollscan',
    rpcUrl: 'https://sepolia-rpc.scroll.io',
    bridge: 'https://sepolia.scroll.io/bridge',
  },
  [ChainId.SCROLL]: {
    label: 'Scroll',
    currency: 'ETH',
    logo: 'eth.svg',
    isLayer2: true,
    explorer: 'https://scrollscan.com',
    explorerLogo: 'arbitrum.svg',
    explorerLabel: 'Scrollscan',
    rpcUrl: 'https://rpc.scroll.io',
    bridge: 'https://scroll.io/bridge',
  },
  [ChainId.OPTIMISM]: {
    label: 'Optimism',
    currency: 'OETH',
    logo: 'optimism.svg',
    isLayer2: true,
    explorer: 'https://optimistic.etherscan.io',
    explorerLogo: 'optimism.svg',
    explorerLabel: 'Etherscan',
    rpcUrl: 'https://mainnet.optimism.io',
    bridge: 'https://gateway.optimism.io',
  },
  [ChainId.XDAI]: {
    label: 'xDai',
    currency: 'xDai',
    logo: 'xdai.svg',
    isLayer2: false,
    explorer: 'https://gnosisscan.io',
    explorerLogo: 'xdai-explorer.svg',
    explorerLabel: 'Blockscout',
    rpcUrl: 'https://rpc.gnosischain.com',
    bridge: 'https://bridge.gnosischain.com/',
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
  },
}
