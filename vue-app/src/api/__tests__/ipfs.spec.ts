import { expect } from 'vitest'
import { IPFS } from '@/api/ipfs'

describe('ipfs', () => {
  describe('isValidCid()', () => {
    it('should return true for valid CID', async () => {
      const hash = 'QmQ7wdiWd4DUWfWpGmKCnDEMEopMGT4hg5PubALhBQfPF9'
      expect(IPFS.isValidCid(hash)).to.be.true
    })

    it('should return false for empty CID', async () => {
      const hash = ''
      expect(IPFS.isValidCid(hash)).to.be.false
    })

    it('should return false for invalid CID', async () => {
      const hash = 'invalid'
      expect(IPFS.isValidCid(hash)).to.be.false
    })
  })
})
