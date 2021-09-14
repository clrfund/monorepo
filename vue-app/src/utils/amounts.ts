import { BigNumber, BigNumberish, FixedNumber } from 'ethers'
import { commify, formatUnits } from '@ethersproject/units'

export function formatAmount(
  _value: BigNumber | FixedNumber | string,
  units: BigNumberish = 18,
  maximumSignificantDigits?: number | null,
  maxDecimals?: number | null
): string {
  // If _value is already in string form, assign to formattedValue
  // Otherwise, convert BigNumber (really large integers) to whole AOE balance (human readable floats)
  const formattedValue: string =
    typeof _value === 'string'
      ? _value
      : formatUnits(_value as BigNumber, units).toString()
  let result: number = parseFloat(formattedValue)
  // If `maxDecimals` passed, fix/truncate to string and parse back to number
  if (maxDecimals) {
    result = parseFloat(result.toFixed(maxDecimals))
  }
  // If `maximumSignificantDigits` passed, return compact human-readable form to specified digits
  if (maximumSignificantDigits) {
    return new Intl.NumberFormat('en', {
      /* @ts-ignore */ // TODO: Remove `@ts-ignore` when codebase upgrades to typescript ^4.1.0
      notation: 'compact',
      maximumSignificantDigits,
    }).format(result)
  }
  // Else, return commified result
  return commify(result)
}
