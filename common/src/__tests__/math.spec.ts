import { expect } from 'chai'
import { bnSqrt } from '../index'
import { toBigInt } from 'ethers'

const UNIT = BigInt(10) ** BigInt(18)
const cases = [
  [0n, 0n],
  [1n, 1n],
  [4n, 2n],
  [100n, 10n],
]

/**
 * Get a random number in range
 * @param min minimum number
 * @param max maximum number
 * @returns random number
 */
function getRandom(min: number, max: number) {
  return Math.floor(Math.random() * (max - min) + min)
}

describe('bnSqrt', function() {
  it('should throw if value less than 0', function() {
    expect(bnSqrt.bind(bnSqrt, -1n)).to.throw('Complex numbers not support')
  })

  for (const test of cases) {
    const [val, expected] = test
    it(`bnSqrt(${val}) === ${expected}`, function() {
      expect(bnSqrt(val)).to.eq(expected)
    })
  }

  it('Sqrt(8) throws as it took too long to calculate', function() {
    expect(bnSqrt.bind(bnSqrt, 8n)).to.throw('Sqrt took too long to calculate')
  })

  it('testing random bigints', function() {
    for (let i = 0; i < 100; i++) {
      const rand = toBigInt(getRandom(5, 200)) * UNIT
      const sqrtVal = bnSqrt(rand)
      const val = sqrtVal * sqrtVal
      expect(bnSqrt(val)).to.eq(sqrtVal)
    }
  })
})
