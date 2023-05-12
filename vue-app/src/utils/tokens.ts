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
  WXDAI: {
    logo: 'wxdai.svg',
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

export const getTokenLogo = (symbol: string): string => {
  const token = symbol ? TOKEN_INFO[symbol.toUpperCase()] : null
  if (!token) return 'eth.svg'
  return token.logo
}
