import { BigNumber, BigNumberish } from 'ethers'

export function toDate(val: BigNumberish) {
  return new Date(BigNumber.from(val).mul(1000).toNumber())
}
