import { expect } from 'chai'
import { Keypair, PubKey } from '../keypair'
import { Wallet, sha256, randomBytes } from 'ethers'

describe('keypair', function () {
  for (let i = 0; i < 10; i++) {
    it(`should generate key ${i} from seed successfully`, function () {
      const wallet = Wallet.createRandom()
      const signature = wallet.signMessageSync(randomBytes(32).toString())
      const seed = sha256(signature)
      const keypair = Keypair.createFromSeed(seed)
      expect(keypair.pubKey.serialize()).to.match(/^macipk./)
    })
  }

  it('should throw if pubKey is invalid', () => {
    expect(() => {
      new PubKey([1n, 1n])
    }).to.throw('PubKey not on curve')
  })
})
