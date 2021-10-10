export interface Token {
  logo: string
}

// Can lookup token information by passing
// TOKEN_INFO[nativeTokenSymbol.toUpperCase()]
export const TOKEN_INFO: { [key: string]: Token } = {
  ETH: {
    logo: 'eth.svg',
  },
  DAI: {
    logo: 'dai.svg',
  },
  USDC: {
    logo: 'usdc.svg',
  },
  WETH: {
    logo: 'weth.svg',
  },
  AOE: {
    logo: 'aoe.svg',
  },
  MATIC: {
    logo: 'matic.svg',
  },
}
