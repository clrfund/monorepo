export interface Token {
  label: string
  logo: string
}

// Can lookup token information by passing
// TOKEN_INFO[nativeTokenSymbol.toUpperCase()]
export const TOKEN_INFO: { [key: string]: Token } = {
  ETH: {
    label: 'ether',
    logo: 'eth.svg',
  },
  DAI: {
    label: 'dai',
    logo: 'dai.svg',
  },
  USDC: {
    label: 'USD coin',
    logo: 'usdc.svg',
  },
  WETH: {
    label: 'wrapped ETH',
    logo: 'weth.svg',
  },
  AOE: {
    label: 'AOE',
    logo: 'aoe.svg',
  },
  MATIC: {
    label: 'MATIC',
    logo: 'matic.svg',
  },
}
