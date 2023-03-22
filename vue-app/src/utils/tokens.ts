import { TOKEN_INFO, type Token } from '@/plugins/Web3/constants/tokens'

export const getTokenLogo = (symbol: string): string => {
	const token: Token = TOKEN_INFO[symbol.toUpperCase()]
	// eslint-disable-next-line
	if (!token) return 'eth.svg'
	return token.logo
}
