export enum ChainId {
  MAINNET = 1,
  SEPOLIA = 11155111,
  HARDHAT = 31337,
  ARBITRUM_ONE = 42161,
  ARBITRUM_RINKEBY = 421611,
  ARBITRUM_GOERLI = 421613,
  ARBITRUM_SEPOLIA = 421614,
  OPTIMISM = 10,
  OPTIMISM_SEPOLIA = 11155420,
  XDAI = 100,
  POLYGON = 137,
}

export type ChainInfo = {
  [chainId in ChainId]: {
    label: string
    name: string
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
    name: 'mainnet',
    currency: 'ETH',
    logo: 'eth.svg',
    isLayer2: false,
    explorer: 'https://etherscan.io',
    explorerLogo: 'etherscan.svg',
    explorerLabel: 'Etherscan',
  },
  [ChainId.SEPOLIA]: {
    label: 'Sepolia',
    name: 'sepolia',
    currency: 'ETH',
    logo: 'eth.svg',
    isLayer2: false,
    explorer: 'https://sepolia.etherscan.io',
    explorerLogo: 'etherscan.svg',
    explorerLabel: 'Etherscan',
  },
  [ChainId.HARDHAT]: {
    label: 'Arbitrum Hardhat',
    name: 'hardhat',
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
    name: 'arbitrum',
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
    name: 'arbitrum-rinkeby',
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
    name: 'arbitrum-goerli',
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
    name: 'arbitrum-sepolia',
    currency: 'AETH',
    logo: 'arbitrum.svg',
    isLayer2: true,
    explorer: 'https://sepolia.arbiscan.io/',
    explorerLogo: 'arbitrum.svg',
    explorerLabel: 'Arbiscan',
    rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
    bridge: 'https://bridge.arbitrum.io',
  },
  [ChainId.OPTIMISM]: {
    label: 'Optimism',
    name: 'optimism',
    currency: 'OETH',
    logo: 'optimism.svg',
    isLayer2: true,
    explorer: 'https://optimistic.etherscan.io',
    explorerLogo: 'optimism.svg',
    explorerLabel: 'Etherscan',
    rpcUrl: 'https://mainnet.optimism.io',
    bridge: 'https://gateway.optimism.io',
  },
  [ChainId.OPTIMISM_SEPOLIA]: {
    label: 'Optimism Sepolia',
    name: 'optimism-sepolia',
    currency: 'OETH',
    logo: 'optimism.svg',
    isLayer2: true,
    explorer: 'https://sepolia-optimism.etherscan.io',
    explorerLogo: 'optimism.svg',
    explorerLabel: 'Etherscan',
    rpcUrl: 'https://sepolia.optimism.io',
    bridge: 'https://gateway.optimism.io',
  },
  [ChainId.XDAI]: {
    label: 'xDai',
    name: 'xdai',
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
    name: 'polygon',
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
