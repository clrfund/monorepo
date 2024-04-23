/**
 * Get the square root of a bigint
 * @param val the value to apply square root on
 */
export function bnSqrt(val: bigint): bigint {
  // Take square root from a bigint
  // https://stackoverflow.com/a/52468569/1868395
  if (val < 0n) {
    throw new Error('Complex numbers not support')
  }

  if (val < 2n) {
    return val
  }

  let loop = 100
  let x: bigint
  let x1 = val / 2n
  do {
    x = x1
    x1 = (x + val / x) / 2n
    loop--
  } while (x !== x1 && loop)

  if (loop === 0 && x !== x1) {
    throw new Error('Sqrt took too long to calculate')
  }

  return x
}
