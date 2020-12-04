import { BigNumber, FixedNumber } from 'ethers'

export function formatAmount(value: BigNumber, decimals: number): string {
  return FixedNumber.fromValue(value, decimals).toString()
}
