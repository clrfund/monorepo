export enum ChainId {
  MAINNET = 1,
  GOERLI = 5,
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
    // The subgraph network name from:
    // https://thegraph.com/docs/en/developer/create-subgraph-hosted/#supported-networks
    name: string
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
    name: 'mainnet',
  },
  [ChainId.GOERLI]: {
    label: 'Goerli',
    currency: 'ETH',
    logo: 'eth.svg',
    isLayer2: false,
    explorer: 'https://goerli.etherscan.io',
    explorerLogo: 'etherscan.svg',
    explorerLabel: 'Etherscan',
    shortName: 'rin',
    name: 'rinkeby',
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
    shortName: 'got',
    name: 'arbitrum-rinkeby',
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
    shortName: 'arb1',
    name: 'arbitrum-one',
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
    shortName: 'arb-rinkeby',
    name: 'arbitrum-rinkeby',
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
    shortName: 'oeth',
    name: 'optimism',
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
    name: 'xdai',
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
    name: 'matic',
  },
}

// a lookup table for chain id
export const CHAIN_ID: Record<string, number> = Object.entries(
  CHAIN_INFO
).reduce((ids, [id, chain]) => {
  ids[chain.name] = id
  ids[chain.shortName] = id
  return ids
}, {})
