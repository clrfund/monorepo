import { BigNumber } from 'ethers'

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
export const UNIT = BigNumber.from(10).pow(BigNumber.from(18))
export const VOICE_CREDIT_FACTOR = BigNumber.from(10).pow(4 + 18 - 9)

