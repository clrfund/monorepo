import { BigNumber, BigNumberish, FixedNumber } from 'ethers'
import { commify, formatUnits } from '@ethersproject/units'
import approx from 'approximate-number'

export function formatAmount(
  _value: BigNumber | FixedNumber | string,
  units: BigNumberish = 18,
  approxPrecision?: number | null,
  maxDecimals?: number | null
): string {
  // If _value is already in string form, assign to formattedValue
  // Otherwise, convert BigNumber (really large integers) to whole AOE balance (human readable floats)
  const formattedValue: string =
    typeof _value === 'string'
      ? _value
      : formatUnits(_value as BigNumber, units).toString()
  let result: number = parseFloat(formattedValue)
  if (maxDecimals) {
    // Fix to maxDecimals, then parse again to remove any trailing zeros
    result = parseFloat(result.toFixed(maxDecimals))
  }
  // If `precision` passed, return approximate-number to given precision
  if (approxPrecision) {
    return approx(result, { precision: approxPrecision })
  }
  // Otherwise, return "commified" result for human readability
  return commify(result)
}
