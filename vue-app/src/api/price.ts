export interface EthPrice {
  ethereum: {
    usd: number;
  };
}

export async function fetchCurrentEthPrice(): Promise<EthPrice> {
  const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd')
  const data = await res.json()
  return data
}